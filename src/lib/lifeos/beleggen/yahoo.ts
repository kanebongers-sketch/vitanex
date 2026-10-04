// ─── LifeOS — koersen via Yahoo Finance (SERVER-ONLY voor de fetch) ─────────
// Yahoo's chart- en zoek-endpoint: geen API-sleutel nodig, ± 15 minuten vertraagd.
// Het is geen officiële, gedocumenteerde API — daarom narrowen we elk antwoord en
// valt een kapot antwoord terug op "geen koers" (en toont de kaart de laatst
// bekende koers mét tijdstip), nooit op een verzonnen getal.

const CHART = 'https://query1.finance.yahoo.com/v8/finance/chart'
const ZOEK = 'https://query2.finance.yahoo.com/v1/finance/search'
const TIMEOUT_MS = 8_000
const KOPPEN = { 'User-Agent': 'Mozilla/5.0 (LifeOS)', Accept: 'application/json' }

export interface Koers {
  symbool: string
  koers: number
  /** Slotkoers van de vorige handelsdag (voor "vandaag"), of null. */
  vorigeSlot: number | null
  valuta: string
  naam: string | null
  /** Moment van de laatste notering. */
  marktTijd: Date | null
}

export interface ZoekResultaat {
  symbool: string
  naam: string
  beurs: string
  soort: string
}

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

/** Het chart-antwoord → een koers, of null. Puur. */
export function leesKoers(ruw: unknown): Koers | null {
  const result = obj(obj(ruw)?.chart)?.result
  const meta = obj(Array.isArray(result) ? obj(result[0])?.meta : null)
  if (!meta) return null
  const symbool = tekst(meta.symbol)
  const koers = getal(meta.regularMarketPrice)
  const valuta = tekst(meta.currency)
  if (!symbool || koers === null || koers <= 0 || !valuta) return null
  const tijd = getal(meta.regularMarketTime)
  return {
    symbool,
    koers,
    vorigeSlot: getal(meta.chartPreviousClose) ?? getal(meta.previousClose),
    valuta,
    naam: tekst(meta.longName) ?? tekst(meta.shortName),
    marktTijd: tijd !== null ? new Date(tijd * 1000) : null,
  }
}

/** Het zoek-antwoord → noteringen (aandelen, ETF's, fondsen). Puur. */
export function leesZoek(ruw: unknown): ZoekResultaat[] {
  const quotes = obj(ruw)?.quotes
  if (!Array.isArray(quotes)) return []
  const uit: ZoekResultaat[] = []
  for (const q of quotes) {
    const o = obj(q)
    const symbool = tekst(o?.symbol)
    const soort = tekst(o?.quoteType)
    if (!o || !symbool || !soort || !['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX', 'CRYPTOCURRENCY'].includes(soort)) continue
    uit.push({
      symbool,
      naam: tekst(o.longname) ?? tekst(o.shortname) ?? symbool,
      beurs: tekst(o.exchDisp) ?? tekst(o.exchange) ?? '',
      soort,
    })
  }
  return uit
}

async function haal(url: string): Promise<unknown> {
  const antwoord = await fetch(url, { headers: KOPPEN, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
  if (!antwoord.ok) return null
  return antwoord.json().catch(() => null)
}

/** De actuele koers van één symbool, of null (onbekend symbool of Yahoo onbereikbaar). */
export async function haalKoers(symbool: string): Promise<Koers | null> {
  try {
    return leesKoers(await haal(`${CHART}/${encodeURIComponent(symbool)}?range=1d&interval=1d`))
  } catch {
    return null
  }
}

/** Zoeken op ticker, naam of ISIN. */
export async function zoekNotering(q: string): Promise<ZoekResultaat[]> {
  try {
    const params = new URLSearchParams({ q, quotesCount: '10', newsCount: '0' })
    return leesZoek(await haal(`${ZOEK}?${params.toString()}`))
  } catch {
    return []
  }
}
