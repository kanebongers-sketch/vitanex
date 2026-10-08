// ─── LifeOS — PT-app: kennisbank (puur) ─────────────────────────────────────
// De leesbare inhoud van de Fit Factory PT-documenten (protocol, intake,
// abonnementen, Fit Guide, PT Academy, handleiding) staat in `pt_kennis`
// (migratie 355), nooit in deze openbare repo. Dit bestand kent alleen de VORM:
// het leest de jsonb-secties aan de systeemgrens (onbekend of kapot → overslaan)
// en doorzoekt ze. Geen database, geen React: alles hier is los te testen.

export const KENNIS_CATEGORIEEN = ['protocollen', 'klant', 'academy', 'handleiding', 'overig'] as const
export type KennisCategorie = (typeof KENNIS_CATEGORIEEN)[number]

export const CATEGORIE_LABEL: Record<KennisCategorie, string> = {
  protocollen: 'Protocollen',
  klant: 'Voor de klant',
  academy: 'PT Academy',
  handleiding: 'Handleiding',
  overig: 'Overig',
}

export const CATEGORIE_UITLEG: Record<KennisCategorie, string> = {
  protocollen: 'Hoe we werken, van lead tot nazorg.',
  klant: 'Wat de klant krijgt en leest.',
  academy: 'De trainingsdagen van de PT Academy.',
  handleiding: 'Het naslagwerk voor elke trainer.',
  overig: 'Losse stukken.',
}

export type KennisBlok =
  | { soort: 'tekst'; tekst: string }
  | { soort: 'lijst'; titel?: string; items: string[] }
  | { soort: 'stappen'; titel?: string; items: string[] }
  | { soort: 'tabel'; titel?: string; kolommen: string[]; rijen: string[][] }
  | { soort: 'tip'; titel?: string; tekst: string }

export interface KennisSectie {
  id: string
  kop: string
  blokken: KennisBlok[]
}

export interface KennisItemKort {
  slug: string
  titel: string
  ondertitel: string | null
  categorie: KennisCategorie
  bron: string | null
  documentId: string | null
  aantalSecties: number
}

export interface KennisItem extends Omit<KennisItemKort, 'aantalSecties'> {
  secties: KennisSectie[]
}

// ── Grenzen (ruim, maar een kapotte rij kan de pagina niet opblazen) ─────────
const MAX = { tekst: 6000, item: 1500, kop: 200, titel: 140, cel: 1500, items: 200, kolommen: 12, rijen: 300, blokken: 200, secties: 120 }
export const SLUG_PATROON = /^[a-z0-9-]{2,80}$/
const SECTIE_ID_PATROON = /^[a-z0-9-]{1,80}$/
const UUID_PATROON = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Rec = Record<string, unknown>
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Een niet-lege, opgeschoonde string binnen de grens, anders null. */
function tekstVan(x: unknown, max: number): string | null {
  if (typeof x !== 'string') return null
  const t = x.trim()
  return t.length > 0 && t.length <= max ? t : null
}

/** Lijst van strings: lege of te lange items vallen weg; niets over → null. */
function tekstenVan(x: unknown, max: number, maxAantal: number): string[] | null {
  if (!Array.isArray(x) || x.length > maxAantal) return null
  const uit = x.map((v) => tekstVan(v, max)).filter((v): v is string => v !== null)
  return uit.length > 0 ? uit : null
}

function metTitel<T extends object>(blok: T, titel: unknown): T & { titel?: string } {
  const t = tekstVan(titel, MAX.titel)
  return t ? { ...blok, titel: t } : blok
}

