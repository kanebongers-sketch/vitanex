// ─── LifeOS — de drie momenten ─────────────────────────────────────────────
// Het dashboard is géén muur van widgets. LifeOS kent drie momenten, en toont
// wat op dát moment telt. Een widget verschijnt wanneer hij ertoe doet, niet
// om 07:00 allemaal tegelijk.
//
//   Ochtend — "Hoe sta ik ervoor en wat wordt vandaag?"
//   Nu      — "Wat doe ik dit uur?"
//   Avond   — "Hoe ging het, en wat morgen?"
//
// Puur bestand: geen React, geen Date.now() binnenin. De tijd komt er altijd
// ín, zodat dit testbaar is zonder de klok te mocken en zonder dat een test om
// 23:59 anders uitvalt dan om 09:00.

export type MomentKey = 'ochtend' | 'nu' | 'avond'

export interface MomentDef {
  key: MomentKey
  /** Weergavenaam (NL). */
  label: string
  /** De énige vraag die dit moment beantwoordt. Meer past er niet in. */
  vraag: string
  /** lucide-react icoonnaam; de UI mapt naar een component. */
  icoon: string
}

export const MOMENTEN: readonly MomentDef[] = [
  {
    key: 'ochtend',
    label: 'Ochtend',
    vraag: 'Hoe sta ik ervoor en wat wordt vandaag?',
    icoon: 'Sunrise',
  },
  {
    key: 'nu',
    label: 'Nu',
    vraag: 'Wat doe ik dit uur?',
    icoon: 'Zap',
  },
  {
    key: 'avond',
    label: 'Avond',
    vraag: 'Hoe ging het, en wat morgen?',
    icoon: 'Moon',
  },
] as const

const MOMENT_MAP: Readonly<Record<MomentKey, MomentDef>> = Object.freeze(
  Object.fromEntries(MOMENTEN.map((m) => [m.key, m])) as Record<MomentKey, MomentDef>,
)

/** Definitie op key. Totaal over `MomentKey`, dus geen undefined-tak. */
export function momentDef(key: MomentKey): MomentDef {
  return MOMENT_MAP[key]
}

/**
 * Welk moment hoort bij dit uur?
 *
 * Grenzen: ochtend tot 11:00, avond vanaf 20:00, daartussen "nu". Bewust ruim:
 * de ochtend moet er nog zijn als je om 10:30 pas achter je bureau zit, en de
 * avond begint niet om 17:00 als je dan nog werkt.
 *
 * @param uur 0-23, lokale tijd van de gebruiker.
 */
export function momentVoorUur(uur: number): MomentKey {
  if (!Number.isFinite(uur)) return 'nu'
  const u = Math.floor(uur)
  if (u < 11) return 'ochtend'
  if (u >= 20) return 'avond'
  return 'nu'
}

/**
 * Het huidige moment. De klok komt er expliciet in — geen verborgen Date.now().
 */
export function huidigMoment(nu: Date): MomentKey {
  return momentVoorUur(nu.getHours())
}

/**
 * Groet die past bij het uur. Kort en menselijk; geen uitroeptekens-hype.
 */
export function groetVoorUur(uur: number): string {
  const moment = momentVoorUur(uur)
  if (moment === 'ochtend') return 'Goedemorgen'
  if (moment === 'avond') return 'Goedenavond'
  return 'Hallo'
}
