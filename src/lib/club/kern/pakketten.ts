// ─── Club: welke pakketten een sportschool heeft afgenomen (PUUR) ───────────
// Besluit Kane (29-10-2026): AI Your Gym is modulair. Een onderdeel is pas
// zichtbaar als het pakket ervan is AFGENOMEN (licentie, via het abonnement:
// club_organisaties.pakketten, migratie 467) EN de sportschool het zelf AAN
// heeft staan (club_organisaties.modules). Een sportschool zet nooit iets aan
// wat ze niet afnam.
//
// Hoe het overal doorwerkt: organisatieUitRij() rekent `uit` uit als de eigen
// keuze (`eigenUit`) plus alles van de pakketten die niet zijn afgenomen
// (verborgenVoor). Voor onderdelen zonder eigen schakelaar (Challenges,
// Voeding, Berichten...) staat er een marker "pakket:<sleutel>" in `uit`.
// Daardoor volgen het menu, het zoekveld, de hulpbalk, Vandaag, de ledenkaart,
// de ledenapp, het instellingencentrum en de wizard het afnemen vanzelf; pagina's
// (eisModule, eisOnderdeel) en API's (vereisClubToegang, de leden-API en de
// widget) geven een 404. Een test (pakketten-routes.test.ts) loopt alle routes
// en elk pakket alleen langs.
//
// Wat bij welk pakket hoort, staat alleen hier. Een nieuw onderdeel of een
// nieuwe API-map moet hier een plek krijgen (null = kern); de test faalt anders.

