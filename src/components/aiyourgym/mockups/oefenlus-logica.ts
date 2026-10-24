// De regels van OefenLus (PUUR, getest in oefenlus-logica.test.ts): welke
// bewegende lus past bij het vak, welk stilstaand beeld hoort bij een stand en
// wanneer de lus zichtbaar mag worden. Geen React en geen DOM hierin.

import type { OefenRender, OefenRenderBestand } from '@/components/aiyourgym/inhoud/oefenrenders'

export type OefenLusStand = 'speelt' | 'begin' | 'eind'

/** Het stilstaande beeld (poster) bij een stand: groot en klein. */
export interface Poster {
  groot: OefenRenderBestand
  klein: OefenRenderBestand
}

export function posterVan(render: OefenRender, stand: OefenLusStand): Poster {
  return stand === 'eind'
    ? { groot: render.piek, klein: render.piekKlein }
    : { groot: render.begin, klein: render.beginKlein }
}

/** Een vaste sleutel per poster: zo weten we of het beeld op het scherm al het gevraagde beeld is. */
export function posterSleutel(render: OefenRender, stand: OefenLusStand): string {
  return posterVan(render, stand).groot.src
}

/**
 * Waar de vloer ligt (voeten, of handen en voeten bij oefeningen op de grond),
 * als deel van de hoogte van het beeld: 0 is boven, 1 is onder. Komt uit de
 * gegevens van de render (vloer_y, gemeten door het script); zonder die waarde
 * nemen we de vloer van een staande oefening.
 */
export const VLOER_STANDAARD = 0.93

export function vloerVan(render: OefenRender): number {
  const r = render as OefenRender & { vloerY?: unknown; vloer_y?: unknown }
  const waarde = typeof r.vloerY === 'number' ? r.vloerY : r.vloer_y
  return typeof waarde === 'number' && Number.isFinite(waarde) && waarde > 0.3 && waarde <= 1 ? waarde : VLOER_STANDAARD
}

/** Breedte gedeeld door hoogte van het beeld, voor een vak dat precies om de render past. */
export function verhoudingVan(render: OefenRender): number {
  const { breedte, hoogte } = render.begin
  return breedte > 0 && hoogte > 0 ? breedte / hoogte : 1
}

export interface LusVak {
  /** Zichtbare breedte en hoogte van het vak in CSS-pixels. */
  breedte: number
  hoogte: number
  /** window.devicePixelRatio. */
  dpr: number
  /** Telefoon (tot 640 px breed): nooit de HD-lus over mobiele data. */
  telefoon: boolean
}

/**
 * De lus die bij het vak past: de kleinste die minstens zo breed is als het
 * beeld echt getekend wordt (object-fit: contain, dus de kortste zijde maal
 * de pixeldichtheid), anders de grootste die mag. We kiezen een keer per
 * lus en zetten geen srcset op de lus, zodat de browser nooit midden in het
 * afspelen naar een ander bestand springt.
 */
export function kiesLus(render: OefenRender, vak: LusVak): OefenRenderBestand {
  const keuzes = vak.telefoon ? [render.lusKlein, render.lus] : [render.lusKlein, render.lus, render.lusHd]
  const opVolgorde = [...keuzes].sort((a, b) => a.breedte - b.breedte)
  const kant = Math.min(vak.breedte, vak.hoogte)
  const nodig = Number.isFinite(kant) && kant > 0 ? kant * Math.max(1, vak.dpr || 1) : 0
  return opVolgorde.find((b) => b.breedte >= nodig) ?? opVolgorde[opVolgorde.length - 1]
}

export interface LusInvoer {
  /** stand is 'speelt', geen prefers-reduced-motion en niet gepauzeerd. */
  speelt: boolean
  /** Het vak is (bijna) in beeld. */
  inBeeld: boolean
  /** Het stilstaande beeld op het scherm is geladen en hoort bij de gevraagde oefening. */
  posterKlaar: boolean
  /** De lus die we willen tonen (sleutel) en de lus die na decode() klaar is. */
  lusSleutel: string | null
  lusKlaar: string | null
}

export type LusFase = 'stil' | 'laden' | 'speelt'

/**
 * stil: alleen het stilstaande beeld, er is geen lus.
 * laden: de lus staat onzichtbaar klaar en wordt gedecodeerd; het stille beeld blijft staan.
 * speelt: de lus is gedecodeerd en vervaagt over het stille beeld.
 * De lus wordt pas opgehaald als het stille beeld er staat, zodat de poster nooit
 * hoeft te wachten op een paar MB beweging.
 */
export function lusFase(i: LusInvoer): LusFase {
  if (!i.speelt || !i.inBeeld || !i.posterKlaar || !i.lusSleutel) return 'stil'
  return i.lusKlaar === i.lusSleutel ? 'speelt' : 'laden'
}
