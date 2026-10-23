// ─── PT-app — "Belangrijk" bovenaan het startscherm van de PT'ers (PUUR) ────
// Algemene aandachtspunten die voor elke PT'er gelden (bv. "Vraag om referrals")
// en die Kane zelf beheert, plus het punt "Geef je kledingmaten door" zolang een
// PT'er zijn maten nog niet heeft doorgegeven. Opslag: migratie 451 en
// belangrijk-opslag.ts. Wie wat mag: belangrijk-rechten.ts. Ook voor de browser.

import { STANDAARD_MATEN } from './kleding'

export const MAX_TITEL = 80
export const MAX_UITLEG = 300
export const MAX_LINK = 500
/** Ruimte tussen twee punten in de volgorde, zodat een nieuw punt er altijd achter past. */
const STAP = 10

export interface Aandachtspunt {
  id: string
  titel: string
  uitleg: string | null
  /** Een https-link of een pad binnen de app (begint met /), of null. */
  link: string | null
  volgorde: number
  actief: boolean
}

export interface Kledingmaten {
  /** Shirt, hoodie, jas. */
  boven: string
  /** Short, broek. */
  onder: string
}

/** De maten waaruit een PT'er kiest: dezelfde standaardmaten als de kleding zelf. */
export const KLEDINGMAAT_KEUZES: readonly string[] = STANDAARD_MATEN

// ─── Weergave ────────────────────────────────────────────────────────────────

/** Op volgorde, bij gelijke volgorde op titel (stabiel, ook voor oude rijen). */
export function sorteerPunten<T extends Pick<Aandachtspunt, 'volgorde' | 'titel'>>(punten: readonly T[]): T[] {
  return [...punten].sort((a, b) => a.volgorde - b.volgorde || a.titel.localeCompare(b.titel, 'nl'))
}

export interface BelangrijkVoorPt {
  /** Kledingmaten nog niet doorgegeven: dat punt staat dan als eerste bovenaan. */
  kledingOntbreekt: boolean
  open: Aandachtspunt[]
  gedaan: Aandachtspunt[]
}

/** Wat een PT'er bovenaan ziet: alleen actieve punten, open eerst, afgevinkte apart. */
export function belangrijkVoorPt(punten: readonly Aandachtspunt[], gedaanIds: ReadonlySet<string>, maten: Kledingmaten | null): BelangrijkVoorPt {
  const actief = sorteerPunten(punten.filter((p) => p.actief))
  return {
    kledingOntbreekt: maten === null,
    open: actief.filter((p) => !gedaanIds.has(p.id)),
    gedaan: actief.filter((p) => gedaanIds.has(p.id)),
  }
}

/** Aantal punten dat de PT'er nog moet oppakken (voor de kop "3 open"). */
export function aantalOpen(b: BelangrijkVoorPt): number {
  return b.open.length + (b.kledingOntbreekt ? 1 : 0)
}

/** Een link naar buiten (https) opent in een nieuw tabblad; een pad in de app niet. */
export function isExterneLink(link: string): boolean {
  return link.startsWith('https://')
}

/**
 * Waar een link heen gaat voor deze PT'er. Een pad is een pagina in zijn eigen
 * PT-app (Kane typt "/bibliotheek", Joey komt op "/joey/bibliotheek"); "/" is
 * zijn startscherm. Een https-link blijft zoals hij is.
 */
export function linkVoorPt(link: string, code: string): string {
  if (isExterneLink(link)) return link
  return link === '/' ? `/${code}` : `/${code}${link}`
}

// ─── Volgorde ────────────────────────────────────────────────────────────────

/** Volgorde voor een nieuw punt: achteraan. */
export function volgendeVolgorde(punten: readonly Pick<Aandachtspunt, 'volgorde'>[]): number {
  return punten.reduce((max, p) => Math.max(max, p.volgorde + STAP), 0)
}