function leesTabel(r: Rec): KennisBlok | null {
  const kolommen = Array.isArray(r.kolommen) && r.kolommen.length <= MAX.kolommen ? r.kolommen.map((k) => (typeof k === 'string' ? k.trim() : null)) : null
  if (!kolommen || kolommen.length === 0 || kolommen.some((k) => k === null || k.length > MAX.cel)) return null
  if (!Array.isArray(r.rijen) || r.rijen.length > MAX.rijen) return null
  const rijen: string[][] = []
  for (const rij of r.rijen) {
    // Een rij met te veel cellen of niet-tekst slaan we over; te kort vullen we aan.
    if (!Array.isArray(rij) || rij.length > kolommen.length) continue
    if (!rij.every((c) => typeof c === 'string' && c.length <= MAX.cel)) continue
    const cellen = (rij as string[]).map((c) => c.trim())
    rijen.push([...cellen, ...Array<string>(kolommen.length - cellen.length).fill('')])
  }
  return rijen.length > 0 ? metTitel({ soort: 'tabel' as const, kolommen: kolommen as string[], rijen }, r.titel) : null
}

/** Eén blok aan de systeemgrens. Onbekende soort of ongeldige inhoud → null. */
export function leesBlok(x: unknown): KennisBlok | null {
  if (!isRec(x)) return null
  switch (x.soort) {
    case 'tekst': {
      const tekst = tekstVan(x.tekst, MAX.tekst)
      return tekst ? { soort: 'tekst', tekst } : null
    }
    case 'lijst':
    case 'stappen': {
      const items = tekstenVan(x.items, MAX.item, MAX.items)
      return items ? metTitel({ soort: x.soort, items }, x.titel) : null
    }
    case 'tabel':
      return leesTabel(x)
    case 'tip': {
      const tekst = tekstVan(x.tekst, MAX.tekst)
      return tekst ? metTitel({ soort: 'tip' as const, tekst }, x.titel) : null
    }
    default:
      return null
  }
}

/**
 * De `secties`-jsonb van een kennisitem, gevalideerd. Onbekende blokken en
 * secties zonder geldige id/kop of zonder één bruikbaar blok vallen weg; een
 * dubbele id telt maar één keer (anders springt de inhoudsopgave verkeerd).
 */
export function leesSecties(x: unknown): KennisSectie[] {
  if (!Array.isArray(x)) return []
  const uit: KennisSectie[] = []
  const gezien = new Set<string>()
  for (const s of x.slice(0, MAX.secties)) {
    if (!isRec(s)) continue
    const id = typeof s.id === 'string' && SECTIE_ID_PATROON.test(s.id) ? s.id : null
    const kop = tekstVan(s.kop, MAX.kop)
    if (!id || !kop || gezien.has(id) || !Array.isArray(s.blokken)) continue
    const blokken = s.blokken
      .slice(0, MAX.blokken)
      .map(leesBlok)
      .filter((b): b is KennisBlok => b !== null)
    if (blokken.length === 0) continue
    gezien.add(id)
    uit.push({ id, kop, blokken })
  }
  return uit
}

export const isCategorie = (x: unknown): x is KennisCategorie => typeof x === 'string' && (KENNIS_CATEGORIEEN as readonly string[]).includes(x)

/** Een rij uit `pt_kennis` (snake_case) → KennisItem, of null als de kern niet klopt. */
export function leesKennisRij(r: unknown): KennisItem | null {
  if (!isRec(r)) return null
  const slug = typeof r.slug === 'string' && SLUG_PATROON.test(r.slug) ? r.slug : null
  const titel = tekstVan(r.titel, MAX.titel)
  if (!slug || !titel || !isCategorie(r.categorie)) return null
  return {
    slug,
    titel,
    ondertitel: tekstVan(r.ondertitel, 300),
    categorie: r.categorie,
    bron: tekstVan(r.bron, 200),
    documentId: typeof r.document_id === 'string' && UUID_PATROON.test(r.document_id) ? r.document_id : null,
    secties: leesSecties(r.secties),
  }
}

/** Taal van de inhoud. Afspraak: een slug die eindigt op "-en" is Engelstalig (bv. de Engelse Fit Guide). */
export const taalVan = (slug: string): 'nl' | 'en' => (slug.endsWith('-en') ? 'en' : 'nl')

export function kort(item: KennisItem): KennisItemKort {
  const { secties, ...rest } = item
  return { ...rest, aantalSecties: secties.length }
}

