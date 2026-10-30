// ─── Club: het zoekveld in de balk (PUUR) ───────────────────────────────────
// Vindt alles waar iemand heen mag: leden (wie Leden mag), de onderdelen uit het
// menu (met hun volledige schermen, bv. de takenweek), de secties op Vandaag
// (Check-in en Opvolgen, met anker), de
// hulpbalk onderaan en elke instel-pagina uit het instellingencentrum. Zo hoeft
// een instel-pagina niet in het menu te staan om toch snel te vinden te zijn (Ctrl K of /).

import { instelCategoriePad, instelGroepLabel, instelGroepUitleg, instelHref, instelIndeling, instelPaginaInTaal, zichtbareInstelPaginas, type InstelKijker } from '@/lib/club/kern/instel-paginas'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { GROEPEN, ONDERDELEN, groepInTaal, inMenu, isZichtbaar, onderdeelInTaal, onderdeelPad, schermInTaal, sectiesVoor, toetsTekst, type Onderdeel } from './onderdelen'
import { hulpbalkVoor, hulpItems, hulpToets } from './hulpbalk-items'

export interface ZoekItem {
  /** Uniek binnen de lijst. */
  id: string
  label: string
  uitleg: string
  /** Waar het staat, bijvoorbeeld "Planning" of "Instellingen · Locaties". */
  plek: string
  /** Pad binnen /club, eventueel met ?tab= of #anker. */
  pad: string
  /** Neemt de gekozen vestiging mee. */
  perVestiging: boolean
  /** Alles waarop dit item gevonden wordt, al genormaliseerd. */
  zoektekst: string
  /** Sneltoets op de pc, bijvoorbeeld "G L". */
  toets?: string
  /** Het icoon (shell/iconen.ts): "onderdeel:<sleutel>", "hulp:<sleutel>", "lid" of "instelling". */
  icoon: string
  /** Het onderdeel waarvan de teller hier staat (menu en secties op Vandaag), zie lib/club/menu/tellers.ts. */
  teller?: string
}

