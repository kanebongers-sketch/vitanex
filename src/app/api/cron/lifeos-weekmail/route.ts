// ─── LifeOS — GET /api/cron/lifeos-weekmail ─────────────────────────────────
// Elke maandagochtend een persoonlijke week-terugblik per e-mail: wat je afrondde,
// hoe de maand er financieel voor staat, en welke contacten verwateren. De dagmail
// kijkt vooruit (je dag); deze kijkt terug (je week).
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Server-to-server, net als `cron/dagplanning-mail`: geen ingelogde sessie. Het
// slot is het gedeelde CRON_SECRET (fail-closed: leeg = niemand komt binnen). De
// lezen lopen via de service-role op de vaste lifeosUserId() — single-tenant.
//
// ─── INPLANNEN (dit doet zichzelf niet) ─────────────────────────────────────
// Render kent geen cron-veld in de repo; de klok staat in
// `.github/workflows/lifeos-weekmail.yml`, die deze route maandagochtend aanroept.
// Zet daarvoor CRON_SECRET in de repo-secrets (zelfde waarde als in Render).
//
// ─── IDEMPOTENTIE (bewuste keuze) ───────────────────────────────────────────
// Anders dan de dagmail claimt deze route GEEN per-dag-slot in `vita_briefingen`.
// Dat slot bestaat omdat de dagmail door TWEE planners geraakt wordt (cron-job.org
// + GitHub als back-up) en dan nooit dubbel mag sturen. De weekmail heeft precies
// één planner (de GitHub-workflow, met een concurrency-guard). Één planner = geen
// race, dus geen slot nodig — en het `vita_briefingen.kanaal`-check-constraint kent
// alleen 'telegram'/'email', dus een 'weekmail'-kanaal zou eerst een migratie
// vragen. Komt er ooit een tweede trigger bij: voeg dan dat kanaal + de claim toe
// (spiegel `dagplanning-mail`), niet eerder.

import { type NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { haalTransacties, haalFacturen } from '@/lib/lifeos/finance/opslag'
import { bouwOverzicht } from '@/lib/lifeos/finance/finance'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import {
  bouwWeekmail,
  afgerondeTakenSinds,
  koudeContacten,
  type WeekFinance,
} from '@/lib/lifeos/weekmail/weekmail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAIL_VAN = 'MentaForce <onboarding@resend.dev>'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function ontvanger(): string {
  return process.env.LIFEOS_DAGPLANNING_MAIL?.trim() || 'kanebongers@gmail.com'
}

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}
function klaar(body: Record<string, unknown>): Response {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

function secretGeldig(req: NextRequest): boolean {
  const gegeven = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  return geheimGelijk(process.env.CRON_SECRET ?? '', gegeven)
}

/** Titels van wat je de afgelopen zeven dagen afvinkte. Best-effort → leeg bij fout. */
async function haalAfgerond(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
  vanaf: Date,
  tot: Date,
): Promise<string[]> {
  const taken = await haalTaken(admin, userId).catch((oorzaak) => {
    console.error('[weekmail] taken ophalen mislukt', oorzaak)
    return { ok: false as const, reden: 'db' as const }
  })
  if (!taken.ok) return []
  return afgerondeTakenSinds(taken.waarde, vanaf, tot).map((t) => t.titel)
}

/** De financiële maandstand, of `null` als een bron omviel (dan geen finance-sectie). */
async function haalFinance(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
  nu: Date,
): Promise<WeekFinance | null> {
  const maand = datumSleutel(nu).slice(0, 7)
  const vandaag = datumSleutel(nu)
  const [transacties, facturen] = await Promise.all([
    haalTransacties(admin, userId, { maand }).catch(() => ({ ok: false as const, reden: 'db' as const })),
    haalFacturen(admin, userId).catch(() => ({ ok: false as const, reden: 'db' as const })),
  ])
  // Fout ≠ leeg: viel een bron om, dan geen verzonnen nul-maand maar géén sectie.
  if (!transacties.ok || !facturen.ok) {
    console.error('[weekmail] finance ophalen mislukt')
    return null
  }
  const overzicht = bouwOverzicht(transacties.waarde, facturen.waarde, maand, vandaag)
  return {
    maandLabel: nu.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', month: 'long' }),
    omzet: overzicht.omzet,
    kosten: overzicht.kosten,
    winst: overzicht.winst,
    openstaand: overzicht.openstaand,
    verlopenAantal: overzicht.verlopenAantal,
  }
}

/** Contacten die verwateren (koud). Best-effort → leeg bij fout. */
async function haalKoud(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
  nu: Date,
): Promise<{ naam: string; dagen: number }[]> {
  const personen = await haalPersonen(admin, userId).catch((oorzaak) => {
    console.error('[weekmail] CRM ophalen mislukt', oorzaak)
    return { ok: false as const, reden: 'db' as const }
  })
  if (!personen.ok) return []
  return koudeContacten(personen.waarde, nu)
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!secretGeldig(req)) return fout('Unauthorized', 401)

  if (!process.env.RESEND_API_KEY) {
    return fout('RESEND_API_KEY ontbreekt — geen mailer.', 503)
  }

  let admin: ReturnType<typeof createLifeosAdminClient>
  let userId: string
  try {
    admin = createLifeosAdminClient()
    userId = lifeosUserId()
  } catch (oorzaak) {
    const melding = oorzaak instanceof Error ? oorzaak.message : 'Configuratie ontbreekt.'
    console.error('[weekmail] configuratiefout:', melding)
    return fout(melding, 503)
  }

  const nu = new Date()
  const vanaf = new Date(nu.getTime() - WEEK_MS)

  // Alle bronnen best-effort en parallel: één trage of gevallen bron mag de mail
  // niet tegenhouden. Elke helper vangt zijn eigen fout en levert leeg/null op.
  const [afgerondeTaken, finance, koud] = await Promise.all([
    haalAfgerond(admin, userId, vanaf, nu),
    haalFinance(admin, userId, nu),
    haalKoud(admin, userId, nu),
  ])

  const mail = bouwWeekmail(nu, { afgerondeTaken, finance, koudeContacten: koud })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: MAIL_VAN,
      to: ontvanger(),
      subject: mail.onderwerp,
      html: mail.html,
      text: mail.tekst,
    })
    if (error) {
      console.error('[weekmail] Resend-fout:', error)
      return fout('De weekmail kon niet worden verzonden.', 502)
    }
  } catch (oorzaak) {
    console.error('[weekmail] mail versturen mislukt', oorzaak)
    return fout('De weekmail kon niet worden verzonden.', 502)
  }

  return klaar({
    verstuurd: true,
    afgerond: afgerondeTaken.length,
    finance: finance !== null,
    koudeContacten: koud.length,
  })
}
