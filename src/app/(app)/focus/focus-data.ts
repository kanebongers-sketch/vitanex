// Statische inhoud voor de interactieve delen van het Focus-scherm
// (ademhaling + timer). Puur data en pure helpers — geen client-code.

export type HoofdTab = 'timer' | 'adem' | 'beweging' | 'voeding' | 'slaap' | 'mentaal'
export type AdemTab = 'box' | '478' | 'coherentie' | 'wim'
export type TimerTab = 'focus' | 'pauze' | 'micro'

// Teksten staan in het woordenboek (gebied mentaal, sleutels mentaal.focus.*);
// hier alleen structuur, duur en kleur.

export type AdemFaseSoort = 'inademen' | 'vasthouden' | 'uitademen' | 'inNeus' | 'extraInNeus' | 'langUitademen'

export interface AdemFase {
  /** Label: mentaal.focus.fase.<soort>. */
  soort: AdemFaseSoort
  duur: number
  kleur: string
}

export interface AdemTechniek {
  /** Teksten: mentaal.focus.adem.<tab>.naam / .beschrijving / .voordeel<n>. */
  fases: AdemFase[]
  aantalVoordelen: number
}

export const ADEM: Record<AdemTab, AdemTechniek> = {
  box: {
    aantalVoordelen: 3,
    fases: [
      { soort: 'inademen', duur: 4, kleur: 'var(--mf-green)' },
      { soort: 'vasthouden', duur: 4, kleur: 'var(--mf-blue)' },
      { soort: 'uitademen', duur: 4, kleur: 'var(--mf-purple)' },
      { soort: 'vasthouden', duur: 4, kleur: 'var(--mf-amber)' },
    ],
  },
  '478': {
    aantalVoordelen: 3,
    fases: [
      { soort: 'inademen', duur: 4, kleur: 'var(--mf-green)' },
      { soort: 'vasthouden', duur: 7, kleur: 'var(--mf-blue)' },
      { soort: 'uitademen', duur: 8, kleur: 'var(--mf-purple)' },
    ],
  },
  coherentie: {
    aantalVoordelen: 3,
    fases: [
      { soort: 'inademen', duur: 5, kleur: 'var(--mf-green)' },
      { soort: 'uitademen', duur: 5, kleur: 'var(--mf-purple)' },
    ],
  },
  wim: {
    aantalVoordelen: 3,
    fases: [
      { soort: 'inNeus', duur: 2, kleur: 'var(--mf-green)' },
      { soort: 'extraInNeus', duur: 1, kleur: 'var(--mf-blue)' },
      { soort: 'langUitademen', duur: 8, kleur: 'var(--mf-purple)' },
    ],
  },
}

export interface AdemAdvies {
  /** Teksten: mentaal.focus.advies.<sleutel>.wanneer / .reden. */
  sleutel: string
  techniek: AdemTab
}

export const ADEM_ADVIES: AdemAdvies[] = [
  { sleutel: 'acuut', techniek: 'wim' },
  { sleutel: 'presentatie', techniek: 'box' },
  { sleutel: 'slapen', techniek: '478' },
  { sleutel: 'vermoeid', techniek: 'coherentie' },
]

export interface TimerConfig {
  /** Teksten: mentaal.focus.timer.<tab>.naam / .tip. */
  duur: number
  kleur: string
  afk: string
}

export const TIMERS: Record<TimerTab, TimerConfig> = {
  focus: { duur: 25 * 60, kleur: 'var(--mf-green)', afk: '25' },
  pauze: { duur: 5 * 60, kleur: 'var(--mf-blue)', afk: '5' },
  micro: { duur: 90, kleur: 'var(--mf-purple)', afk: '90s' },
}

/** Sleutels onder mentaal.focus.micro. */
export const MICRO_IDEEEN = ['kijkVer', 'nek', 'water', 'rondje', 'buikadem', 'handen', 'bericht'] as const

export interface PomodoroBlok {
  minuten: number
  soort: 'focus' | 'pauze' | 'lang'
}

export const POMODORO_BLOKKEN: PomodoroBlok[] = [
  { minuten: 25, soort: 'focus' },
  { minuten: 5, soort: 'pauze' },
  { minuten: 25, soort: 'focus' },
  { minuten: 5, soort: 'pauze' },
  { minuten: 25, soort: 'focus' },
  { minuten: 5, soort: 'pauze' },
  { minuten: 25, soort: 'focus' },
  { minuten: 20, soort: 'lang' },
]

export function formatTijd(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}
