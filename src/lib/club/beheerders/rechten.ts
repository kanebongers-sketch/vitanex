// ─── Club: wat een eigenaar of clubmanager mag (PUUR) ───────────────────────
// Besluit Kane (17-10-2026): de eigenaar (wie het abonnement afsluit) stelt
// alles van de eigen sportschool zelf in. De clubmanager is beperkter: hij
// ziet de onderdelen die de eigenaar bij de rol Clubmanager aanvinkt (rechten
// per rol in het instellingencentrum) en beheert nooit beheerders of het adres.
// Kane mag overal alles. Alles hier is ook de basis voor de 404's op pagina's
// en API's: wat niet mag, bestaat niet.

import type { Rechten } from '@/lib/club/kern/org-instellingen'
import type { BeheerderRol } from './beheerder'

/** Onderdelen die alleen Kane en de eigenaar hebben, wat de rechten ook zeggen. */
export const NOOIT_VOOR_CLUBMANAGER: ReadonlySet<string> = new Set(['beheer', 'huisstijl', 'bedrijf', 'sluiting', 'lidmaatschappen', 'start'])

export interface WieMag {
  isKane: boolean
  rol: 'beheerder' | BeheerderRol | 'medewerker'
}

/** Beheerders (eigenaren en clubmanagers) en het adres van de sportschool: Kane en de eigenaar. */
export function magBeheerdersBeheren(t: WieMag): boolean {
  return t.isKane || t.rol === 'eigenaar'
}

/** De onderdelen die deze persoon ziet; null = alles. */
export function toegestaneOnderdelen(t: WieMag, rechten: Rechten): readonly string[] | null {
  if (t.isKane || t.rol === 'eigenaar') return null
  // Een medewerker heeft zijn eigen rechten (medewerker-login/rechten.ts); hier nooit iets.
  if (t.rol === 'medewerker') return ['vandaag']
  // Een clubmanager: de rechten van de rol Clubmanager, altijd met Vandaag (de startpagina).
  return [...new Set(['vandaag', ...rechten.manager])].filter((s) => !NOOIT_VOOR_CLUBMANAGER.has(s))
}

/** Onderdelen die iedereen die binnen is altijd heeft (hulp vragen kan altijd). */
const ALTIJD: ReadonlySet<string> = new Set(['hulp'])

export function magOnderdeel(toegestaan: readonly string[] | null, sleutel: string): boolean {
  return toegestaan === null || ALTIJD.has(sleutel) || toegestaan.includes(sleutel)
}

/**
 * Het onderdeel achter een API-pad (/api/club/<deel>/...), of null als het pad
 * niet bij een onderdeel hoort. Onbekend betekent voor een clubmanager: niet
 * toegestaan (liever dicht dan per ongeluk open).
 */
const API_ONDERDEEL: Record<string, string> = {
  agenda: 'agenda',
  app: 'app',
  checkin: 'checkin',
  instellingen: 'instellingen',
  vestigingen: 'instellingen',
  // Inloglinks van medewerkers: in Instellingen > Medewerkers (alleen eigenaar en clubmanager, zie medewerker-login/rechten.ts).
  'medewerker-toegang': 'instellingen',
  kladblok: 'notities',
  leads: 'leads',
  leden: 'leden',
  personeel: 'personeel',
  rooster: 'rooster',
  taken: 'taken',
  training: 'schemas',
  // Metingen en voortgang van een lid horen bij de ledenkaart.
  voortgang: 'leden',
  berichten: 'berichten',
  afspraken: 'afspraken',
  // Beheer-onderdelen: nooit voor een clubmanager (NOOIT_VOOR_CLUBMANAGER).
  bedrijf: 'bedrijf',
  sluiting: 'sluiting',
  lidmaatschappen: 'lidmaatschappen',
  intakevragen: 'beheer',
  // Regels instellen controleert de route daarnaast zelf op Beheer.
  automatisering: 'opvolgen',
  challenges: 'challenges',
  rapporten: 'rapporten',
  voeding: 'voeding',
  meldingen: 'beheer',
  hulp: 'hulp',
  start: 'beheer',
  community: 'community',
  betalen: 'beheer',
  // Boekingswidget op de eigen website (alleen Kane en de eigenaar, zie /api/club/widget).
  widget: 'beheer',
  // Bewaartermijnen (alleen Kane en de eigenaar, zie /api/club/privacy).
  privacy: 'beheer',
}

/** Onder /api/club/organisatie: wat bij welk onderdeel hoort. */
const ORGANISATIE_ONDERDEEL: Record<string, string> = {
  '': 'huisstijl',
  logo: 'huisstijl',
  instellingen: 'beheer',
}

export function apiOnderdeel(pad: string): string | null {
  const delen = pad.split('?')[0].split('/').filter(Boolean)
  if (delen[0] !== 'api' || delen[1] !== 'club') return null
  if (delen[2] === 'organisatie') return ORGANISATIE_ONDERDEEL[delen[3] ?? ''] ?? null
  return API_ONDERDEEL[delen[2] ?? ''] ?? null
}

/**
 * Mag dit API-verzoek? Het logo ophalen (GET) mag iedereen die binnen is: de
 * balk toont het op elke pagina.
 */
export function magApi(toegestaan: readonly string[] | null, pad: string, methode: string): boolean {
  if (toegestaan === null) return true
  const schoon = pad.split('?')[0]
  if (methode === 'GET' && schoon === '/api/club/organisatie/logo') return true
  const sleutel = apiOnderdeel(schoon)
  return sleutel !== null && magOnderdeel(toegestaan, sleutel)
}