/** Per categorie in vaste volgorde; lege categorieën vallen weg. Volgorde binnen blijft. */
export function perCategorie<T extends { categorie: KennisCategorie }>(items: readonly T[]): { categorie: KennisCategorie; label: string; items: T[] }[] {
  return KENNIS_CATEGORIEEN.map((categorie) => ({ categorie, label: CATEGORIE_LABEL[categorie], items: items.filter((i) => i.categorie === categorie) })).filter(
    (g) => g.items.length > 0,
  )
}

// ── Zoeken ────────────────────────────────────────────────────────────────────

/** Alle leesbare tekst van een blok, voor de zoekindex. */
export function blokTeksten(b: KennisBlok): string[] {
  switch (b.soort) {
    case 'tekst':
      return [b.tekst]
    case 'lijst':
    case 'stappen':
      return b.titel ? [b.titel, ...b.items] : b.items
    case 'tabel':
      return [...(b.titel ? [b.titel] : []), b.kolommen.join(' · '), ...b.rijen.map((r) => r.filter(Boolean).join(' · '))]
    case 'tip':
      return b.titel ? [b.titel, b.tekst] : [b.tekst]
  }
}

/** Compacte zoekbron: per item de secties als één platte tekst. Gaat naar de client. */
export interface ZoekDocument {
  slug: string
  titel: string
  ondertitel: string | null
  secties: { id: string; kop: string; tekst: string }[]
}

export function zoekDocument(item: KennisItem): ZoekDocument {
  return {
    slug: item.slug,
    titel: item.titel,
    ondertitel: item.ondertitel,
    secties: item.secties.map((s) => ({ id: s.id, kop: s.kop, tekst: s.blokken.flatMap(blokTeksten).join(' \n ') })),
  }
}

export interface ZoekTreffer {
  slug: string
  titel: string
  /** null = treffer op het item zelf (titel/ondertitel), niet op een sectie. */
  sectieId: string | null
  kop: string | null
  snippet: string
  score: number
}

