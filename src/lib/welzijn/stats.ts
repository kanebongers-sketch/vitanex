// ─── Mentaal welzijn (puur) ──────────────────────────────────────────────────
// Gemiddelden per as (stemming/energie/stress), een zachte reflectie-prompt na
// een log, en een voorzichtig — nadrukkelijk niet-klinisch — signaal bij
// aanhoudend lage stemming of hoge stress. Alles puur en deterministisch.

export type WelzijnAs = 'stemming' | 'energie' | 'stress'

export interface WelzijnLog {
  stemming: number | null
  energie: number | null
  stress: number | null
}

/** Gemiddelde over de eerste N logs (nieuwste eerst) voor één as; null zonder data. */
export function gemiddelde(logs: readonly WelzijnLog[], as: WelzijnAs, n = 7): number | null {
  const waarden = logs.slice(0, n).map((l) => l[as]).filter((v): v is number => typeof v === 'number')
  if (waarden.length === 0) return null
  return Math.round((waarden.reduce((a, b) => a + b, 0) / waarden.length) * 10) / 10
}

export interface ReflectiePrompt {
  vraag: string
  emoji: string
}

/**
 * Eén zachte, open reflectievraag op basis van de zojuist gelogde waarden.
 * Nooit dwingend — de UI toont 'm optioneel en makkelijk over te slaan.
 */
export function reflectiePrompt(stemming: number | null, stress: number | null): ReflectiePrompt {
  if (stress !== null && stress >= 4) return { vraag: 'Wat gaf vandaag de meeste druk?', emoji: '🌬️' }
  if (stemming !== null && stemming <= 2) return { vraag: 'Wat speelde er vandaag mee?', emoji: '💭' }
  if (stemming !== null && stemming >= 4) return { vraag: 'Wat ging er vandaag goed?', emoji: '✨' }
  return { vraag: 'Wat wil je onthouden van vandaag?', emoji: '📝' }
}

export interface WelzijnSignaal {
  tekst: string
  emoji: string
}

const MIN_LOGS = 4 // minder dan dit = te weinig om iets voorzichtigs over te zeggen
const VENSTER = 5
const STEMMING_LAAG = 2.2
const STRESS_HOOG = 4

/**
 * Voorzichtig, niet-klinisch signaal bij een aanhoudend patroon: lage stemming
 * of hoge stress over de recente logs. Geeft null als er niets aan de hand is of
 * te weinig data. Bewust zacht en eerlijk — geen diagnose, wel een uitnodiging
 * tot rust of hulp.
 */
export function kiesWelzijnSignaal(logs: readonly WelzijnLog[]): WelzijnSignaal | null {
  const recent = logs.slice(0, VENSTER)
  const metData = recent.filter((l) => l.stemming !== null || l.stress !== null)
  if (metData.length < MIN_LOGS) return null

  const gemStemming = gemiddelde(recent, 'stemming', VENSTER)
  const gemStress = gemiddelde(recent, 'stress', VENSTER)

  if (gemStress !== null && gemStress >= STRESS_HOOG) {
    return {
      tekst: 'Je stress ligt de laatste tijd hoog. Geen diagnose — wel een seintje om echt even rust te pakken, en hulp te zoeken als het aanhoudt.',
      emoji: '🫧',
    }
  }
  if (gemStemming !== null && gemStemming <= STEMMING_LAAG) {
    return {
      tekst: 'Je stemming zit al een paar dagen laag. Wees mild voor jezelf. Praten met iemand die je vertrouwt kan helpen — je hoeft het niet alleen te dragen.',
      emoji: '🤍',
    }
  }
  return null
}