/** Kleine letters, zonder accenten en dubbele spaties. */
export function normaliseerZoek(tekst: string): string {
  return tekst.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Waar de hulpbalk staat, voor in het zoekvenster. */
export const HULPBALK_PLEK = MENU.nl.zoeken.plekOnderaan

/** Waar de secties van Vandaag staan (Check-in, Opvolgen). */
export const VANDAAG_PLEK = MENU.nl.zoeken.plekVandaag

/** Zoekwoorden in beide talen, zodat een Nederlands of Engels woord altijd iets vindt. */
function beideTalen(nl: { label: string; uitleg: string }, en: { label: string; uitleg: string }): string {
  return `${nl.label} ${nl.uitleg} ${en.label} ${en.uitleg}`
}

/** Een sectie op Vandaag (met anker) en de volledige schermen erachter. */
function sectieItems(bron: Onderdeel, taal: Taal): ZoekItem[] {
  const o = onderdeelInTaal(bron, taal)
  const vandaag = MENU[taal].zoeken.plekVandaag
  const sectie: ZoekItem = {
    id: `vandaag-${o.sleutel}`, label: o.label, uitleg: o.uitleg, plek: vandaag, pad: onderdeelPad(o), perVestiging: true, icoon: `onderdeel:${o.sleutel}`, teller: o.sleutel,
    zoektekst: normaliseerZoek(`${beideTalen(bron, onderdeelInTaal(bron, 'en'))} ${vandaag}`), toets: toetsTekst(o) ?? undefined,
  }
  return [sectie, ...schermItems(bron, `${vandaag} · ${o.label}`, taal)]
}

/** De volledige schermen achter een onderdeel (bv. de takenweek). */
function schermItems(bron: Onderdeel, plek: string, taal: Taal): ZoekItem[] {
  return (bron.schermen ?? []).map((s) => {
    const t = schermInTaal(s, taal)
    return {
      id: `scherm-${bron.sleutel}-${s.id}`, label: t.label, uitleg: t.uitleg, plek, pad: s.pad, perVestiging: true, icoon: `onderdeel:${bron.sleutel}`,
      zoektekst: normaliseerZoek(`${beideTalen(s, schermInTaal(s, 'en'))} ${bron.label} ${onderdeelInTaal(bron, 'en').label}`),
    }
  })
}

/** Alles wat deze persoon kan vinden: eerst het menu, dan de secties van Vandaag, dan de hulpbalk, dan de instellingen. */
export function zoekItems(k: InstelKijker, instellingen: boolean, taal: Taal = 'nl'): ZoekItem[] {
  const t = MENU[taal].zoeken
  const menu = ONDERDELEN.filter((o) => inMenu(o) && isZichtbaar(o, k.uit, k.toegestaan)).flatMap((bron) => {
    const o = onderdeelInTaal(bron, taal)
    const groep = GROEPEN.find((g) => g.sleutel === o.groep)
    const plek = groep ? groepInTaal(groep, taal).label : ''
    const toets = toetsTekst(o) ?? undefined
    const item: ZoekItem = { id: `menu-${o.sleutel}`, label: o.label, uitleg: o.uitleg, plek, pad: o.pad, perVestiging: true, icoon: `onderdeel:${o.sleutel}`, teller: o.sleutel, zoektekst: normaliseerZoek(`${beideTalen(bron, onderdeelInTaal(bron, 'en'))} ${plek} ${o.trefwoorden ?? ''}`), toets }
    return [item, ...schermItems(bron, `${plek} · ${o.label}`, taal)]
  })
  const secties = sectiesVoor(k.uit, k.toegestaan).flatMap((o) => sectieItems(o, taal))
  const hulp = hulpItems(hulpbalkVoor(k, instellingen), taal).map((i) => ({
    id: `hulp-${i.sleutel}`, label: i.label, uitleg: i.uitleg, plek: t.plekOnderaan, pad: i.pad, perVestiging: true, icoon: `hulp:${i.sleutel}`,
    zoektekst: normaliseerZoek(`${beideTalen(hulpItems([i.sleutel])[0], hulpItems([i.sleutel], 'en')[0])} ${t.plekOnderaan} ${i.trefwoorden}`), toets: hulpToets(i) ?? undefined,
  }))
  const instel = zichtbareInstelPaginas(k).map((bron) => {
    const p = instelPaginaInTaal(bron, taal)
    const en = instelPaginaInTaal(bron, 'en')
    const plek = `${t.plekInstellingen} · ${instelGroepLabel(p.groep, taal)}`
    return { id: `instel-${p.id}`, label: p.titel, uitleg: p.uitleg, plek, pad: p.pad, perVestiging: Boolean(p.perVestiging), icoon: 'instelling', zoektekst: normaliseerZoek(`${bron.titel} ${bron.uitleg} ${en.titel} ${en.uitleg} ${plek} ${p.trefwoorden ?? ''}`) }
  })
  // De categorieen van het centrum: openen meteen de juiste categorie (?categorie=).
  const categorieen = instellingen
    ? instelIndeling(k).map(({ sleutel }) => {
        const label = instelGroepLabel(sleutel, taal)
        const zoek = `${instelGroepLabel(sleutel)} ${instelGroepUitleg(sleutel)} ${instelGroepLabel(sleutel, 'en')} ${instelGroepUitleg(sleutel, 'en')} ${t.plekInstellingen}`
        return { id: `instel-categorie-${sleutel}`, label, uitleg: instelGroepUitleg(sleutel, taal), plek: t.plekInstellingen, pad: instelCategoriePad(sleutel), perVestiging: true, icoon: 'instelling', zoektekst: normaliseerZoek(zoek) }
      })
    : []
  return [...menu, ...secties, ...hulp, ...categorieen, ...instel]
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
export function ledenItems(leden: readonly LidTreffer[], vraag: string, taal: Taal = 'nl'): ZoekItem[] {
  const term = vraag.trim()
  const t = MENU[taal].zoeken
  const items: ZoekItem[] = leden.map((l) => ({
    id: `lid-${l.id}`,
    label: l.naam,
    uitleg: [l.lidnummer ? t.lidnummer(l.lidnummer) : null, l.status].filter(Boolean).join(' · '),
    plek: t.plekLid,
    pad: `/leden/${encodeURIComponent(l.id)}`,
    perVestiging: true,
    icoon: 'lid',
    zoektekst: normaliseerZoek(l.naam),
  }))
  const alle: ZoekItem = {
    id: 'leden-lijst',
    label: t.alleLeden(term),
    uitleg: t.alleLedenUitleg,
    plek: t.plekLeden,
    pad: `/leden?q=${encodeURIComponent(term)}`,
    perVestiging: true,
    icoon: 'onderdeel:leden',
    zoektekst: '',
  }
  return [...items, alle]
}
