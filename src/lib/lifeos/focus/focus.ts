// ─── LifeOS — focusblok ────────────────────────────────────────────────────
// Vervangt: Pomodoro-apps (Forest, Be Focused, Session).
//
// Eén blok tegelijk. Wat je NU doet, niet wat er allemaal ligt — dat is het
// verschil tussen dit en een takenlijst met een timer eraan geplakt.
//
// Puur bestand: geen React, geen timers, geen Date.now(). De tijd komt er altijd
// ín. Daardoor is dit volledig testbaar zonder de klok te mocken, en valt een
// test niet anders uit om 23:59 dan om 09:00 — dezelfde discipline als
// `lib/momenten/momenten.ts`.

export type FocusFase = 'inactief' | 'werk' | 'pauze'

export interface FocusSessie {
  fase: FocusFase
  /** Wanneer de huidige fase begon (ms sinds epoch). Null als inactief. */
  startMs: number | null
  /** Hoe lang de huidige fase duurt (ms). 0 als inactief. */
  duurMs: number
  /** Hoeveelste werkblok van deze reeks. Begint op 1. */
  ronde: number
  /** Waar je aan werkt. Leeg mag: soms weet je het pas als je begint. */
  waaraan: string
}

export const WERK_MINUTEN = 25
export const PAUZE_MINUTEN = 5
/** Na vier ronden een langere pauze — dat is het punt van ronden tellen. */
export const LANGE_PAUZE_MINUTEN = 20
export const RONDEN_TOT_LANGE_PAUZE = 4

const MIN_MS = 60_000

export const INACTIEF: FocusSessie = {
  fase: 'inactief',
  startMs: null,
  duurMs: 0,
  ronde: 1,
  waaraan: '',
}

/** Start een werkblok. */
export function startWerk(nu: number, waaraan = '', ronde = 1): FocusSessie {
  return {
    fase: 'werk',
    startMs: nu,
    duurMs: WERK_MINUTEN * MIN_MS,
    ronde: Math.max(1, Math.floor(ronde)),
    waaraan,
  }
}

/** Hoe lang duurt de pauze na dit werkblok? */
export function pauzeMinutenNa(ronde: number): number {
  return ronde % RONDEN_TOT_LANGE_PAUZE === 0 ? LANGE_PAUZE_MINUTEN : PAUZE_MINUTEN
}

/**
 * Resterende tijd in ms. Nooit negatief: een blok dat al voorbij is staat op 0,
 * niet op "-3 minuten".
 *
 * Inactief → null, geen 0. Die twee betekenen niet hetzelfde: 0 is "je blok is
 * afgelopen", null is "er loopt niets". Ze samenvoegen zou de UI laten juichen
 * over een blok dat nooit gestart is.
 */
export function resterendMs(sessie: FocusSessie, nu: number): number | null {
  if (sessie.fase === 'inactief' || sessie.startMs === null) return null
  const verstreken = nu - sessie.startMs
  return Math.max(0, sessie.duurMs - verstreken)
}

/** Is de huidige fase afgelopen? Inactief is nooit "klaar". */
export function isKlaar(sessie: FocusSessie, nu: number): boolean {
  const rest = resterendMs(sessie, nu)
  return rest !== null && rest === 0
}

/**
 * Voortgang 0-1 van de huidige fase. Inactief → null.
 * Voor een ring; daarom geklemd, zodat een tab die 10 minuten sliep geen 3.4
 * teruggeeft.
 */
export function voortgang(sessie: FocusSessie, nu: number): number | null {
  const rest = resterendMs(sessie, nu)
  if (rest === null || sessie.duurMs === 0) return null
  return Math.min(1, Math.max(0, 1 - rest / sessie.duurMs))
}

/**
 * De volgende fase: werk → pauze → werk. Roep dit aan als de huidige fase klaar
 * is; anders krijg je 'm ongewijzigd terug.
 *
 * Bewust geen automatische doorstart: het blok is afgelopen, en of je doorgaat
 * beslis jíj. Een timer die zichzelf opnieuw start is een timer die je gebruikt
 * in plaats van andersom.
 */
export function volgendeFase(sessie: FocusSessie, nu: number): FocusSessie {
  if (!isKlaar(sessie, nu)) return sessie

  if (sessie.fase === 'werk') {
    return {
      fase: 'pauze',
      startMs: nu,
      duurMs: pauzeMinutenNa(sessie.ronde) * MIN_MS,
      ronde: sessie.ronde,
      waaraan: sessie.waaraan,
    }
  }

  // Pauze klaar → volgend werkblok, ronde omhoog.
  return startWerk(nu, sessie.waaraan, sessie.ronde + 1)
}

/** Stop de reeks. Ronde terug naar 1 — een nieuwe reeks begint schoon. */
export function stop(): FocusSessie {
  return INACTIEF
}

/** mm:ss. Voor een timer, dus tabulair weergeven (`.os-cijfer`). */
export function klokTekst(ms: number): string {
  const totaal = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totaal / 60)
  const s = totaal % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
