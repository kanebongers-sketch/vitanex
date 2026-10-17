// ─── Club: invoer van de berichten-API controleren (PUUR) ──────────────────
// Alles wat van buiten komt is `unknown` en wordt hier genarrowd. Foutteksten
// zijn Nederlands en kunnen zo in de interface getoond worden.

import type { LidStatus } from '@/lib/club/kern/lid'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { TAG_MAX, TEKST_MAX, TITEL_MAX, isLidStatus, isSoort, type BerichtSoort } from './model'
import { lokaalNaarDatum } from './tijd'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const goed = <T>(waarde: T): Uitkomst<T> => ({ ok: true, waarde })
const fout = <T>(tekst: string): Uitkomst<T> => ({ ok: false, fout: tekst })

/** De velden zoals ze in club_berichten komen (zonder user_id en auteur). */
export interface BerichtVelden {
  titel: string
  tekst: string
  soort: BerichtSoort
  vestigingen: string[]
  statussen: LidStatus[]
  tag: string | null
  zichtbaar_van: string
  zichtbaar_tot: string | null
  vastgepind: boolean
}

function obj(body: unknown): Record<string, unknown> | null {
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null
}

function uniek<T>(lijst: readonly T[]): T[] {
  return [...new Set(lijst)]
}

function leesTekstvelden(r: Record<string, unknown>): Uitkomst<Pick<BerichtVelden, 'titel' | 'tekst' | 'tag'>> {
  const titel = typeof r.titel === 'string' ? r.titel.trim() : ''
  if (!titel) return fout('Geef het bericht een titel.')
  if (titel.length > TITEL_MAX) return fout(`De titel mag maximaal ${TITEL_MAX} tekens zijn.`)
  if (r.tekst !== undefined && typeof r.tekst !== 'string') return fout('De tekst is onleesbaar.')
  const tekst = typeof r.tekst === 'string' ? r.tekst.replace(/\r\n?/g, '\n').trim() : ''
  if (tekst.length > TEKST_MAX) return fout(`De tekst mag maximaal ${TEKST_MAX} tekens zijn.`)
  const tag = typeof r.tag === 'string' && r.tag.trim() ? r.tag.trim() : null
  if (tag && tag.length > TAG_MAX) return fout(`Een tag mag maximaal ${TAG_MAX} tekens zijn.`)
  return goed({ titel, tekst, tag })
}

function leesDoelgroep(r: Record<string, unknown>, toegestaan: readonly string[]): Uitkomst<Pick<BerichtVelden, 'vestigingen' | 'statussen'>> {
  const vRuw = r.vestigingen ?? []
  const sRuw = r.statussen ?? []
  if (!Array.isArray(vRuw) || !vRuw.every(isVestigingSlug)) return fout('Kies geldige vestigingen.')
  if (!vRuw.every((v) => toegestaan.includes(v))) return fout('Een van de vestigingen hoort niet bij deze sportschool.')
  if (!Array.isArray(sRuw) || !sRuw.every(isLidStatus)) return fout('Kies geldige lidstatussen.')
  const vestigingen = uniek(vRuw)
  // Alle vestigingen aangevinkt is hetzelfde als "alle": dan geldt het ook voor een nieuwe vestiging.
  const alle = toegestaan.length > 0 && toegestaan.every((v) => vestigingen.includes(v))
  return goed({ vestigingen: alle ? [] : vestigingen, statussen: uniek(sRuw) })
}

function leesVenster(r: Record<string, unknown>, nu: Date): Uitkomst<Pick<BerichtVelden, 'zichtbaar_van' | 'zichtbaar_tot'>> {
  const vanRuw = typeof r.van === 'string' ? r.van.trim() : ''
  const totRuw = typeof r.tot === 'string' ? r.tot.trim() : ''
  const van = vanRuw ? lokaalNaarDatum(vanRuw) : nu
  if (!van) return fout('De begindatum is ongeldig.')
  const tot = totRuw ? lokaalNaarDatum(totRuw) : null
  if (totRuw && !tot) return fout('De einddatum is ongeldig.')
  if (tot && tot.getTime() <= van.getTime()) return fout('De einddatum moet na de begindatum liggen.')
  return goed({ zichtbaar_van: van.toISOString(), zichtbaar_tot: tot ? tot.toISOString() : null })
}

/** Een nieuw of bewerkt bericht. `toegestaan` = de vestigingen van deze sportschool. */
export function leesBericht(body: unknown, toegestaan: readonly string[], nu: Date): Uitkomst<BerichtVelden> {
  const r = obj(body)
  if (!r) return fout('Onleesbare invoer.')
  if (!isSoort(r.soort)) return fout('Kies of het nieuws, een actie of belangrijk is.')
  const teksten = leesTekstvelden(r)
  if (!teksten.ok) return teksten
  const doelgroep = leesDoelgroep(r, toegestaan)
  if (!doelgroep.ok) return doelgroep
  const venster = leesVenster(r, nu)
  if (!venster.ok) return venster
  return goed({ ...teksten.waarde, ...doelgroep.waarde, ...venster.waarde, soort: r.soort, vastgepind: r.vastgepind === true })
}

export type BerichtActie = { actie: 'bewerken'; body: unknown } | { actie: 'vastpinnen'; vastgepind: boolean } | { actie: 'stoppen' }

/** PATCH-body: { actie: 'vastpinnen', vastgepind }, { actie: 'stoppen' } of { actie: 'bewerken', ...velden }. */
export function leesActie(body: unknown): Uitkomst<BerichtActie> {
  const r = obj(body)
  if (!r) return fout('Onleesbare invoer.')
  if (r.actie === 'vastpinnen') {
    if (typeof r.vastgepind !== 'boolean') return fout('Kies vastpinnen of losmaken.')
    return goed({ actie: 'vastpinnen', vastgepind: r.vastgepind })
  }
  if (r.actie === 'stoppen') return goed({ actie: 'stoppen' })
  if (r.actie === 'bewerken') return goed({ actie: 'bewerken', body: r })
  return fout('Onbekende actie.')
}

/**
 * Nu stoppen: het einde wordt nu. Een gepland bericht dat nog niet begon,
 * begint en eindigt dan ook nu (de database eist einde na begin).
 */
export function stopVenster(van: string, nu: Date): { zichtbaar_van: string; zichtbaar_tot: string } {
  const eind = nu.toISOString()
  const begin = Date.parse(van) < nu.getTime() ? van : new Date(nu.getTime() - 1000).toISOString()
  return { zichtbaar_van: begin, zichtbaar_tot: eind }
}
