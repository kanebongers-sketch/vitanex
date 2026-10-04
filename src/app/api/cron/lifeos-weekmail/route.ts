// ─── LifeOS — GET /api/cron/lifeos-weekmail ─────────────────────────────────
// Elke maandagochtend een persoonlijke week-terugblik per e-mail: wat je afrondde,
// welke PT-klanten afhaken en welke contacten verwateren. De dagmail
// kijkt vooruit (je dag); deze kijkt terug (je week).
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Server-to-server, net als `cron/dagplanning-mail`: geen ingelogde sessie. Het
// slot is het gedeelde CRON_SECRET (fail-closed: leeg = niemand komt binnen). De
// lezen lopen via de service-role op de vaste lifeosUserId() — single-tenant.
//
// ─── INPLANNEN ──────────────────────────────────────────────────────────────────────
// Twee klokken: de database (pg_cron, migratie 270 — op de minuut, maandag 06:00
// UTC) en `.github/workflows/lifeos-weekmail.yml` als back-up. Beide sturen het
// gedeelde CRON_SECRET mee.
//
// ─── IDEMPOTENTIE ─────────────────────────────────────────────────────────────────────
// Twee planners = een race. Daarom claimt deze route, net als de dagmail, één
// verzending per dag in `vita_briefingen` (kanaal 'weekmail', migratie 280): wie
// de insert wint, stuurt; de rest zwijgt. Een goedkope voor-check stopt een latere
// aanroep al vóór alle leeswerk.

import { type NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { haalPersonenMetAgenda } from '@/lib/lifeos/crm/agenda-contact-ophalen'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { haalPtSignalen } from '@/lib/lifeos/pt-klant/afhaak-ophalen'
import { haalEventsUitCache } from '@/lib/lifeos/agenda/opslag'
import { haalCategorieRegels } from '@/lib/lifeos/agenda/categorie-opslag'
import { tijdPerCategorie, type CategorieTijd } from '@/lib/lifeos/weekmail/agenda-tijd'
import { lokaleTijd } from '@/lib/lifeos/vita/signalen'
import { alGeclaimdVandaag, claimBriefing, geefClaimTerug, markeerBezorgd } from '@/lib/lifeos/vita/briefing-opslag'
import {
  bouwWeekmail,
  afgerondeTakenSinds,
  koudeContacten,
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

/**
 * Agenda-uren van de afgelopen week per categorie, uit de agenda-cache (geen
 * Google-call). Best-effort: faalt de cache, dan geen sectie in plaats van een
 * misleidende "0 uur".
 */
async function haalAgendaTijd(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
  personen: readonly Persoon[],
  vanaf: Date,
  nu: Date,
): Promise<CategorieTijd[]> {
  try {
    const [events, regels] = await Promise.all([
      haalEventsUitCache(admin, userId, vanaf, nu),
      haalCategorieRegels(admin, userId),
    ])
    if (!events.ok) return []
    return tijdPerCategorie(events.waarde, personen, regels.ok ? regels.waarde : new Map())
  } catch (oorzaak) {
    console.error('[weekmail] agenda-tijd ophalen mislukt', oorzaak)
    return []
  }
}

/** De CRM-personen, best-effort → leeg bij fout. Gedeeld door "verwaterend contact" en "afhaak". */
async function haalCrmPersonen(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
): Promise<Persoon[]> {
  const personen = await haalPersonenMetAgenda(admin, userId, new Date()).catch((oorzaak) => {
    console.error('[weekmail] CRM ophalen mislukt', oorzaak)
    return { ok: false as const, reden: 'db' as const }
  })
  return personen.ok ? personen.waarde : []
}

/**
 * Zelf-evaluatie: wat LifeOS zelf deed, over de afspraken van de afgelopen week.
 * Telt de afspraken die het aantoonbaar zelf benoemde (hernoem_geschreven gezet) en hoe vaak jij dat corrigeerde
 * (hernoem_geblokkeerd). Best-effort: een gevallen query → `null` → geen sectie.
 */
async function haalZelf(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
  vanaf: Date,
  tot: Date,
): Promise<WeekZelf | null> {
  try {
    const [hernoemd, gecorrigeerd] = await Promise.all([
      admin
        .from('agenda_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_op', vanaf.toISOString())
        .lt('start_op', tot.toISOString())
        .not('hernoem_geschreven', 'is', null),
      admin
        .from('agenda_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_op', vanaf.toISOString())
        .lt('start_op', tot.toISOString())
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
  const [afgerondeTaken, personen, zelf] = await Promise.all([
    haalAfgerond(admin, userId, vanaf, nu),
    haalCrmPersonen(admin, userId),
    haalZelf(admin, userId, vanaf, nu),
  ])
  const koud = koudeContacten(personen, nu)
  const [{ afhaak }, agendaTijd] = await Promise.all([
    haalPtSignalen(admin, userId, personen, nu),
    haalAgendaTijd(admin, userId, personen, vanaf, nu),
  ])

  const mail = bouwWeekmail(nu, { afgerondeTaken, koudeContacten: koud, afhaak, agendaTijd, zelf })

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
    koudeContacten: koud.length,
    afhaak: afhaak.length,
    zelf: zelf ?? undefined,
  })
}
