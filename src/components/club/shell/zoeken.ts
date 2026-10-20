// ─── Club: het zoekveld in de balk (PUUR) ───────────────────────────────────
// Vindt alles waar iemand heen mag: leden (wie Leden mag), de onderdelen uit het
// menu en elke instel-pagina uit het instellingencentrum. Zo hoeft een instel-pagina niet in
// het menu te staan om toch snel te vinden te zijn (Ctrl K of /).

import { instelGroepLabel, instelHref, zichtbareInstelPaginas, type InstelKijker } from '@/lib/club/kern/instel-paginas'
import { GROEPEN, ONDERDELEN, inMenu, isZichtbaar, toetsTekst } from './onderdelen'

export interface ZoekItem {
  /** Uniek binnen de lijst. */
  id: string
  label: string
  uitleg: string
  /** Waar het staat, bijvoorbeeld "Planning" of "Instellingen · Locaties". */
  plek: string
  /** Pad binnen /clubkane, eventueel met ?tab= of #anker. */
  pad: string
  /** Neemt de gekozen vestiging mee. */
  perVestiging: boolean
  /** Alles waarop dit item gevonden wordt, al genormaliseerd. */
  zoektekst: string
  /** Sneltoets op de pc, bijvoorbeeld "G L". */
  toets?: string
}

/** Kleine letters, zonder accenten en dubbele spaties. */
export function normaliseerZoek(tekst: string): string {
  return tekst.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Alles wat deze persoon kan vinden: eerst het menu, dan de instellingen. */
export function zoekItems(k: InstelKijker, instellingen: boolean): ZoekItem[] {
  const menu = ONDERDELEN.filter((o) => inMenu(o) && (o.sleutel === 'beheer' ? instellingen : isZichtbaar(o, k.uit, k.toegestaan))).map((o) => {
    const plek = GROEPEN.find((g) => g.sleutel === o.groep)?.label ?? ''
    const toets = toetsTekst(o) ?? undefined
    return { id: `menu-${o.sleutel}`, label: o.label, uitleg: o.uitleg, plek, pad: o.pad, perVestiging: true, zoektekst: normaliseerZoek(`${o.label} ${o.uitleg} ${plek}`), toets }
  })
  const instel = zichtbareInstelPaginas(k).map((p) => {
    const plek = `Instellingen · ${instelGroepLabel(p.groep)}`
    return { id: `instel-${p.id}`, label: p.titel, uitleg: p.uitleg, plek, pad: p.pad, perVestiging: Boolean(p.perVestiging), zoektekst: normaliseerZoek(`${p.titel} ${p.uitleg} ${plek} ${p.trefwoorden ?? ''}`) }
  })
  return [...menu, ...instel]
}

/** Alle woorden moeten passen; treffers op de naam eerst. Leeg zoeken geeft alles. */
export function filterZoek(items: readonly ZoekItem[], vraag: string): ZoekItem[] {
  const woorden = normaliseerZoek(vraag).split(' ').filter(Boolean)
  if (woorden.length === 0) return [...items]
  const passend = items.filter((i) => woorden.every((w) => i.zoektekst.includes(w)))
  const opNaam = (i: ZoekItem) => (normaliseerZoek(i.label).startsWith(woorden[0]) ? 0 : normaliseerZoek(i.label).includes(woorden[0]) ? 1 : 2)
  return passend.map((i, n) => ({ i, n, s: opNaam(i) })).sort((a, b) => a.s - b.s || a.n - b.n).map((x) => x.i)
}

/** De link naar een item, met de vestiging erbij waar dat hoort. */
export function zoekHref(item: Pick<ZoekItem, 'pad' | 'perVestiging'>, vestiging: string | null): string {
  return instelHref(item, vestiging)
}

// ── Leden zoeken ─────────────────────────────────────────────────────────────
// Vanaf twee tekens zoekt het venster ook leden (GET /api/club/leden/zoek).
// Een lid opent meteen de ledenkaart; onderaan altijd "Alle leden met ..." voor
// de volledige lijst met filters.

export const ZOEK_LEDEN_MIN = 2
export const ZOEK_LEDEN_MAX = 6

/** Een lid zoals het zoek-API het teruggeeft. */
export interface LidTreffer {
  id: string
  naam: string
  lidnummer: string | null
  status: string
}

/** Kan deze vraag leden opleveren? */
export function zoektLeden(vraag: string): boolean {
  return normaliseerZoek(vraag).length >= ZOEK_LEDEN_MIN
}

/** Leest het antwoord van het zoek-API; onbekende vormen worden overgeslagen. */
export function ledenUitAntwoord(data: unknown): LidTreffer[] {
  const lijst = (data as { leden?: unknown } | null)?.leden
  if (!Array.isArray(lijst)) return []
  return lijst.flatMap((r: unknown) => {
    const l = r as Partial<LidTreffer> | null
    if (!l || typeof l.id !== 'string' || typeof l.naam !== 'string') return []
    return [{ id: l.id, naam: l.naam, lidnummer: typeof l.lidnummer === 'string' ? l.lidnummer : null, status: typeof l.status === 'string' ? l.status : '' }]
  })
}

/** De leden als zoekresultaten, plus de regel naar de volledige ledenlijst met deze zoekterm. */
export function ledenItems(leden: readonly LidTreffer[], vraag: string): ZoekItem[] {
  const term = vraag.trim()
  const items: ZoekItem[] = leden.map((l) => ({
    id: `lid-${l.id}`,
    label: l.naam,
    uitleg: [l.lidnummer ? `Lidnummer ${l.lidnummer}` : null, l.status].filter(Boolean).join(' · '),
    plek: 'Lid',
    pad: `/leden/${encodeURIComponent(l.id)}`,
    perVestiging: true,
    zoektekst: normaliseerZoek(l.naam),
  }))
  const alle: ZoekItem = {
    id: 'leden-lijst',
    label: `Alle leden met "${term}"`,
    uitleg: 'De ledenlijst met deze zoekterm en alle filters',
    plek: 'Leden',
    pad: `/leden?q=${encodeURIComponent(term)}`,
    perVestiging: true,
    zoektekst: '',
  }
  return [...items, alle]
}
