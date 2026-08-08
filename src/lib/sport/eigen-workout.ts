// ─── Sport — eigen workout samenstellen (pure) ─────────────────────────────
// Bouwt uit gekozen oefeningen een `Trainingsdag` in exact de vorm die de
// trainingslogger verwacht (schema_json). PUUR + getest, zodat een leeg of onzin-
// workout niet stil in de database belandt.

export interface GekozenOefening {
  naam: string
  spiergroep?: string | null
  sets: number
  herhalingen: string
  rusttijd_sec?: number
  heeft_gewicht?: boolean
  uitvoering_tip?: string
}

/** Eén oefening zoals de logger 'm uit schema_json leest. */
export interface WorkoutOefening {
  naam: string
  sets: number
  herhalingen: string
  rusttijd_sec: number
  heeft_gewicht: boolean
  gewicht_tip: string
  uitvoering_tip: string
}

export interface Trainingsdag {
  dag: number
  naam: string
  spiergroepen: string[]
  coaching_tekst: string
  geschatte_duur: number
  oefeningen: WorkoutOefening[]
}

function klem(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * Bouwt een trainingsdag uit de keuzes, of null als er geen bruikbare oefening in
 * zit. Lege namen en sets ≤ 0 vallen weg; ontbrekende velden krijgen nette defaults.
 */
export function bouwTrainingsdag(naam: string, oefeningen: readonly GekozenOefening[]): Trainingsdag | null {
  const schoon = oefeningen.filter((o) => o.naam.trim().length > 0 && o.sets > 0)
  if (schoon.length === 0) return null

  const oef: WorkoutOefening[] = schoon.map((o) => ({
    naam: o.naam.trim(),
    sets: klem(o.sets, 1, 10),
    herhalingen: o.herhalingen.trim().length > 0 ? o.herhalingen.trim() : '8-12',
    rusttijd_sec: o.rusttijd_sec && o.rusttijd_sec > 0 ? Math.round(o.rusttijd_sec) : 90,
    heeft_gewicht: o.heeft_gewicht ?? true,
    gewicht_tip: '',
    uitvoering_tip: o.uitvoering_tip?.trim() ?? '',
  }))

  const spiergroepen = [...new Set(schoon.map((o) => o.spiergroep).filter((s): s is string => typeof s === 'string' && s.length > 0))]
  // Ruwe duurschatting: ~2 min per set + 10 min opwarmen/wisselen, minimaal 15.
  const geschatteDuur = Math.max(15, oef.reduce((som, o) => som + o.sets * 2, 0) + 10)

  return {
    dag: 1,
    naam: naam.trim().length > 0 ? naam.trim() : 'Mijn workout',
    spiergroepen,
    coaching_tekst: '',
    geschatte_duur: geschatteDuur,
    oefeningen: oef,
  }
}
