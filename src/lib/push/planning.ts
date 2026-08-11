// ─── Push-planning (puur) ────────────────────────────────────────────────────
// Beslist wélke notificatie(s) een gebruiker op dit moment mag krijgen. Ethisch
// van opzet: respecteer stiltetijd en een harde daglimiet, verstuur nooit een
// herinnering als de gebruiker vandaag al actief was, en dubbel-ping niet op één
// avond. Volledig puur — de klok en alle DB-feiten komen als argument binnen.

import { binnenStiltetijd, minutenVanTijd } from './timing'

export type MeldingType = 'checkin' | 'streak' | 'vita_week'

export interface PushVoorkeuren {
  checkinAan: boolean
  streakAan: boolean
  vitaWeekAan: boolean
  stiltetijdStart: string // "HH:MM"
  stiltetijdEind: string // "HH:MM"
  maxPerDag: number
}

export interface PlanContext {
  /** Huidig moment in NL-tijd. weekdag: 0 = zondag … 6 = zaterdag. */
  nuMinuten: number
  datum: string // YYYY-MM-DD (NL)
  weekdag: number
  voorkeuren: PushVoorkeuren
  /** Heeft de gebruiker vandaag al ingecheckt / iets gelogd? */
  reedsVandaagActief: boolean
  streak: number
  /** Slim berekend herinnermoment voor de check-in ("HH:MM"). */
  slimMomentCheckin: string
  /** Laatste verzenddatum per type (YYYY-MM-DD) of null. */
  laatstVerzonden: Partial<Record<MeldingType, string | null>>
  /** Aantal push-meldingen dat vandaag al is verstuurd (voor de daglimiet). */
  reedsVerzondenVandaag: number
}

export interface GeplandeMelding {
  type: MeldingType
  titel: string
  tekst: string
}

const STREAK_DREMPEL = 2 // pas een streak "in gevaar" melden als er iets te verliezen is
const STREAK_AVOND_UUR = 20 // niet eerder dan 20:00 waarschuwen
const VITA_WEEK_UUR_VROEG = 10
const VITA_WEEK_UUR_LAAT = 12
const VITA_WEEK_WEEKDAG = 0 // zondag

function alVerzondenOp(laatst: string | null | undefined, datum: string): boolean {
  return laatst === datum
}

/**
 * Bepaalt de notificatie(s) voor nu. Geeft een lege lijst als er niets past
 * (dat is de normale uitkomst — we sturen liever niets dan te veel).
 */
export function kiesMeldingen(ctx: PlanContext): GeplandeMelding[] {
  const { voorkeuren: v, nuMinuten, datum } = ctx

  // 1. Stiltetijd is heilig — binnen het venster nooit iets sturen.
  if (binnenStiltetijd(nuMinuten, v.stiltetijdStart, v.stiltetijdEind)) return []

  // 2. Daglimiet al bereikt → stil.
  if (ctx.reedsVerzondenVandaag >= Math.max(0, v.maxPerDag)) return []

  const uur = Math.floor(nuMinuten / 60)
  const slim = minutenVanTijd(ctx.slimMomentCheckin)

  // 3. Streak in gevaar heeft voorrang op de gewone check-in-herinnering:
  //    's avonds, streak het beschermen waard, vandaag nog niet actief.
  const streakInGevaar =
    v.streakAan &&
    !ctx.reedsVandaagActief &&
    ctx.streak >= STREAK_DREMPEL &&
    uur >= STREAK_AVOND_UUR &&
    !alVerzondenOp(ctx.laatstVerzonden.streak, datum)

  if (streakInGevaar) {
    return [{
      type: 'streak',
      titel: 'Je reeks loopt gevaar',
      tekst: `Nog even inchecken vandaag om je reeks van ${ctx.streak} dagen vast te houden.`,
    }]
  }

  // 4. Gewone check-in-herinnering op het slimme moment, als je nog niet actief was.
  const checkinTijd =
    v.checkinAan &&
    !ctx.reedsVandaagActief &&
    slim !== null &&
    nuMinuten >= slim &&
    !alVerzondenOp(ctx.laatstVerzonden.checkin, datum)

  if (checkinTijd) {
    return [{
      type: 'checkin',
      titel: 'Tijd voor je check-in',
      tekst: 'Een minuutje voor jezelf — hoe gaat het vandaag? Houd je reeks vast.',
    }]
  }

  // 5. Vita's weekinzicht: één keer per week, op een rustig moment.
  const vitaWeek =
    v.vitaWeekAan &&
    ctx.weekdag === VITA_WEEK_WEEKDAG &&
    uur >= VITA_WEEK_UUR_VROEG &&
    uur < VITA_WEEK_UUR_LAAT &&
    !alVerzondenOp(ctx.laatstVerzonden.vita_week, datum)

  if (vitaWeek) {
    return [{
      type: 'vita_week',
      titel: 'Je week met Vita',
      tekst: 'Vita heeft je voortgang van deze week voor je samengevat. Bekijk je inzichten.',
    }]
  }

  return []
}