/** Kleine letters, zonder accenten ("Caseïne" → "caseine"), met per teken de oorspronkelijke index. */
export function normaliseer(s: string): { norm: string; bron: number[] } {
  let norm = ''
  const bron: number[] = []
  for (let i = 0; i < s.length; i++) {
    const n = s[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    for (let j = 0; j < n.length; j++) {
      norm += n[j]
      bron.push(i)
    }
  }
  return { norm, bron }
}

/** Zoektermen: genormaliseerd, minstens 2 tekens, ontdubbeld, hoogstens 6. */
export function zoekTermen(query: string): string[] {
  const termen = normaliseer(query).norm.split(/[^a-z0-9€%]+/).filter((t) => t.length >= 2)
  return [...new Set(termen)].slice(0, 6)
}

const KORT = 3
const isWoordteken = (c: string | undefined) => c !== undefined && /[a-z0-9]/.test(c)

/**
 * Volgende plek van `term` in genormaliseerde tekst. Korte termen (≤ 3 tekens)
 * alleen aan het begin van een woord ("uur" vindt "uur", niet "duurt"); langere
 * overal, zodat "gewicht" ook "lichaamsgewicht" vindt.
 */
export function vindTerm(norm: string, term: string, vanaf = 0): number {
  for (let i = norm.indexOf(term, vanaf); i !== -1; i = norm.indexOf(term, i + 1)) {
    if (term.length > KORT || !isWoordteken(norm[i - 1])) return i
  }
  return -1
}

const bevat = (norm: string, term: string) => vindTerm(norm, term) !== -1

function telVoorkomens(hooiberg: string, term: string): number {
  let n = 0
  for (let i = vindTerm(hooiberg, term); i !== -1 && n < 50; i = vindTerm(hooiberg, term, i + term.length)) n++
  return n
}

/** Een stukje tekst rond de eerste treffer, afgekapt op woordgrenzen. */
export function maakSnippet(tekst: string, termen: readonly string[], breedte = 70): string {
  const vlak = tekst.replace(/\s+/g, ' ').trim()
  const { norm, bron } = normaliseer(vlak)
  const posities = termen.map((t) => vindTerm(norm, t)).filter((p) => p >= 0)
  const start = posities.length > 0 ? bron[Math.min(...posities)] : 0
  let van = Math.max(0, start - breedte)
  let tot = Math.min(vlak.length, start + breedte * 2)
  if (van > 0) {
    const spatie = vlak.indexOf(' ', van)
    van = spatie !== -1 && spatie < start ? spatie + 1 : van
  }
  if (tot < vlak.length) {
    const spatie = vlak.lastIndexOf(' ', tot)
    tot = spatie > start ? spatie : tot
  }
  return `${van > 0 ? '…' : ''}${vlak.slice(van, tot)}${tot < vlak.length ? '…' : ''}`
}

/** Splitst tekst in stukken met/zonder treffer, voor <mark> in de UI. */
export function markeer(tekst: string, termen: readonly string[]): { tekst: string; treffer: boolean }[] {
  if (termen.length === 0) return [{ tekst, treffer: false }]
  const { norm, bron } = normaliseer(tekst)
  const raak = new Array<boolean>(tekst.length).fill(false)
  for (const term of termen) {
    for (let i = vindTerm(norm, term); i !== -1; i = vindTerm(norm, term, i + term.length)) {
      for (let k = i; k < i + term.length; k++) raak[bron[k]] = true
    }
  }
  const uit: { tekst: string; treffer: boolean }[] = []
  for (let i = 0; i < tekst.length; i++) {
    const laatste = uit[uit.length - 1]
    if (laatste && laatste.treffer === raak[i]) laatste.tekst += tekst[i]
    else uit.push({ tekst: tekst[i], treffer: raak[i] })
  }
  return uit
}

const MAX_PER_ITEM = 3

function sectieTreffers(doc: ZoekDocument, termen: readonly string[]): ZoekTreffer[] {
  const uit: ZoekTreffer[] = []
  for (const s of doc.secties) {
    const kop = normaliseer(s.kop).norm
    const tekst = normaliseer(s.tekst).norm
    if (!termen.every((t) => bevat(kop, t) || bevat(tekst, t))) continue
    const score = termen.reduce((som, t) => som + (bevat(kop, t) ? 4 : 0) + Math.min(5, telVoorkomens(tekst, t)), 0)
    uit.push({ slug: doc.slug, titel: doc.titel, sectieId: s.id, kop: s.kop, snippet: maakSnippet(s.tekst, termen), score })
  }
  return uit.sort((a, b) => b.score - a.score).slice(0, MAX_PER_ITEM)
}

/**
 * Doorzoekt titels, koppen en teksten. Een sectie telt mee als ÁLLE termen erin
 * staan (kop of tekst); een item zelf als alle termen in titel/ondertitel staan.
 * Per item hoogstens drie secties, zodat één groot document de lijst niet vult.
 */
export function zoek(docs: readonly ZoekDocument[], query: string, max = 20): ZoekTreffer[] {
  const termen = zoekTermen(query)
  if (termen.length === 0) return []
  const treffers: ZoekTreffer[] = []
  for (const doc of docs) {
    const kopTekst = normaliseer(`${doc.titel} ${doc.ondertitel ?? ''}`).norm
    if (termen.every((t) => bevat(kopTekst, t))) {
      treffers.push({ slug: doc.slug, titel: doc.titel, sectieId: null, kop: null, snippet: doc.ondertitel ?? '', score: 10 * termen.length })
    }
    treffers.push(...sectieTreffers(doc, termen))
  }
  // Stabiel sorteren: gelijke score houdt de volgorde van de kennisbank.
  return treffers
    .map((t, i) => ({ t, i }))
    .sort((a, b) => b.t.score - a.t.score || a.i - b.i)
    .slice(0, max)
    .map(({ t }) => t)
}

/** Link naar een treffer: het item, of meteen de sectie. */
export function trefferHref(code: string, t: Pick<ZoekTreffer, 'slug' | 'sectieId'>): string {
  return `/${code}/bibliotheek/${t.slug}${t.sectieId ? `#${t.sectieId}` : ''}`
}
