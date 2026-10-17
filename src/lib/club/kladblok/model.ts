// ─── Fit Factory Club: notities à la Evernote (PUUR, ook client) ───────────
// Eén plek voor alles wat je anders in Evernote of een schriftje zet: overdracht
// tussen diensten, afspraken, kennis ("zo reset je de sauna") en ideeën. Per
// vestiging, of voor alle vestigingen. Vastpinnen, archiveren, zoeken.
// Tabel: club_kladblok (migratie 399; club_notities zijn de notities bij een lid).

import { isVestiging, type Vestiging } from '@/lib/club/kern/vestiging'

export const MAPPEN = ['algemeen', 'overdracht', 'afspraken', 'kennis', 'ideeen'] as const
export type KladMap = (typeof MAPPEN)[number]
export const MAP_LABEL: Record<KladMap, string> = {
  algemeen: 'Algemeen',
  overdracht: 'Overdracht',
  afspraken: 'Afspraken',
  kennis: 'Kennis',
  ideeen: 'Ideeën',
}
export const MAP_UITLEG: Record<KladMap, string> = {
  algemeen: 'Alles wat nergens anders past',
  overdracht: 'Wat de volgende dienst moet weten',
  afspraken: 'Wat er is afgesproken, met wie',
  kennis: 'Hoe iets werkt in de club',
  ideeen: 'Verbeteringen en plannen',
}
export const isMap = (v: unknown): v is KladMap => typeof v === 'string' && (MAPPEN as readonly string[]).includes(v)

export const MAX_TITEL = 160
export const MAX_INHOUD = 20000

export interface KladNotitie {
  id: string
  /** null = alle vestigingen. */
  vestiging: Vestiging | null
  map: KladMap
  titel: string
  inhoud: string
  vastgepind: boolean
  gearchiveerd: boolean
  auteur: string | null
  aangemaaktOp: string
  bijgewerktOp: string
}

export const KLAD_KOLOMMEN = 'id, vestiging, map, titel, inhoud, vastgepind, gearchiveerd, auteur, aangemaakt_op, bijgewerkt_op'

export function kladUitRij(ruw: unknown): KladNotitie | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const r = ruw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.titel !== 'string' || typeof r.aangemaakt_op !== 'string' || typeof r.bijgewerkt_op !== 'string') return null
  return {
    id: r.id,
    vestiging: isVestiging(r.vestiging) ? r.vestiging : null,
    map: isMap(r.map) ? r.map : 'algemeen',
    titel: r.titel,
    inhoud: typeof r.inhoud === 'string' ? r.inhoud : '',
    vastgepind: r.vastgepind === true,
    gearchiveerd: r.gearchiveerd === true,
    auteur: typeof r.auteur === 'string' ? r.auteur : null,
    aangemaaktOp: r.aangemaakt_op,
    bijgewerktOp: r.bijgewerkt_op,
  }
}

/** Een notitie uit een API-antwoord ({ notitie }), of null. */
export function leesKladAntwoord(ruw: unknown): KladNotitie | null {
  const o = typeof ruw === 'object' && ruw !== null ? (ruw as Record<string, unknown>) : null
  const n = o?.notitie
  if (typeof n !== 'object' || n === null) return null
  const x = n as Record<string, unknown>
  // Het antwoord is al camelCase: terugvertalen naar de rij-vorm en dezelfde controle gebruiken.
  return kladUitRij({ ...x, aangemaakt_op: x.aangemaaktOp, bijgewerkt_op: x.bijgewerktOp })
}

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export interface KladWijziging {
  titel?: string
  inhoud?: string
  map?: KladMap
  vestiging?: Vestiging | null
  vastgepind?: boolean
  gearchiveerd?: boolean
}

/** Regeleinden houden, rest netjes; max lengte. */
function inhoudVan(v: string): string {
  return v.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trimEnd().slice(0, MAX_INHOUD)
}

