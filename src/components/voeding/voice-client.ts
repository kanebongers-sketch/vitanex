// ─── Voeding — voice: client-vorm + narrowing ──────────────────────────────
// Het antwoord van POST /api/voeding/voice, plus de narrower. De AI-uitvoer is
// een systeemgrens: een `as` zou de review-UI laten crashen als een veld ontbreekt.
// Ontbrekende macro's worden 0 (het is een schatting die je tóch corrigeert).

export type Betrouwbaarheid = 'laag' | 'gemiddeld' | 'hoog'

export interface VoiceItem {
  naam: string
  portieOmschrijving: string | null
  portieGram: number | null
  calorieen: number
  eiwittenG: number
  koolhydratenG: number
  vettenG: number
  betrouwbaarheid: Betrouwbaarheid
}

export interface VoiceRespons {
  transcript: string
  items: VoiceItem[]
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function getalOfNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function leesBetrouwbaarheid(v: unknown): Betrouwbaarheid {
  return v === 'hoog' || v === 'gemiddeld' ? v : 'laag'
}

/** Eén item uit de AI-uitvoer, of null als het geen bruikbaar product is (geen naam). */
export function leesVoiceItem(v: unknown): VoiceItem | null {
  if (!isObject(v)) return null
  const naam = typeof v.naam === 'string' ? v.naam.trim() : ''
  if (naam.length === 0) return null
  return {
    naam,
    portieOmschrijving: typeof v.portie_omschrijving === 'string' && v.portie_omschrijving.length > 0 ? v.portie_omschrijving : null,
    portieGram: getalOfNull(v.portie_gram),
    calorieen: Math.round(getal(v.calorieen)),
    eiwittenG: getal(v.eiwitten_g),
    koolhydratenG: getal(v.koolhydraten_g),
    vettenG: getal(v.vetten_g),
    betrouwbaarheid: leesBetrouwbaarheid(v.betrouwbaarheid),
  }
}

/** Het volledige voice-antwoord, of null als de vorm niet klopt (fout ≠ leeg). */
export function leesVoiceRespons(ruw: unknown): VoiceRespons | null {
  if (!isObject(ruw)) return null
  const transcript = typeof ruw.transcript === 'string' ? ruw.transcript : ''
  const items = Array.isArray(ruw.items)
    ? ruw.items.map(leesVoiceItem).filter((i): i is VoiceItem => i !== null)
    : []
  return { transcript, items }
}
