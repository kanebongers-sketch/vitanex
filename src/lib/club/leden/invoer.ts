// ─── Fit Factory Club: invoer voor de ledenkaart (PUUR) ─────────────────────
// Systeemgrens: wat er van de pagina binnenkomt (notities, coach, tags, status,
// lidmaatschapsvorm en datums) wordt
// hier gecontroleerd voordat het de database in gaat.

import { LID_STATUSSEN, type LidStatus } from '@/lib/club/kern/lid'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export const MAX_NOTITIE = 2000
export const MAX_TAGS = 12
export const MAX_TAG = 30

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

export interface NotitieInvoer {
  tekst: string
  vastgepind: boolean
}

export function leesNotitie(body: unknown): Uitslag<NotitieInvoer> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const tekst = typeof o.tekst === 'string' ? o.tekst.trim() : ''
  if (!tekst) return { ok: false, fout: 'Schrijf eerst een notitie.' }
  if (tekst.length > MAX_NOTITIE) return { ok: false, fout: `Een notitie mag maximaal ${MAX_NOTITIE} tekens zijn.` }
  return { ok: true, waarde: { tekst, vastgepind: o.vastgepind === true } }
}

export function leesVastpinnen(body: unknown): Uitslag<boolean> {
  const o = object(body)
  if (!o || typeof o.vastgepind !== 'boolean') return { ok: false, fout: 'Ongeldige invoer.' }
  return { ok: true, waarde: o.vastgepind }
}

/** "PT interesse " wordt "pt-interesse". Leeg of ongeldig = null. */
export function normaliseerTag(ruw: string): string | null {
  const tag = ruw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return tag && tag.length <= MAX_TAG ? tag : null
}

export interface LidWijziging {
  /** undefined = niet wijzigen, null = geen coach. */
  coachId?: string | null
  tags?: string[]
  /** De status van het lid (proeflid, actief, gepauzeerd, opgezegd, gestopt). */
  status?: LidStatus
  /** De naam van de lidmaatschapsvorm (club_leden.abonnement); null = geen vorm. */
  abonnement?: string | null
  /** Datums als yyyy-mm-dd; null = leeg maken. */
  lidSinds?: string | null
  einddatum?: string | null
  pauzeVan?: string | null
  pauzeTot?: string | null
}

export const MAX_ABONNEMENT = 80
const DATUM_VELDEN = ['lidSinds', 'einddatum', 'pauzeVan', 'pauzeTot'] as const
type DatumVeld = (typeof DATUM_VELDEN)[number]
const DATUM_NAAM: Record<DatumVeld, string> = { lidSinds: 'lid sinds', einddatum: 'einddatum', pauzeVan: 'pauze vanaf', pauzeTot: 'pauze tot' }

/** Een echte kalenderdag als yyyy-mm-dd (geen 31 februari). */
export function isDatumSleutel(v: unknown): v is string {
  if (typeof v !== 'string') return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
}

function leesDatums(o: Record<string, unknown>, wijziging: LidWijziging): string | null {
  for (const veld of DATUM_VELDEN) {
    if (!(veld in o)) continue
    const v = o[veld]
    if (v !== null && !isDatumSleutel(v)) return `Kies een geldige datum bij ${DATUM_NAAM[veld]}.`
    wijziging[veld] = v
  }
  const { pauzeVan, pauzeTot } = wijziging
  if (pauzeVan && pauzeTot && pauzeTot < pauzeVan) return 'De pauze kan niet eindigen voordat hij begint.'
  return null
}

function leesAbonnement(v: unknown): Uitslag<string | null> {
  if (v === null) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'Kies een lidmaatschapsvorm.' }
  const naam = v.trim().replace(/\s+/g, ' ')
  if (naam === '') return { ok: true, waarde: null }
  if (naam.length > MAX_ABONNEMENT) return { ok: false, fout: `De naam van de vorm is langer dan ${MAX_ABONNEMENT} tekens.` }
  return { ok: true, waarde: naam }
}

function leesTags(v: unknown): Uitslag<string[]> {
  if (!Array.isArray(v) || !v.every((t) => typeof t === 'string')) return { ok: false, fout: 'Tags moeten een lijst met tekst zijn.' }
  const tags: string[] = []
  for (const ruw of v) {
    const tag = normaliseerTag(ruw)
    if (!tag) return { ok: false, fout: `Tag "${ruw.slice(0, 40)}" is leeg of langer dan ${MAX_TAG} tekens.` }
    if (!tags.includes(tag)) tags.push(tag)
  }
  if (tags.length > MAX_TAGS) return { ok: false, fout: `Maximaal ${MAX_TAGS} tags per lid.` }
  return { ok: true, waarde: tags }
}

export function leesLidWijziging(body: unknown): Uitslag<LidWijziging> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const wijziging: LidWijziging = {}
  if ('coachId' in o) {
    if (o.coachId !== null && !isUuid(o.coachId)) return { ok: false, fout: 'Onbekende coach.' }
    wijziging.coachId = o.coachId
  }
  if ('tags' in o) {
    const tags = leesTags(o.tags)
    if (!tags.ok) return tags
    wijziging.tags = tags.waarde
  }
  if ('status' in o) {
    if (!(LID_STATUSSEN as readonly unknown[]).includes(o.status)) return { ok: false, fout: 'Kies een geldige status.' }
    wijziging.status = o.status as LidStatus
  }
  if ('abonnement' in o) {
    const abonnement = leesAbonnement(o.abonnement)
    if (!abonnement.ok) return abonnement
    wijziging.abonnement = abonnement.waarde
  }
  const datumFout = leesDatums(o, wijziging)
  if (datumFout) return { ok: false, fout: datumFout }
  if (Object.values(wijziging).every((w) => w === undefined)) return { ok: false, fout: 'Er is niets om te wijzigen.' }
  return { ok: true, waarde: wijziging }
}