/**
 * Een wijziging (of, met `nieuw`, een nieuwe notitie). Alleen meegestuurde
 * velden tellen. Lege titel bij een nieuwe notitie = de eerste regel van de
 * inhoud, of "Naamloze notitie".
 */
export function leesKladWijziging(body: unknown, { nieuw = false } = {}): Lees<KladWijziging> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  const uit: KladWijziging = {}
  if (o.inhoud !== undefined) {
    if (typeof o.inhoud !== 'string') return { ok: false, fout: 'Ongeldige inhoud.' }
    uit.inhoud = inhoudVan(o.inhoud)
  }
  if (o.titel !== undefined || nieuw) {
    if (o.titel !== undefined && typeof o.titel !== 'string') return { ok: false, fout: 'Ongeldige titel.' }
    const t = (typeof o.titel === 'string' ? o.titel : '').replace(/\s+/g, ' ').trim().slice(0, MAX_TITEL)
    const uitInhoud = (uit.inhoud ?? '').split('\n').map((r) => r.trim()).find(Boolean)?.slice(0, MAX_TITEL)
    uit.titel = t || uitInhoud || 'Naamloze notitie'
  }
  if (o.map !== undefined) {
    if (!isMap(o.map)) return { ok: false, fout: 'Kies een geldige map.' }
    uit.map = o.map
  }
  if (o.vestiging !== undefined) {
    if (o.vestiging !== null && !isVestiging(o.vestiging)) return { ok: false, fout: 'Kies een geldige vestiging.' }
    uit.vestiging = o.vestiging
  }
  if (o.vastgepind !== undefined) uit.vastgepind = o.vastgepind === true
  if (o.gearchiveerd !== undefined) uit.gearchiveerd = o.gearchiveerd === true
  if (!nieuw && Object.keys(uit).length === 0) return { ok: false, fout: 'Er is niets om op te slaan.' }
  return { ok: true, waarde: uit }
}

// ─── Lijst: filteren, zoeken, sorteren ──────────────────────────────────────

export interface KladFilter {
  /** Deze vestiging plus de notities voor alle vestigingen. */
  vestiging: Vestiging
  map: KladMap | null
  zoek: string
  archief: boolean
}

/** Past deze notitie bij het filter? Zoeken doorzoekt titel en inhoud, hoofdletterongevoelig. */
export function pastKlad(n: KladNotitie, f: KladFilter): boolean {
  if (n.gearchiveerd !== f.archief) return false
  if (n.vestiging !== null && n.vestiging !== f.vestiging) return false
  if (f.map && n.map !== f.map) return false
  const q = f.zoek.trim().toLowerCase()
  return !q || `${n.titel}\n${n.inhoud}`.toLowerCase().includes(q)
}

/** Vastgepind eerst, daarna laatst bijgewerkt eerst. */
export function sorteerKlad(a: KladNotitie, b: KladNotitie): number {
  return Number(b.vastgepind) - Number(a.vastgepind) || b.bijgewerktOp.localeCompare(a.bijgewerktOp)
}

/** De eerste paar regels zonder lege regels, voor in de lijst. */
export function voorproef(inhoud: string, max = 140): string {
  const t = inhoud.replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

/** Zoveel dagen blijft een overdrachtsnotitie op Vandaag staan (vastgepind: altijd). */
export const OVERDRACHT_DAGEN = 3

/**
 * De overdracht voor het Vandaag-scherm: niet-gearchiveerde notities in de map
 * Overdracht die vastgepind zijn of in de laatste drie dagen zijn bijgewerkt.
 * Vastgepind eerst, dan nieuwste; maximaal `max`.
 */
export function overdrachtVoorVandaag(notities: readonly KladNotitie[], nu: Date, max = 4): KladNotitie[] {
  const grens = nu.getTime() - OVERDRACHT_DAGEN * 86_400_000
  return notities
    .filter((n) => n.map === 'overdracht' && !n.gearchiveerd && (n.vastgepind || Date.parse(n.bijgewerktOp) >= grens))
    .sort(sorteerKlad)
    .slice(0, max)
}
