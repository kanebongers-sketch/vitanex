// ─── LifeOS — Sportmerk: het contract ───────────────────────────────────────
// De vorm van de strategie die `/api/lifeos/sportmerk` levert. Gedeeld tussen
// de route (bouwt 'm) en de client-narrower (vertrouwt 'm pas na controle).
// Alleen types: de client importeert hier niets dat in de bundle belandt.

export type Risico = 'laag' | 'middel' | 'hoog'

export type ProductRol = 'hoofdproduct' | 'hoofdaanbod' | 'margemotor' | 'add-on' | 'later' | 'reserve' | 'vergelijking'

/**
 * Hoe het product bij de klant komt. Bewust géén "eigen voorraad": dat is
 * besloten (25 sep 2026) en hoort dus niet eens representeerbaar te zijn.
 */
export type Levering = 'eu-leverancier' | 'pre-order'

/** Eén productrichting zoals we 'm nu inschatten — nog géén offerte. */
export interface ProductAanname {
  id: string
  naam: string
  rol: ProductRol
  levering: Levering
  prijsInclBtw: number
  /** Kostprijs-range bij de leverancier, inclusief logo en verpakking. */
  kostprijs: { min: number; max: number }
  /** Uitgaande verzending per order naar de klant. */
  verzendkosten: number
  retourRisico: Risico
  toelichting: string
}

export interface BerekendeMarge {
  exBtw: number
  /** Wat er per order overblijft vóór advertentiekosten. */
  overVoorAds: number
  /** Idem, na één betaalde klantacquisitie. */
  naAds: number
}

export interface ProductMetMarge extends ProductAanname {
  marge: BerekendeMarge
}

export interface Bron {
  label: string
  url: string
}

export interface Argument {
  tekst: string
  bron: Bron | null
}

export interface LabelWaarde {
  label: string
  waarde: string
}

export interface TitelTekst {
  titel: string
  tekst: string
}

/** Eén fase van het uitvoeringsplan, met vooraf vastgelegde beslisregels. */
export interface Fase {
  naam: string
  periode: string
  doel: string
  doorAls: string
  herzienAls: string
}

export interface Strategie {
  /** YYYY-MM-DD: wanneer deze inschatting voor het laatst is herzien. */
  bijgewerkt: string
  fase: string
  richting: { naam: string; samenvatting: string; genomenOp: string }
  waarom: Argument[]
  doelgroep: string[]
  aannames: LabelWaarde[]
  producten: ProductMetMarge[]
  geschrapt: TitelTekst[]
  risicos: TitelTekst[]
  openBeslissingen: string[]
  volgendeStappen: string[]
  fasen: Fase[]
}
