// ─── Fit Factory Club: invoer voor de ledenkaart (PUUR) ─────────────────────
// Systeemgrens: wat er van de pagina binnenkomt (notities, coach, tags) wordt
// hier gecontroleerd voordat het de database in gaat.

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
  if (wijziging.coachId === undefined && wijziging.tags === undefined) return { ok: false, fout: 'Er is niets om te wijzigen.' }
  return { ok: true, waarde: wijziging }
}
