// ─── Club, betalen: invoer van een product controleren (PUUR) ───────────────
// Systeemgrens: wat de eigenaar in het formulier invult. De prijs is altijd in
// centen inclusief btw. Vestigingen moeten bij de sportschool horen.

import { BTW_TARIEVEN, isProductType, type BtwTarief, type ProductType } from './model'

export interface ProductInvoer {
  naam: string
  omschrijving: string | null
  type: ProductType
  prijsCent: number
  btwProcent: BtwTarief
  tegoeden: number | null
  geldigDagen: number | null
  vestigingen: string[] | null
  actief: boolean
}

export type Gelezen<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function nee<T>(fout: string): Gelezen<T> {
  return { ok: false, fout }
}

function geheelTussen(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null
}

function leesVestigingen(v: unknown, bekend: readonly string[]): string[] | null | 'fout' {
  if (v === null || v === undefined) return null
  if (!Array.isArray(v) || v.length === 0 || v.length > 60) return 'fout'
  const uniek = [...new Set(v)]
  if (!uniek.every((x): x is string => typeof x === 'string' && bekend.includes(x))) return 'fout'
  return uniek.length === bekend.length ? null : uniek
}

function leesTegoeden(type: ProductType, v: unknown): number | null | 'fout' {
  if (type === 'product') return null
  if (type === 'losse_les') return 1
  const n = geheelTussen(v, type === 'strippenkaart' ? 2 : 1, 200)
  return n ?? 'fout'
}

/** Een nieuw of gewijzigd product; `vestigingen` = de slugs van deze sportschool. */
export function leesProductInvoer(ruw: unknown, vestigingen: readonly string[]): Gelezen<ProductInvoer> {
  if (typeof ruw !== 'object' || ruw === null || Array.isArray(ruw)) return nee('Ongeldig verzoek.')
  const b = ruw as Record<string, unknown>
  const naam = typeof b.naam === 'string' ? b.naam.trim() : ''
  if (naam.length < 2 || naam.length > 80) return nee('Geef het product een naam van 2 tot 80 tekens.')
  const omschrijving = typeof b.omschrijving === 'string' && b.omschrijving.trim() ? b.omschrijving.trim() : null
  if (omschrijving && omschrijving.length > 300) return nee('De omschrijving is te lang (maximaal 300 tekens).')
  if (!isProductType(b.type)) return nee('Kies wat voor product het is.')
  const prijsCent = geheelTussen(b.prijsCent, 50, 500_000)
  if (prijsCent === null) return nee('Vul een prijs in tussen 0,50 en 5000 euro.')
  if (!(BTW_TARIEVEN as readonly unknown[]).includes(b.btwProcent)) return nee('Kies 9 of 21 procent btw.')
  const tegoeden = leesTegoeden(b.type, b.tegoeden)
  if (tegoeden === 'fout') return nee(b.type === 'strippenkaart' ? 'Een strippenkaart heeft 2 tot 200 lessen.' : 'Een PT-pakket heeft 1 tot 200 sessies.')
  const geldigDagen = b.geldigDagen === null || b.geldigDagen === undefined || b.type === 'product' ? null : geheelTussen(b.geldigDagen, 1, 1095)
  if (b.type !== 'product' && b.geldigDagen !== null && b.geldigDagen !== undefined && geldigDagen === null) return nee('Geldigheid is 1 tot 1095 dagen, of leeg voor onbeperkt.')
  const v = leesVestigingen(b.vestigingen, vestigingen)
  if (v === 'fout') return nee('Kies een of meer vestigingen van je sportschool.')
  return {
    ok: true,
    waarde: { naam, omschrijving, type: b.type, prijsCent, btwProcent: b.btwProcent as BtwTarief, tegoeden, geldigDagen, vestigingen: v, actief: b.actief !== false },
  }
}

/** De databasevelden van een gecontroleerd product. */
export function productRij(p: ProductInvoer): Record<string, unknown> {
  return {
    naam: p.naam,
    omschrijving: p.omschrijving,
    type: p.type,
    prijs_cent: p.prijsCent,
    btw_procent: p.btwProcent,
    tegoeden: p.tegoeden,
    geldig_dagen: p.geldigDagen,
    vestigingen: p.vestigingen,
    actief: p.actief,
  }
}
