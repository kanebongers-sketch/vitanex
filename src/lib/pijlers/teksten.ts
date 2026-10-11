// ─── Pijler-teksten in de taal van de gebruiker ─────────────────────────────
// De constanten in pijlers.ts / acties.ts blijven de Nederlandse bron (ook voor
// server-logica en AI-context). Wat in de UI komt, loopt via deze helpers en het
// woordenboek `voortgang` (src/lib/i18n/woordenboeken/voortgang/<taal>.json).
//
// Puur: geen React, geen server-API's. Zonder taalset → Nederlands, dus bestaande
// aanroepen en tests blijven hetzelfde.

import voortgangNl from '@/lib/i18n/woordenboeken/voortgang/nl.json'
import { maakTaalset, type Taalset } from '@/lib/i18n/taalset'
import { INTL_LOCALE, type Taal } from '@/lib/i18n/talen'
import type { Params } from '@/lib/i18n/vertaal'
import type { PijlerKey } from './pijlers'
import { PIJLER_ACTIE } from './acties'
import type { ScoreNiveau } from './score'

/** Nederlandse taalset met de voortgang-teksten: de standaard voor pure helpers. */
export const NL_VOORTGANG: Taalset = maakTaalset('nl', voortgangNl)

/** Bouwt een taalset uit wat `useVertaling()` teruggeeft (voor client-componenten). */
export function alsTaalset(taal: Taal, t: (sleutel: string, params?: Params) => string): Taalset {
  return { taal, locale: INTL_LOCALE[taal], t }
}

export function pijlerLabel(key: PijlerKey, ts: Taalset = NL_VOORTGANG): string {
  return ts.t(`voortgang.pijlers.${key}.label`)
}

export function pijlerOmschrijving(key: PijlerKey, ts: Taalset = NL_VOORTGANG): string {
  return ts.t(`voortgang.pijlers.${key}.omschrijving`)
}

export function pijlerTip(key: PijlerKey, ts: Taalset = NL_VOORTGANG): string {
  return ts.t(`voortgang.pijlers.${key}.tip`)
}

/** Label van de actie-knop ("Log je slaap"). */
export function pijlerActieLabel(key: PijlerKey, ts: Taalset = NL_VOORTGANG): string {
  return ts.t(`voortgang.pijlers.${key}.actie`)
}

/**
 * De challenge van vandaag in de taal van de gebruiker. Zelfde deterministische
 * rotatie als `challengeVoorVandaag` (acties.ts): dezelfde dag, dezelfde index.
 */
export function challengeTekst(key: PijlerKey, datum: Date = new Date(), ts: Taalset = NL_VOORTGANG): string {
  const aantal = PIJLER_ACTIE[key].challenges.length
  const dagNummer = Math.floor(datum.getTime() / 86_400_000)
  return ts.t(`voortgang.pijlers.${key}.challenges.${dagNummer % aantal}`)
}

/** Label van een scoreniveau ('Goed', 'Redelijk', ...). */
export function niveauLabel(niveau: ScoreNiveau, ts: Taalset = NL_VOORTGANG): string {
  return ts.t(`voortgang.niveau.${niveau}`)
}

// Bronnamen komen als Nederlandse tekst uit pijlers-server (ook in de API).
// Voor de weergave vertalen we ze; een onbekende naam tonen we zoals hij is.
const BRON_SLEUTEL: Readonly<Record<string, string>> = {
  'Dagelijkse energie': 'dagelijkseEnergie',
  'Weekcheck-in': 'weekcheckin',
  Slaapduur: 'slaapduur',
  Slaapkwaliteit: 'slaapkwaliteit',
  Stresslogs: 'stresslogs',
  'Stemming-logs': 'stemmingLogs',
  Stappen: 'stappen',
  Training: 'training',
  Voedingskwaliteit: 'voedingskwaliteit',
  Hydratatie: 'hydratatie',
}

export function bronLabel(naam: string, ts: Taalset = NL_VOORTGANG): string {
  const sleutel = BRON_SLEUTEL[naam]
  return sleutel ? ts.t(`voortgang.bron.${sleutel}`) : naam
}
