// ─── Club: het zoekveld in de balk (PUUR) ───────────────────────────────────
// Vindt alles waar iemand heen mag: de onderdelen uit het menu en elke
// instel-pagina uit het instellingencentrum. Zo hoeft een instel-pagina niet in
// het menu te staan om toch snel te vinden te zijn (Ctrl K of /).

import { instelGroepLabel, instelHref, zichtbareInstelPaginas, type InstelKijker } from '@/lib/club/kern/instel-paginas'
import { GROEPEN, ONDERDELEN, inMenu, isZichtbaar } from './onderdelen'

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
}

/** Kleine letters, zonder accenten en dubbele spaties. */
export function normaliseerZoek(tekst: string): string {
  return tekst.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Alles wat deze persoon kan vinden: eerst het menu, dan de instellingen. */
export function zoekItems(k: InstelKijker, instellingen: boolean): ZoekItem[] {
  const menu = ONDERDELEN.filter((o) => inMenu(o) && (o.sleutel === 'beheer' ? instellingen : isZichtbaar(o, k.uit, k.toegestaan))).map((o) => {
    const plek = GROEPEN.find((g) => g.sleutel === o.groep)?.label ?? ''
    return { id: `menu-${o.sleutel}`, label: o.label, uitleg: o.uitleg, plek, pad: o.pad, perVestiging: true, zoektekst: normaliseerZoek(`${o.label} ${o.uitleg} ${plek}`) }
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