import { PAKKET_SLEUTELS, isPakketSleutel, sorteerPakketten, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import type { Module } from './organisatie'

export type { PakketSleutel }
export { PAKKET_SLEUTELS }

/** Alles afgenomen: Fit Factory, de demo, het master account en alle sportscholen van voor 29-10-2026. */
export const ALLE_PAKKETTEN: readonly PakketSleutel[] = PAKKET_SLEUTELS

export type PakketMarker = `pakket:${PakketSleutel}`
/** Wat er in `uit` kan staan: een onderdeel met een eigen schakelaar, of een pakket dat niet is afgenomen. */
export type Verborgen = Module | PakketMarker

export function pakketMarker(p: PakketSleutel): PakketMarker {
  return `pakket:${p}`
}

/** Bij welk pakket een schakelbaar onderdeel (module) hoort; null = de kern. */
export const MODULE_PAKKET: Readonly<Record<Module, PakketSleutel | null>> = {
  leden: null,
  app: null,
  checkin: 'administratie',
  cijfers: 'administratie',
  rooster: 'lessen',
  training: 'training',
  afspraken: 'afspraken',
  personeel: 'team',
  taken: 'team',
  leads: 'groei',
}

/** Bij welk pakket een onderdeel (sleutels uit ONDERDEEL_SLEUTELS en shell/onderdelen.ts) hoort; null = de kern. */
export const ONDERDEEL_PAKKET: Readonly<Record<string, PakketSleutel | null>> = {
  vandaag: null,
  notities: null,
  leden: null,
  app: null,
  agenda: null,
  start: null,
  beheer: null,
  bedrijf: null,
  sluiting: null,
  huisstijl: null,
  instellingen: null,
  hulp: null,
  checkin: 'administratie',
  cijfers: 'administratie',
  rapporten: 'administratie',
  lidmaatschappen: 'administratie',
  rooster: 'lessen',
  schemas: 'training',
  voeding: 'training',
  afspraken: 'afspraken',
  personeel: 'team',
  taken: 'team',
  leads: 'groei',
  opvolgen: 'groei',
  challenges: 'groei',
  community: 'groei',
  berichten: 'groei',
}

/**
 * De API van Club (/api/club/<map>/...): bij welk pakket hoort elke map? null =
 * kern. Een map met delen per pakket staat in API_DEEL_PAKKET.
 */
export const API_PAKKET: Readonly<Record<string, PakketSleutel | null>> = {
  agenda: null,
  app: null,
  bedrijf: null,
  beheerders: null,
  betalen: null,
  hulp: null,
  inloggen: null,
  // De tellers in het menu: kern (de route telt alleen de onderdelen van afgenomen pakketten).
  menu: null,
  instellingen: null,
  kladblok: null,
  leden: null,
  ledenapp: null,
  'medewerker-toegang': null,
  meldingen: null,
  organisatie: null,
  platform: null,
  privacy: null,
  sluiting: null,
  start: null,
  // Team en rollen (rollen v2): kern.
  team: null,
  // Profielfoto's van leden en medewerkers (migratie 473): kern.
  profielfoto: null,
  // Eerste-keer-uitleg wegklikken (migratie 476): kern.
  uitleg: null,
  uitloggen: null,
  vestigingen: null,
  abonnement: null,
  checkin: 'administratie',
  lidmaatschappen: 'administratie',
  rapporten: 'administratie',
  rooster: 'lessen',
  widget: 'lessen',
  training: 'training',
  intakevragen: 'training',
  voeding: 'training',
  voortgang: 'training',
  health: 'training',
  afspraken: 'afspraken',
  personeel: 'team',
  taken: 'team',
  leads: 'groei',
  automatisering: 'groei',
  challenges: 'groei',
  community: 'groei',
  berichten: 'groei',
  // De leden-API (ledenapp): per deel in LID_API_PAKKET.
  lid: null,
}

/** Delen van een kern-map die toch bij een pakket horen: "<map>/<deel>". */
export const API_DEEL_PAKKET: Readonly<Record<string, PakketSleutel>> = {
  'instellingen/lestypen': 'lessen',
  'instellingen/weekrooster': 'lessen',
  'betalen/plannen': 'administratie',
  'betalen/kortingen': 'administratie',
}

/** De leden-API (/api/club/lid/<deel>/...); ontbreekt een deel, dan is het kern (ik, inloggen, push...). */
export const LID_API_PAKKET: Readonly<Record<string, PakketSleutel>> = {
  reserveringen: 'lessen',
  afspraken: 'afspraken',
  training: 'training',
  coaching: 'training',
  voeding: 'training',
  health: 'training',
  challenges: 'groei',
  community: 'groei',
  'checkin-code': 'administratie',
}

/** De tabbladen van de ledenapp die bij een pakket horen (Home en Profiel zijn kern). */
export const LEDENAPP_TAB_PAKKET: Readonly<Record<string, PakketSleutel>> = {
  lessen: 'lessen',
  afspraken: 'afspraken',
  schema: 'training',
  voeding: 'training',
  voortgang: 'training',
}

/** De stappen van de startwizard die bij een pakket horen (de rest is kern). */
export const WIZARD_STAP_PAKKET: Readonly<Record<string, PakketSleutel>> = {
  lessen: 'lessen',
}

/**
 * club_organisaties.pakketten lezen, vergevingsgezind: ontbreekt de kolom of is
 * hij kapot, dan alles (zo werkt het zoals voor 29-10-2026). Een lege lijst
 * blijft leeg: dan heeft de sportschool alleen de kern.
 */
export function leesAfgenomen(ruw: unknown): PakketSleutel[] {
  if (!Array.isArray(ruw)) return [...ALLE_PAKKETTEN]
  return sorteerPakketten(ruw.filter(isPakketSleutel))
}

export function heeftPakket(afgenomen: readonly PakketSleutel[], p: PakketSleutel | null | undefined): boolean {
  return p === null || p === undefined || afgenomen.includes(p)
}

export function heeftAlles(afgenomen: readonly PakketSleutel[]): boolean {
  return ALLE_PAKKETTEN.every((p) => afgenomen.includes(p))
}

export function moduleAfgenomen(afgenomen: readonly PakketSleutel[], m: Module): boolean {
  return heeftPakket(afgenomen, MODULE_PAKKET[m])
}

/** Onbekende sleutels zijn kern (ONDERDEEL_PAKKET is compleet; de test bewaakt dat). */
export function onderdeelPakket(sleutel: string): PakketSleutel | null {
  return ONDERDEEL_PAKKET[sleutel] ?? null
}

export function onderdeelAfgenomen(afgenomen: readonly PakketSleutel[], sleutel: string): boolean {
  return heeftPakket(afgenomen, onderdeelPakket(sleutel))
}

/**
 * Wat er voor deze sportschool niet te zien is: de eigen keuze plus de
 * onderdelen en markers van de pakketten die niet zijn afgenomen.
 */
export function verborgenVoor(eigenUit: readonly Module[], afgenomen: readonly PakketSleutel[]): Verborgen[] {
  const niet = ALLE_PAKKETTEN.filter((p) => !afgenomen.includes(p))
  const modules = (Object.keys(MODULE_PAKKET) as Module[]).filter((m) => eigenUit.includes(m) || niet.includes(MODULE_PAKKET[m] as PakketSleutel))
  return [...modules, ...niet.map(pakketMarker)]
}

/**
 * De centrale vraag: is dit onderdeel er voor deze sportschool? Niet als zijn
 * module uit staat of niet is afgenomen, en niet als zijn pakket niet is
 * afgenomen. Rechten per rol komen daar nog bij (magOnderdeel).
 */
export function zichtbaar(uit: readonly Verborgen[], o: { sleutel?: string; module?: Module | null }): boolean {
  if (o.module && uit.includes(o.module)) return false
  const p = o.sleutel ? onderdeelPakket(o.sleutel) : null
  return !p || !uit.includes(pakketMarker(p))
}

/** Is dit pakket afgenomen, gelezen uit `uit` (voor wie alleen `uit` heeft)? */
export function pakketZichtbaar(uit: readonly Verborgen[], p: PakketSleutel): boolean {
  return !uit.includes(pakketMarker(p))
}

/** Uit `uit` weer de afgenomen pakketten. */
export function afgenomenUit(uit: readonly Verborgen[]): PakketSleutel[] {
  return ALLE_PAKKETTEN.filter((p) => pakketZichtbaar(uit, p))
}

/** Het pakket achter een API-pad van Club, of null (kern of geen Club-API). */
export function apiPakket(pad: string): PakketSleutel | null {
  const delen = pad.split('?')[0].split('/').filter(Boolean)
  if (delen[0] !== 'api' || delen[1] !== 'club') return null
  const map = delen[2] ?? ''
  if (map === 'lid') return LID_API_PAKKET[delen[3] ?? ''] ?? null
  return API_DEEL_PAKKET[`${map}/${delen[3] ?? ''}`] ?? API_PAKKET[map] ?? null
}

export function apiAfgenomen(afgenomen: readonly PakketSleutel[], pad: string): boolean {
  return heeftPakket(afgenomen, apiPakket(pad))
}

/** Een tabblad van de ledenapp: is zijn pakket afgenomen? */
export function ledenappTabAfgenomen(afgenomen: readonly PakketSleutel[], tab: string): boolean {
  return heeftPakket(afgenomen, LEDENAPP_TAB_PAKKET[tab])
}

/** Hoort deze stap van de wizard bij een afgenomen pakket (of bij de kern)? */
export function wizardStapNodig(afgenomen: readonly PakketSleutel[], stap: string): boolean {
  return heeftPakket(afgenomen, WIZARD_STAP_PAKKET[stap])
}

/** Uit een invoer voor de database: minstens een bekend pakket, geen dubbelen. */
export function leesAfgenomenInvoer(ruw: unknown): PakketSleutel[] | null {
  if (!Array.isArray(ruw) || ruw.length === 0 || !ruw.every(isPakketSleutel)) return null
  return sorteerPakketten(ruw)
}
