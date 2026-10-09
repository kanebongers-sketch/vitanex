// ─── LifeOS — PT-dashboard: wie kijkt er (SERVER-ONLY, voor pagina's) ───────
// Layout en pagina's van /[pt] vragen allebei "welke PT'er, en is dit toestel
// ingelogd?" — `cache` zorgt dat dat per request één keer naar de database gaat.
// Een eigenaar of beheerder krijgt hier geen eigen leads, maar het hele team.

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { CODE_PATROON, dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { beoordeelSessie, kijktMee, leesSessie, vindLink, type LeadLink } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { haalLeadsVan } from '@/lib/lifeos/leads/opslag'
import { haalKlantenVan } from './klanten-opslag'
import { haalDoelenVoor } from './doelen-opslag'
import { haalPtTeamGegevens } from './team-opslag'
import type { PtDoelen } from './doelen'
import { zonderPrijs } from './abonnementen'

export const ptSessie = cache(async (code: string) => {
  if (!CODE_PATROON.test(code)) return null
  const admin = createLifeosAdminClient()
  // Link en sessie tegelijk opzoeken: de cookienaam volgt uit de code in de URL
  // (vindLink zoekt op precies die code), dus we hoeven niet op de link te wachten.
  const token = (await cookies()).get(sessieCookieNaam(code))?.value
  const [link, sessie] = await Promise.all([vindLink(admin, code), leesSessie(admin, token)])
  if (!link) return null
  const ingelogd = await beoordeelSessie(admin, link, token, sessie, new Date())
  return { admin, link, ingelogd }
})

/** Wie kijkt er mee (eigenaar/beheerder)? Voor de pagina's die per rol een andere weergave kiezen. */
export const meekijker = cache(async (code: string) => {
  const s = await ptSessie(code)
  return s?.ingelogd && kijktMee(s.link.rol) ? s.link : null
})

/** Alles van één ingelogde PT'er: leads + klanten + doelen + vandaag. Null = niet ingelogd (of een eigenaar). */
export const ptGegevens = cache(async (code: string) => {
  const s = await ptSessie(code)
  if (!s?.ingelogd || s.link.rol !== 'pt') return null
  const [leads, klanten, doelen] = await Promise.all([
    haalLeadsVan(s.admin, s.link),
    haalKlantenVan(s.admin, s.link),
    haalDoelenVoor(s.admin, s.link.userId, [s.link.persoonId]),
  ])
  return {
    link: s.link,
    leads: leads.ok ? leads.waarde : null,
    // PT'ers zien geen bedragen: de afwijkende prijs gaat niet mee naar de browser.
    klanten: klanten.ok ? klanten.waarde.map(zonderPrijs) : null,
    // Doelen zijn optioneel: niet gezet of niet leesbaar → geen doelensectie.
    doelen: doelen.ok ? (doelen.waarde.get(s.link.persoonId) ?? null) : null,
    vandaag: dagSleutelNl(new Date()),
  }
})

/**
 * Alles wat een ingelogde eigenaar ziet: het hele actieve PT-team met leads,
 * klanten en doelen. Null = geen ingelogde eigenaar. `team` null = lezen mislukt.
 */
export const eigenaarGegevens = cache(async (code: string) => {
  const s = await ptSessie(code)
  if (!s?.ingelogd || !kijktMee(s.link.rol)) return null
  // De doelen komen in hetzelfde rondje als leads en klanten mee (zie team-opslag).
  const team = await haalPtTeamGegevens(s.admin, s.link.userId, { metDoelen: true })
  const doelen = team?.doelen ?? null
  return {
    admin: s.admin,
    link: s.link,
    team,
    // Doelen zijn een extra laag: niet leesbaar → overzicht zonder doelen.
    doelen: doelen?.ok ? doelen.waarde : new Map<string, PtDoelen>(),
    vandaag: dagSleutelNl(new Date()),
  }
})

/**
 * De link van de eigenaar, maar "als" een PT'er uit zijn team — voor de
 * lees-functies (dossier, check-in) die per PT'er filteren op user_id + persoon_id.
 */
export function alsPt(eigenaar: LeadLink, persoonId: string): LeadLink {
  return { ...eigenaar, rol: 'pt', persoonId }
}