/**
 * Een punt een plek omhoog of omlaag. Geeft de nieuwe volgorde van alle punten
 * terug (opnieuw genummerd in stappen van 10) maar alleen de rijen die echt
 * veranderen; leeg als het punt niet bestaat of al bovenaan/onderaan staat.
 */
export function verplaats(
  punten: readonly Aandachtspunt[],
  id: string,
  richting: 'op' | 'neer',
): { id: string; volgorde: number }[] {
  const lijst = sorteerPunten(punten)
  const i = lijst.findIndex((p) => p.id === id)
  const j = richting === 'op' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= lijst.length) return []
  ;[lijst[i], lijst[j]] = [lijst[j], lijst[i]]
  return lijst.flatMap((p, k) => (p.volgorde === k * STAP ? [] : [{ id: p.id, volgorde: k * STAP }]))
}

// ─── Invoer (systeemgrens) ───────────────────────────────────────────────────

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Eén regel tekst: witruimte samengevoegd, leeg = null. Te lang = fout (niet stil afkappen). */
function regel(v: unknown, max: number): string | null | 'te_lang' {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  if (t.length === 0) return null
  return t.length > max ? 'te_lang' : t
}

/**
 * Een optionele link: leeg = null; anders een geldige https-URL zonder
 * inloggegevens, of een pad in de PT-app ("/bibliotheek"; niet "//…", dat is
 * een andere site, en geen ".." om uit de app van de PT'er te stappen).
 */
export function leesLink(v: unknown): Lees<string | null> {
  const t = typeof v === 'string' ? v.trim() : ''
  if (t.length === 0) return { ok: true, waarde: null }
  if (t.length > MAX_LINK) return { ok: false, fout: 'De link is te lang.' }
  if (t.startsWith('/') && !t.startsWith('//') && !/\s|\\|\.\./.test(t)) return { ok: true, waarde: t }
  try {
    const u = new URL(t)
    if (u.protocol === 'https:' && !u.username && !u.password && u.hostname.includes('.')) return { ok: true, waarde: u.href }
  } catch {
    // valt door naar de fout hieronder
  }
  return { ok: false, fout: 'Gebruik een link die met https:// begint, of een pad in de app (begint met /).' }
}

/** Titel, uitleg en link van een punt (toevoegen en wijzigen). */
function leesInhoud(o: Record<string, unknown>): Lees<{ titel: string; uitleg: string | null; link: string | null }> {
  const titel = regel(o.titel, MAX_TITEL)
  if (titel === null) return { ok: false, fout: 'Vul een titel in.' }
  if (titel === 'te_lang') return { ok: false, fout: `De titel is te lang (maximaal ${MAX_TITEL} tekens).` }
  const uitleg = regel(o.uitleg, MAX_UITLEG)
  if (uitleg === 'te_lang') return { ok: false, fout: `De uitleg is te lang (maximaal ${MAX_UITLEG} tekens).` }
  const link = leesLink(o.link)
  if (!link.ok) return link
  return { ok: true, waarde: { titel, uitleg, link: link.waarde } }
}

/** De kledingmaten uit een formulier: beide verplicht, alleen standaardmaten. */
export function leesKledingmaten(v: unknown): Lees<Kledingmaten> {
  const o = obj(v)
  const maat = (x: unknown) => (typeof x === 'string' ? x.trim().toUpperCase() : '')
  const boven = maat(o?.boven)
  const onder = maat(o?.onder)
  if (!KLEDINGMAAT_KEUZES.includes(boven)) return { ok: false, fout: 'Kies je maat voor shirts en hoodies.' }
  if (!KLEDINGMAAT_KEUZES.includes(onder)) return { ok: false, fout: 'Kies je maat voor shorts en broeken.' }
  return { ok: true, waarde: { boven, onder } }
}

export type BeheerActie =
  | { actie: 'toevoegen'; titel: string; uitleg: string | null; link: string | null }
  | { actie: 'wijzigen'; id: string; titel: string; uitleg: string | null; link: string | null }
  | { actie: 'actief'; id: string; actief: boolean }
  | { actie: 'verplaats'; id: string; richting: 'op' | 'neer' }
  | { actie: 'verwijderen'; id: string }

