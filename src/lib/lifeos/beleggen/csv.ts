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
  cashEur: number
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

/** "2.240,50" / "2240,50" / "2240.50" → 2240.5; leeg/onzin → null. */
export function leesGetal(v: string | undefined): number | null {
  if (!v) return null
  const schoon = v.replace(/\s/g, '')
  const genormaliseerd = schoon.includes(',') ? schoon.replace(/\./g, '').replace(',', '.') : schoon
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
  let cashEur = 0
  for (const regel of regels.slice(1)) {
    const [naam, isin, aantal, slot, valuta, , eur] = splitsRegel(regel)
    if (!naam) continue
    if (/^cash/i.test(naam)) {
      cashEur += leesGetal(eur) ?? 0
      continue
    }
    const n = leesGetal(aantal)
    const koers = leesGetal(slot)
    if (!isin || !ISIN.test(isin) || n === null || n <= 0 || koers === null) continue
    posities.push({ naam, isin, aantal: n, slotkoers: koers, valuta: (valuta || 'EUR').toUpperCase(), waardeEur: leesGetal(eur) })
  }
  return { posities, cashEur: Math.round(cashEur * 100) / 100 }
}
