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
// ─── INPLANNEN ──────────────────────────────────────────────────────────────
// Twee klokken: de database (pg_cron, migratie 270 — op de minuut, maandag 06:00
// UTC) en `.github/workflows/lifeos-weekmail.yml` als back-up. Beide sturen het
// gedeelde CRON_SECRET mee.
//
// ─── IDEMPOTENTIE ───────────────────────────────────────────────────────────
// Twee planners = een race. Daarom claimt deze route, net als de dagmail, één
// verzending per dag in `vita_briefingen` (kanaal 'weekmail', migratie 280): wie
// de insert wint, stuurt; de rest zwijgt. Een goedkope voor-check stopt een latere
// aanroep al vóór alle leeswerk.

import { type NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { haalTransacties, haalFacturen } from '@/lib/lifeos/finance/opslag'
import { bouwOverzicht } from '@/lib/lifeos/finance/finance'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { haalAfhaak } from '@/lib/lifeos/pt-klant/afhaak-ophalen'
import { lokaleTijd } from '@/lib/lifeos/vita/signalen'
import { alGeclaimdVandaag, claimBriefing, geefClaimTerug, markeerBezorgd } from '@/lib/lifeos/vita/briefing-opslag'
import {
  bouwWeekmail,
  afgerondeTakenSinds,
  koudeContacten,
  type WeekFinance,
  type WeekZelf,
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

/** De CRM-personen, best-effort → leeg bij fout. Gedeeld door "verwaterend contact" en "afhaak". */
async function haalCrmPersonen(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
): Promise<Persoon[]> {
  const personen = await haalPersonen(admin, userId).catch((oorzaak) => {
    console.error('[weekmail] CRM ophalen mislukt', oorzaak)
    return { ok: false as const, reden: 'db' as const }
  })
  return personen.ok ? personen.waarde : []
}

/**
 * Zelf-evaluatie: wat LifeOS zelf deed. Telt de afspraken die het aantoonbaar zelf
 * benoemde (hernoem_geschreven gezet) en hoe vaak jij dat corrigeerde
 * (hernoem_geblokkeerd). Best-effort: een gevallen query → `null` → geen sectie.
 */
async function haalZelf(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
): Promise<WeekZelf | null> {
  try {
    const [hernoemd, gecorrigeerd] = await Promise.all([
      admin
        .from('agenda_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('hernoem_geschreven', 'is', null),
      admin
        .from('agenda_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('hernoem_geblokkeerd', true),
    ])
    if (hernoemd.error || gecorrigeerd.error) {
      console.error('[weekmail] zelf-evaluatie tellen mislukt')
      return null
    }
    return { hernoemd: hernoemd.count ?? 0, gecorrigeerd: gecorrigeerd.count ?? 0 }
  } catch (oorzaak) {
    console.error('[weekmail] zelf-evaluatie wierp een fout', oorzaak)
    return null
  }
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
  const datum = lokaleTijd(nu).datum

  // Goedkope voor-check: is de weekmail van vandaag al geclaimd (door de andere
  // klok)? Dan stoppen vóór alle leeswerk. Het échte slot is de claim hieronder.
  if ((await alGeclaimdVandaag(admin, userId, datum, 'weekmail')) === true) {
    return klaar({ verstuurd: false, reden: 'vandaag al verstuurd', datum })
  }

  // Alle bronnen best-effort en parallel: één trage of gevallen bron mag de mail
  // niet tegenhouden. Elke helper vangt zijn eigen fout en levert leeg/null op.
  const [afgerondeTaken, finance, personen, zelf] = await Promise.all([
    haalAfgerond(admin, userId, vanaf, nu),
    haalFinance(admin, userId, nu),
    haalCrmPersonen(admin, userId),
    haalZelf(admin, userId),
  ])
  const koud = koudeContacten(personen, nu)
  const afhaak = await haalAfhaak(admin, userId, personen, nu)

  const mail = bouwWeekmail(nu, { afgerondeTaken, finance, koudeContacten: koud, afhaak, zelf })

  // Claim vlak vóór het sturen (spiegelt de dagmail): de insert is het slot.
  const claim = await claimBriefing(admin, userId, datum, 'weekmail')
  if (claim.soort === 'bezet') {
    return klaar({ verstuurd: false, reden: 'vandaag al verstuurd', datum })
  }
  if (claim.soort === 'fout') {
    console.error('[weekmail] claim mislukt:', claim.melding)
    return fout('Kon de weekmail niet vastleggen; niets verstuurd.', 503)
  }

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
      await geefClaimTerug(admin, claim.id)
      return fout('De weekmail kon niet worden verzonden.', 502)
    }
  } catch (oorzaak) {
    console.error('[weekmail] mail versturen mislukt', oorzaak)
    await geefClaimTerug(admin, claim.id)
    return fout('De weekmail kon niet worden verzonden.', 502)
  }

  await markeerBezorgd(admin, claim.id, mail.tekst, nu)

  return klaar({
    verstuurd: true,
    afgerond: afgerondeTaken.length,
    finance: finance !== null,
    koudeContacten: koud.length,
    afhaak: afhaak.length,
    zelf: zelf ?? undefined,
  })
}
