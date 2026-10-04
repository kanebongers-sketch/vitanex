// ─── LifeOS — DEGIRO-portefeuille-export inlezen (PUUR) ─────────────────────
// DEGIRO → Portefeuille → Exporteren (CSV) geeft per regel: Product,
// Symbool/ISIN, Aantal, Slotkoers, Lokale waarde (valuta + bedrag), Waarde in EUR.
// Getallen met een komma als decimaal ("2240,50"). Géén aankoopprijs: die staat
// niet in deze export (wel als "GAK" in de app).

export interface CsvPositie {
  naam: string
  isin: string
  aantal: number
  slotkoers: number
  valuta: string
  waardeEur: number | null
}

export interface CsvPortefeuille {
  posities: CsvPositie[]
  /** De cash-regel in euro, of `null` als de export er geen had (dan je cash niet aanraken). */
  cashEur: number | null
}

/** Eén CSV-regel → velden, met aanhalingstekens ("2240,50") als één veld. */
export function splitsRegel(regel: string): string[] {
  const velden: string[] = []
  let huidig = ''
  let inQuotes = false
  for (let i = 0; i < regel.length; i++) {
    const c = regel[i]
    if (c === '"') {
      if (inQuotes && regel[i + 1] === '"') {
        huidig += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      velden.push(huidig)
      huidig = ''
    } else huidig += c
  }
  velden.push(huidig)
  return velden.map((v) => v.trim())
}

/** Alleen punten als duizendtallen: "1.234" of "12.345.678" (Nederlandse notatie zonder decimalen). */
const DUIZENDTALLEN_MET_PUNT = /^-?\d{1,3}(\.\d{3})+$/

/**
 * "2.240,50" / "2240,50" / "2240.50" / "2,240.50" → 2240.5; "1.234" → 1234;
 * leeg/onzin → null. Staan er zowel punten als komma's in, dan is het laatste
 * scheidingsteken de decimaal. Een DEGIRO-export is Nederlands, dus een kaal
 * "1.234" is duizend-tweehonderd-vierendertig, geen 1,234.
 */
export function leesGetal(v: string | undefined): number | null {
  if (!v) return null
  const schoon = v.replace(/\s/g, '')
  let genormaliseerd: string
  if (schoon.includes(',') && schoon.includes('.')) {
    genormaliseerd = schoon.lastIndexOf(',') > schoon.lastIndexOf('.')
      ? schoon.replace(/\./g, '').replace(',', '.')
      : schoon.replace(/,/g, '')
  } else if (schoon.includes(',')) {
    genormaliseerd = schoon.replace(',', '.')
  } else if (DUIZENDTALLEN_MET_PUNT.test(schoon)) {
    genormaliseerd = schoon.replace(/\./g, '')
  } else {
    genormaliseerd = schoon
  }
  const n = Number(genormaliseerd)
  return Number.isFinite(n) ? n : null
}

const ISIN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/

export function leesDegiroCsv(tekst: string): CsvPortefeuille | null {
  const regels = tekst.replace(/^﻿/, '').split(/\r?\n/).filter((r) => r.trim().length > 0)
  if (regels.length < 2) return null
  const kop = splitsRegel(regels[0]).map((k) => k.toLowerCase())
  if (!kop[0]?.startsWith('product') || !kop.some((k) => k.includes('isin'))) return null

  const posities: CsvPositie[] = []
  let cashEur: number | null = null
  for (const regel of regels.slice(1)) {
    const [naam, isin, aantal, slot, valuta, , eur] = splitsRegel(regel)
    if (!naam) continue
    if (/^cash/i.test(naam)) {
      cashEur = (cashEur ?? 0) + (leesGetal(eur) ?? 0)
      continue
    }
    const n = leesGetal(aantal)
    const koers = leesGetal(slot)
    if (!isin || !ISIN.test(isin) || n === null || n <= 0 || koers === null) continue
    posities.push({ naam, isin, aantal: n, slotkoers: koers, valuta: (valuta || 'EUR').toUpperCase(), waardeEur: leesGetal(eur) })
  }
  return { posities, cashEur: cashEur === null ? null : Math.round(cashEur * 100) / 100 }
}
