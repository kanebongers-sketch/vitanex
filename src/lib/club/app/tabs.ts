// ─── Club, ledenapp: de onderbalk met hoogstens vijf tabbladen (PUUR) ───────
// De onderbalk heeft vijf tabbladen: Home, Boeken, Schema, Voeding en Profiel.
// Daaronder liggen de onderdelen (secties) zoals de sportschool ze aan of uit
// zet en zoals de API ze bewaakt (LEDENAPP_TABBLADEN, ledenlogin/tabs.ts):
// Boeken = Lessen plus Afspraken, Schema = het schema plus Voortgang.
// Een tabblad zonder zichtbare sectie valt weg. Oude adressen (?tab=lessen,
// ?tab=afspraken, ?tab=voortgang) blijven werken: ze openen het tabblad met
// die sectie. Een sectie die uit staat valt terug op een andere sectie van
// hetzelfde tabblad, anders op Home.

import { LEDENAPP_TABBLADEN, type LedenappTabblad } from '@/lib/club/ledenlogin/contract'

export const APP_BALK = ['home', 'boeken', 'schema', 'voeding', 'profiel'] as const
export type AppBalkTab = (typeof APP_BALK)[number]

/** De secties per tabblad, in de volgorde van de schakelaar bovenaan. */
export const BALK_SECTIES: Readonly<Record<AppBalkTab, readonly LedenappTabblad[]>> = {
  home: ['home'],
  boeken: ['lessen', 'afspraken'],
  schema: ['schema', 'voortgang'],
  voeding: ['voeding'],
  profiel: ['profiel'],
}

/** Wat open staat: het tabblad in de onderbalk en de sectie die de inhoud bepaalt. */
export interface AppScherm {
  balk: AppBalkTab
  sectie: LedenappTabblad
}

const HOME: AppScherm = { balk: 'home', sectie: 'home' }

function isSectie(w: string): w is LedenappTabblad {
  return (LEDENAPP_TABBLADEN as readonly string[]).includes(w)
}

function isBalk(w: string): w is AppBalkTab {
  return (APP_BALK as readonly string[]).includes(w)
}

/** Het tabblad waar een sectie onder valt. */
export function balkVan(sectie: LedenappTabblad): AppBalkTab {
  return APP_BALK.find((b) => BALK_SECTIES[b].includes(sectie)) ?? 'home'
}

/** De secties van een tabblad die aan staan (Home en Profiel altijd). */
export function sectiesVan(balk: AppBalkTab, uit: readonly string[]): LedenappTabblad[] {
  return BALK_SECTIES[balk].filter((s) => s === 'home' || s === 'profiel' || !uit.includes(s))
}

/** De tabbladen van de onderbalk die er zijn bij deze secties uit. */
export function zichtbareBalk(uit: readonly string[]): AppBalkTab[] {
  return APP_BALK.filter((b) => sectiesVan(b, uit).length > 0)
}

/** Lees ?tab= (nieuw of oud) tot een tabblad plus sectie die echt aan staan. */
export function kiesScherm(ruw: string | string[] | undefined, uit: readonly string[]): AppScherm {
  const w = (Array.isArray(ruw) ? ruw[0] : ruw) ?? ''
  if (isSectie(w)) {
    const balk = balkVan(w)
    const aan = sectiesVan(balk, uit)
    if (aan.includes(w)) return { balk, sectie: w }
    return aan[0] ? { balk, sectie: aan[0] } : HOME
  }
  if (isBalk(w)) {
    const eerste = sectiesVan(w, uit)[0]
    return eerste ? { balk: w, sectie: eerste } : HOME
  }
  return HOME
}
