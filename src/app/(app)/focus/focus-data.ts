// Statische inhoud voor de interactieve delen van het Focus-scherm
// (ademhaling + timer). Puur data en pure helpers — geen client-code.

export type HoofdTab = 'timer' | 'adem' | 'beweging' | 'voeding' | 'slaap' | 'mentaal'
export type AdemTab = 'box' | '478' | 'coherentie' | 'wim'
export type TimerTab = 'focus' | 'pauze' | 'micro'

export interface AdemFase {
  label: string
  duur: number
  kleur: string
}

export interface AdemTechniek {
  naam: string
  beschrijving: string
  fases: AdemFase[]
  voordelen: string[]
}

export const ADEM: Record<AdemTab, AdemTechniek> = {
  box: {
    naam: 'Box breathing',
    beschrijving: 'Gebruikt door Navy SEALs en topsporters om stress snel te verlagen en focus te herwinnen.',
    voordelen: ['Verlaagt cortisol', 'Verbetert concentratie', 'Kalmeert het zenuwstelsel'],
    fases: [
      { label: 'Inademen', duur: 4, kleur: 'var(--mf-green)' },
      { label: 'Vasthouden', duur: 4, kleur: 'var(--mf-blue)' },
      { label: 'Uitademen', duur: 4, kleur: 'var(--mf-purple)' },
      { label: 'Vasthouden', duur: 4, kleur: 'var(--mf-amber)' },
    ],
  },
  '478': {
    naam: '4-7-8 methode',
    beschrijving: 'Ontwikkeld door Dr. Andrew Weil. Kalmeert het autonome zenuwstelsel en helpt bij angst en inslapen.',
    voordelen: ['Vermindert angst', 'Helpt bij inslapen', 'Verlaagt hartslag'],
    fases: [
      { label: 'Inademen', duur: 4, kleur: 'var(--mf-green)' },
      { label: 'Vasthouden', duur: 7, kleur: 'var(--mf-blue)' },
      { label: 'Uitademen', duur: 8, kleur: 'var(--mf-purple)' },
    ],
  },
  coherentie: {
    naam: 'Hartcoherentie',
    beschrijving: 'Synchroniseert de ademhaling met het hart. 5-5 ritme activeert de herstelrespons.',
    voordelen: ['Balanceert hart & geest', 'Verlaagt bloeddruk', 'Verbetert emotieregulatie'],
    fases: [
      { label: 'Inademen', duur: 5, kleur: 'var(--mf-green)' },
      { label: 'Uitademen', duur: 5, kleur: 'var(--mf-purple)' },
    ],
  },
  wim: {
    naam: 'Fysiologische snik',
    beschrijving: 'Dubbele inademing door de neus gevolgd door een lange uitademing. Stamt uit neurowetenschappelijk onderzoek van Stanford.',
    voordelen: ['Snelste stressverlichting', 'Activeert parasympathisch stelsel', 'Werkt binnen 1 minuut'],
    fases: [
      { label: 'In (neus)', duur: 2, kleur: 'var(--mf-green)' },
      { label: 'Extra in (neus)', duur: 1, kleur: 'var(--mf-blue)' },
      { label: 'Lang uitademen', duur: 8, kleur: 'var(--mf-purple)' },
    ],
  },
}

export interface AdemAdvies {
  when: string
  use: string
  reden: string
}

export const ADEM_ADVIES: AdemAdvies[] = [
  { when: 'Acuut gestrest of overprikkeld', use: 'Fysiologische snik', reden: 'Snelste resultaat, werkt in 1-2 ademhalingen' },
  { when: 'Aankomende presentatie of gesprek', use: 'Box breathing', reden: '5 minuten voor een stressvolle situatie' },
  { when: 'Niet kunnen slapen', use: '4-7-8 methode', reden: '3-4 rondes ontspant het parasympathisch stelsel' },
  { when: 'Mentale vermoeidheid overdag', use: 'Hartcoherentie', reden: 'Herstelt energiebalans bij langdurige stress' },
]

export interface TimerConfig {
  naam: string
  duur: number
  kleur: string
  afk: string
  tip: string
}

export const TIMERS: Record<TimerTab, TimerConfig> = {
  focus: { naam: 'Diepe focus', duur: 25 * 60, kleur: 'var(--mf-green)', afk: '25', tip: 'Leg je telefoon weg, sluit onnodige tabs en zet notificaties op stil.' },
  pauze: { naam: 'Pauze', duur: 5 * 60, kleur: 'var(--mf-blue)', afk: '5', tip: 'Sta op, rek je uit, kijk even naar buiten. Geen scherm.' },
  micro: { naam: 'Micro-break', duur: 90, kleur: 'var(--mf-purple)', afk: '90s', tip: 'Sluit je ogen. Adem 3x diep in. Ontspan je kaken en schouders.' },
}

export const MICRO_IDEEEN: string[] = [
  'Kijk 20 sec naar iets op 6 meter (20-20-20 regel)',
  'Rek je nek links en rechts, 3x per kant',
  'Drink een glas water',
  'Loop een rondje door het kantoor',
  'Doe 3 diepe buikademhalingen',
  'Schud je handen en polsen los',
  'Stuur een berichtje naar iemand die je energie geeft',
]

export interface PomodoroBlok {
  label: string
  soort: 'focus' | 'pauze' | 'lang'
}

export const POMODORO_BLOKKEN: PomodoroBlok[] = [
  { label: '25m focus', soort: 'focus' },
  { label: '5m pauze', soort: 'pauze' },
  { label: '25m focus', soort: 'focus' },
  { label: '5m pauze', soort: 'pauze' },
  { label: '25m focus', soort: 'focus' },
  { label: '5m pauze', soort: 'pauze' },
  { label: '25m focus', soort: 'focus' },
  { label: '20m pauze', soort: 'lang' },
]

export function formatTijd(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}