export type PtActie =
  | { actie: 'gedaan'; id: string; gedaan: boolean }
  | { actie: 'kledingmaten'; maten: Kledingmaten }

export type BelangrijkActie = BeheerActie | PtActie

const BEHEER_ACTIES: ReadonlySet<BelangrijkActie['actie']> = new Set(['toevoegen', 'wijzigen', 'actief', 'verplaats', 'verwijderen'])

/** Hoort deze actie bij het beheer (alleen Kane) of bij de PT'er zelf? */
export function isBeheerActie(a: BelangrijkActie): a is BeheerActie {
  return BEHEER_ACTIES.has(a.actie)
}

/** Een actie uit de body van POST /api/pt/[code]/belangrijk, of een leesbare fout. */
export function leesBelangrijkActie(body: unknown): Lees<BelangrijkActie> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  if (o.actie === 'toevoegen') {
    const inhoud = leesInhoud(o)
    return inhoud.ok ? { ok: true, waarde: { actie: 'toevoegen', ...inhoud.waarde } } : inhoud
  }
  if (o.actie === 'kledingmaten') {
    const maten = leesKledingmaten(o.maten)
    return maten.ok ? { ok: true, waarde: { actie: 'kledingmaten', maten: maten.waarde } } : maten
  }
  if (typeof o.id !== 'string' || !UUID.test(o.id)) return { ok: false, fout: 'Onbekend punt.' }
  const id = o.id
  switch (o.actie) {
    case 'wijzigen': {
      const inhoud = leesInhoud(o)
      return inhoud.ok ? { ok: true, waarde: { actie: 'wijzigen', id, ...inhoud.waarde } } : inhoud
    }
    case 'actief':
      if (typeof o.actief !== 'boolean') return { ok: false, fout: 'Ongeldige invoer.' }
      return { ok: true, waarde: { actie: 'actief', id, actief: o.actief } }
    case 'verplaats':
      if (o.richting !== 'op' && o.richting !== 'neer') return { ok: false, fout: 'Ongeldige invoer.' }
      return { ok: true, waarde: { actie: 'verplaats', id, richting: o.richting } }
    case 'verwijderen':
      return { ok: true, waarde: { actie: 'verwijderen', id } }
    case 'gedaan':
      if (typeof o.gedaan !== 'boolean') return { ok: false, fout: 'Ongeldige invoer.' }
      return { ok: true, waarde: { actie: 'gedaan', id, gedaan: o.gedaan } }
    default:
      return { ok: false, fout: 'Onbekende actie.' }
  }
}

// ─── Overzicht voor Kane ─────────────────────────────────────────────────────

/**
 * Per punt hoeveel PT'ers uit het huidige team het hebben afgevinkt (wie niet
 * meer in het team zit telt niet mee), en wie zijn kledingmaten nog niet doorgaf.
 */
export function beheerOverzicht(
  punten: readonly Pick<Aandachtspunt, 'id'>[],
  gedaanPerPunt: ReadonlyMap<string, readonly string[]>,
  team: readonly { id: string; naam: string }[],
  maten: ReadonlyMap<string, Kledingmaten>,
): { gedaan: Record<string, number>; zonderMaten: string[] } {
  const ids = new Set(team.map((p) => p.id))
  return {
    gedaan: Object.fromEntries(punten.map((p) => [p.id, (gedaanPerPunt.get(p.id) ?? []).filter((id) => ids.has(id)).length])),
    zonderMaten: team.filter((p) => !maten.has(p.id)).map((p) => p.naam),
  }
}

/** De maten per PT'er voor de kledingpagina: persoon_id → maten, of null = nog niet doorgegeven. */
export function matenPerPt(pts: readonly { id: string }[], maten: ReadonlyMap<string, Kledingmaten>): Record<string, Kledingmaten | null> {
  return Object.fromEntries(pts.map((p) => [p.id, maten.get(p.id) ?? null]))
}
