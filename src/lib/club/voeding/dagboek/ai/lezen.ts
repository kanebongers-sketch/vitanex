// ─── Club, voedingsdagboek: antwoorden van de AI lezen (PUUR) ───────────────
// Geporteerd uit MentaForce (components/voeding/voice-client.ts en de parsing in
// api/voeding/*). De uitvoer van een model is een systeemgrens: een kapot of
// onvolledig item mag het controlescherm nooit laten vastlopen. Ontbrekende
// macro's worden 0 (het blijft een schatting die het lid altijd zelf nakijkt),
// items zonder naam vallen weg. Foto en schatten geven allebei deze
// vorm terug: een lijst items die het lid controleert voor het opslaan.

export type Betrouwbaarheid = 'laag' | 'gemiddeld' | 'hoog'

export interface AiItem {
  naam: string
  portieOmschrijving: string | null
  portieGram: number | null
  kcal: number
  eiwitG: number
  koolhydratenG: number
  vetG: number
  betrouwbaarheid: Betrouwbaarheid
}

export interface AiRespons {
  /** De omschrijving van het lid bij schatten; leeg bij een foto. */
  transcript: string
  items: AiItem[]
}

export const MAX_ITEMS = 15

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

function getalOfNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

function leesBetrouwbaarheid(v: unknown): Betrouwbaarheid {
  return v === 'hoog' || v === 'gemiddeld' ? v : 'laag'
}

const een = (n: number): number => Math.round(n * 10) / 10

/** Een item uit de AI-uitvoer (snake_case), of null als het geen bruikbaar product is (geen naam). */
export function leesAiItem(v: unknown): AiItem | null {
  if (!isObject(v)) return null
  const naam = typeof v.naam === 'string' ? v.naam.replace(/\s+/g, ' ').trim().slice(0, 120) : ''
  if (naam.length === 0) return null
  const gram = getalOfNull(v.portie_gram)
  return {
    naam,
    portieOmschrijving: typeof v.portie_omschrijving === 'string' && v.portie_omschrijving.trim().length > 0 ? v.portie_omschrijving.trim().slice(0, 60) : null,
    portieGram: gram !== null && gram <= 5000 ? Math.round(gram) : null,
    kcal: Math.min(10000, Math.round(getal(v.calorieen))),
    eiwitG: Math.min(1000, een(getal(v.eiwitten_g))),
    koolhydratenG: Math.min(2000, een(getal(v.koolhydraten_g))),
    vetG: Math.min(1000, een(getal(v.vetten_g))),
    betrouwbaarheid: leesBetrouwbaarheid(v.betrouwbaarheid),
  }
}

/** Het hele antwoord, of null als de vorm niet klopt (fout is iets anders dan leeg). */
export function leesAiRespons(ruw: unknown): AiRespons | null {
  if (!isObject(ruw)) return null
  const transcript = typeof ruw.transcript === 'string' ? ruw.transcript.slice(0, 500) : ''
  const items = Array.isArray(ruw.items) ? ruw.items.map(leesAiItem).filter((i): i is AiItem => i !== null).slice(0, MAX_ITEMS) : []
  return { transcript, items }
}

/** Haalt het eerste JSON-object uit een modelantwoord (met of zonder ```-hekjes). */
export function eersteJson(tekst: string): unknown {
  const start = tekst.indexOf('{')
  const eind = tekst.lastIndexOf('}')
  if (start === -1 || eind <= start) return null
  try {
    return JSON.parse(tekst.slice(start, eind + 1)) as unknown
  } catch {
    return null
  }
}
