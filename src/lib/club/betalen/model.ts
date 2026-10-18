// ─── Club, betalen: producten, verkopen en tegoeden (PUUR) ──────────────────
// Losse producten die een sportschool in de ledenapp verkoopt. Het lidmaatschap
// zelf hoort hier niet bij: dat blijft bij Sportivity of het eigen systeem.

export const PRODUCT_TYPEN = ['losse_les', 'strippenkaart', 'pt_pakket', 'product'] as const
export type ProductType = (typeof PRODUCT_TYPEN)[number]

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  losse_les: 'Losse les of drop-in',
  strippenkaart: 'Strippenkaart',
  pt_pakket: 'PT-pakket',
  product: 'Los product',
}

export const BTW_TARIEVEN = [9, 21] as const
export type BtwTarief = (typeof BTW_TARIEVEN)[number]

export type TegoedSoort = 'les' | 'pt'

export interface Product {
  id: string
  naam: string
  omschrijving: string | null
  type: ProductType
  /** Inclusief btw. */
  prijsCent: number
  btwProcent: BtwTarief
  /** Aantal lessen of sessies; null bij een los product. */
  tegoeden: number | null
  geldigDagen: number | null
  /** null = alle vestigingen. */
  vestigingen: string[] | null
  actief: boolean
  volgorde: number
}

export const VERKOOP_STATUSSEN = ['open', 'betaald', 'mislukt', 'verlopen', 'terugbetaald'] as const
export type VerkoopStatus = (typeof VERKOOP_STATUSSEN)[number]

export const VERKOOP_STATUS_LABEL: Record<VerkoopStatus, string> = {
  open: 'Wacht op betaling',
  betaald: 'Betaald',
  mislukt: 'Mislukt',
  verlopen: 'Verlopen',
  terugbetaald: 'Terugbetaald',
}

export interface Verkoop {
  id: string
  lidId: string | null
  productNaam: string
  type: ProductType
  vestiging: string | null
  bedragCent: number
  btwProcent: BtwTarief
  status: VerkoopStatus
  terugbetaaldCent: number
  terugbetalingAangevraagd: boolean
  betaaldOp: string | null
  aangemaaktOp: string
}

export interface Tegoed {
  id: string
  soort: TegoedSoort
  productNaam: string
  totaal: number
  saldo: number
  geldigTot: string | null
  vestigingen: string[] | null
}

export const PRODUCT_KOLOMMEN = 'id, naam, omschrijving, type, prijs_cent, btw_procent, tegoeden, geldig_dagen, vestigingen, actief, volgorde'
export const VERKOOP_KOLOMMEN = 'id, lid_id, product_naam, type, vestiging, bedrag_cent, btw_procent, status, terugbetaald_cent, terugbetaling_aangevraagd_op, betaald_op, aangemaakt_op'
export const TEGOED_KOLOMMEN = 'id, soort, product_naam, totaal, saldo, geldig_tot, vestigingen'

type Rij = Record<string, unknown>

function rij(v: unknown): Rij | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function geheel(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) ? v : null
}

function lijst(v: unknown): string[] | null {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string') ? (v as string[]) : null
}

export function isProductType(v: unknown): v is ProductType {
  return typeof v === 'string' && (PRODUCT_TYPEN as readonly string[]).includes(v)
}

function isBtw(v: unknown): v is BtwTarief {
  return v === 9 || v === 21
}

/** Welk tegoed hoort bij dit type product (null = los product, geen tegoed). */
export function tegoedSoortVan(type: ProductType): TegoedSoort | null {
  if (type === 'pt_pakket') return 'pt'
  if (type === 'product') return null
  return 'les'
}

export function productUitRij(v: unknown): Product | null {
  const r = rij(v)
  const id = tekst(r?.id)
  const naam = tekst(r?.naam)
  const prijs = geheel(r?.prijs_cent)
  if (!r || !id || !naam || !isProductType(r.type) || prijs === null || !isBtw(r.btw_procent)) return null
  return {
    id,
    naam,
    omschrijving: tekst(r.omschrijving),
    type: r.type,
    prijsCent: prijs,
    btwProcent: r.btw_procent,
    tegoeden: geheel(r.tegoeden),
    geldigDagen: geheel(r.geldig_dagen),
    vestigingen: lijst(r.vestigingen),
    actief: r.actief === true,
    volgorde: geheel(r.volgorde) ?? 0,
  }
}

function isVerkoopStatus(v: unknown): v is VerkoopStatus {
  return typeof v === 'string' && (VERKOOP_STATUSSEN as readonly string[]).includes(v)
}

export function verkoopUitRij(v: unknown): Verkoop | null {
  const r = rij(v)
  const id = tekst(r?.id)
  const bedrag = geheel(r?.bedrag_cent)
  if (!r || !id || !isProductType(r.type) || bedrag === null || !isBtw(r.btw_procent) || !isVerkoopStatus(r.status)) return null
  return {
    id,
    lidId: tekst(r.lid_id),
    productNaam: tekst(r.product_naam) ?? 'Product',
    type: r.type,
    vestiging: tekst(r.vestiging),
    bedragCent: bedrag,
    btwProcent: r.btw_procent,
    status: r.status,
    terugbetaaldCent: geheel(r.terugbetaald_cent) ?? 0,
    terugbetalingAangevraagd: tekst(r.terugbetaling_aangevraagd_op) !== null,
    betaaldOp: tekst(r.betaald_op),
    aangemaaktOp: tekst(r.aangemaakt_op) ?? new Date(0).toISOString(),
  }
}

export function tegoedUitRij(v: unknown): Tegoed | null {
  const r = rij(v)
  const id = tekst(r?.id)
  const totaal = geheel(r?.totaal)
  const saldo = geheel(r?.saldo)
  if (!r || !id || (r.soort !== 'les' && r.soort !== 'pt') || totaal === null || saldo === null) return null
  return { id, soort: r.soort, productNaam: tekst(r.product_naam) ?? 'Tegoed', totaal, saldo, geldigTot: tekst(r.geldig_tot), vestigingen: lijst(r.vestigingen) }
}

/** Het btw-deel van een bedrag inclusief btw, in centen (afgerond). */
export function btwDeel(inclusiefCent: number, procent: BtwTarief): number {
  return Math.round((inclusiefCent * procent) / (100 + procent))
}

const EURO = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

export function euro(cent: number): string {
  return EURO.format(cent / 100)
}

/** Een korte regel onder het product: wat je krijgt en hoe lang het geldig is. */
export function productInhoud(p: Pick<Product, 'type' | 'tegoeden' | 'geldigDagen'>): string {
  const delen: string[] = []
  if (p.type === 'strippenkaart' && p.tegoeden) delen.push(`${p.tegoeden} groepslessen`)
  if (p.type === 'losse_les') delen.push('1 groepsles')
  if (p.type === 'pt_pakket' && p.tegoeden) delen.push(`${p.tegoeden} ${p.tegoeden === 1 ? 'sessie' : 'sessies'} personal training`)
  if (p.type === 'product') delen.push('Ophalen bij de balie')
  if (p.geldigDagen && p.type !== 'product') delen.push(`${p.geldigDagen} dagen geldig`)
  return delen.join(' · ')
}
