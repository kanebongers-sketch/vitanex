// ─── LifeOS — Sportmerk: het contract ───────────────────────────────────────
// De vorm van de strategie die `/api/lifeos/sportmerk` levert. Gedeeld tussen
// de route (bouwt 'm) en de client-narrower (vertrouwt 'm pas na controle).
// Alleen types: de client importeert hier niets dat in de bundle belandt.

export type Risico = 'laag' | 'middel' | 'hoog'

export type ProductRol = 'hoofdproduct' | 'hoofdaanbod' | 'margemotor' | 'add-on' | 'later' | 'reserve'

/** Eén productrichting zoals we 'm nu inschatten — nog géén offerte. */
export interface ProductAanname {
  id: string
  naam: string
  rol: ProductRol
  prijsInclBtw: number
  /** Landed cost-range: inkoop + vracht + invoerrechten + verpakking. */
  kostprijs: { min: number; max: number }
  /** Uitgaande verzending per order (3PL + vervoerder). 0 voor digitaal. */
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
}
