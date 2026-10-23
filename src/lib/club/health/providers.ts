// ─── Club, health: welke bronnen er zijn en of ze te koppelen zijn (PUUR) ───
// Een plek met alle bronnen en hun regels. Een bron is alleen te koppelen als
// Club een adapter voor hem heeft, de schakelaar aan staat en de sleutels van de
// leverancier in de omgeving staan. Anders staat hij als "Binnenkort" in de app,
// zonder knop: eerlijk, we beloven niets wat nog niet werkt.
// Feiten per leverancier: docs/aiyourgym/health/ONDERZOEK-KOPPELINGEN.md (23-10-2026).
//
// Nieuwe bron? Een entry hier (met `adapter: true` zodra er een bestand in
// adapters/ is) en het adapterbestand zelf. Koppelen, sync, intrekken, webhooks,
// toestemming en AVG zijn voor elke bron gelijk; de regels hieronder (wie mag
// meekijken, wanneer wissen) worden in toestemming.ts, de routes en de
// nachtelijke opruimronde (migratie 463) afgedwongen.

import type { AuthSoort, BronId, DataSoort } from './typen'
import { healthKlaar, type Omgeving } from './schakelaar'

export interface ProviderRegels {
  /**
   * Wie de gegevens mag zien naast het lid:
   *  - 'per_soort': de gewone schakelaars per soort (trainers zien wat het lid aanvinkt);
   *  - 'apart': daarbovenop een eigen schakelaar voor deze bron (Strava: data alleen aan
   *    de sporter zelf, aan anderen alleen met uitdrukkelijke toestemming).
   */
  trainer: 'per_soort' | 'apart'
  /** Bij ontkoppelen altijd alles van deze bron wissen (Strava). */
  wissenBijOntkoppelen: boolean
  /** Uiterlijk zoveel uur na een verzoek gewist (Oura: 72). Club wist direct; de nachtelijke ronde is het vangnet. */
  wissenBinnenUur: number | null
  /** Geen AI-verwerking van deze gegevens (Oura, Strava). Club doet nergens AI op health-gegevens. */
  geenAi: boolean
}

export interface Provider {
  id: BronId
  naam: string
  /** Pad naar een logo in public/ of null: dan toont de app een tegel met de beginletter. */
  logo: string | null
  /** Korte uitleg voor het lid. */
  omschrijving: string
  /** Eerlijke kanttekening op de kaart (abonnement nodig, testfase), of null. */
  kanttekening: string | null
  /** Wat deze bron in Club levert (met onze adapter, niet wat de leverancier in theorie heeft). */
  soorten: readonly DataSoort[]
  auth: AuthSoort
  /** Stuurt de leverancier een bericht bij nieuwe gegevens (webhook)? */
  webhooks: boolean
  /** Heeft Club een werkende adapter voor deze bron? */
  adapter: boolean
  /** Eerst goedkeuring van de leverancier nodig (na de KvK-inschrijving van Kane). */
  goedkeuringNodig: boolean
  /** Namen van de omgevingsvariabelen met de sleutels van de leverancier (OAuth). */
  env: { clientId: string; secret: string } | null
  regels: ProviderRegels
}

const STANDAARD: ProviderRegels = { trainer: 'per_soort', wissenBijOntkoppelen: false, wissenBinnenUur: null, geenAi: false }
const ALLES_TELEFOON: readonly DataSoort[] = ['gewicht_kg', 'vetpercentage', 'stappen', 'slaap_minuten', 'rusthartslag', 'hrv_ms', 'training', 'vo2max']

function envVan(naam: string): { clientId: string; secret: string } {
  return { clientId: `CLUB_HEALTH_${naam}_CLIENT_ID`, secret: `CLUB_HEALTH_${naam}_SECRET` }
}

function binnenkort(id: BronId, naam: string, omschrijving: string, soorten: readonly DataSoort[], auth: AuthSoort = 'oauth2'): Provider {
  return { id, naam, logo: null, omschrijving, kanttekening: null, soorten, auth, webhooks: true, adapter: false, goedkeuringNodig: true, env: null, regels: STANDAARD }
}

export const PROVIDERS: Readonly<Record<BronId, Provider>> = {
  withings: {
    id: 'withings', naam: 'Withings', logo: null,
    omschrijving: 'Weegschaal: gewicht, vetpercentage en spiermassa.',
    kanttekening: 'Heb je na 12 oktober 2026 een nieuw Withings-account gemaakt? Dan vraagt Withings een Withings+-abonnement om gegevens te delen.',
    soorten: ['gewicht_kg', 'vetpercentage', 'spiermassa_kg'], auth: 'oauth2', webhooks: true, adapter: true, goedkeuringNodig: false,
    env: envVan('WITHINGS'), regels: STANDAARD,
  },
  strava: {
    id: 'strava', naam: 'Strava', logo: null,
    omschrijving: 'Je trainingen: soort, duur en hartslag. Strava levert alleen trainingen.',
    kanttekening: 'Je Strava-trainingen zie alleen jij, tenzij je apart aanzet dat je trainers ze mogen zien. Ontkoppel je, dan wissen we ze.',
    soorten: ['training'], auth: 'oauth2', webhooks: true, adapter: true, goedkeuringNodig: false,
    env: envVan('STRAVA'), regels: { trainer: 'apart', wissenBijOntkoppelen: true, wissenBinnenUur: null, geenAi: true },
  },
  polar: {
    id: 'polar', naam: 'Polar', logo: null,
    omschrijving: 'Trainingen met hartslag en kcal van je Polar-horloge.',
    kanttekening: null,
    soorten: ['training'], auth: 'oauth2', webhooks: true, adapter: true, goedkeuringNodig: false,
    env: envVan('POLAR'), regels: STANDAARD,
  },
  oura: {
    id: 'oura', naam: 'Oura', logo: null,
    omschrijving: 'Slaap, HRV, rusthartslag, stappen, trainingen en VO2max van je Oura-ring.',
    kanttekening: 'Voor een Oura-ring vanaf Gen3 heb je een actief Oura-lidmaatschap nodig om gegevens te delen.',
    soorten: ['slaap_minuten', 'hrv_ms', 'rusthartslag', 'stappen', 'training', 'vo2max'], auth: 'oauth2', webhooks: true, adapter: true, goedkeuringNodig: false,
    env: envVan('OURA'), regels: { trainer: 'per_soort', wissenBijOntkoppelen: false, wissenBinnenUur: 72, geenAi: true },
  },
  whoop: {
    id: 'whoop', naam: 'WHOOP', logo: null,
    omschrijving: 'Herstel (HRV en rusthartslag), slaap, trainingen en gewicht.',
    kanttekening: null,
    soorten: ['hrv_ms', 'rusthartslag', 'slaap_minuten', 'training', 'gewicht_kg'], auth: 'oauth2', webhooks: true, adapter: true, goedkeuringNodig: false,
    env: envVan('WHOOP'), regels: STANDAARD,
  },
  apple_health: {
    id: 'apple_health', naam: 'Apple Gezondheid', logo: null,
    omschrijving: 'Alles van je iPhone en Apple Watch, en van apps en weegschalen die naar Apple Gezondheid schrijven.',
    kanttekening: null,
    soorten: ALLES_TELEFOON, auth: 'native_healthkit', webhooks: false, adapter: true, goedkeuringNodig: false, env: null, regels: STANDAARD,
  },
  health_connect: {
    id: 'health_connect', naam: 'Health Connect', logo: null,
    omschrijving: 'Alles van je Android-telefoon, horloge en apps die naar Health Connect schrijven (ook Samsung Health en de Fitbit-app).',
    kanttekening: null,
    soorten: ALLES_TELEFOON, auth: 'native_health_connect', webhooks: false, adapter: true, goedkeuringNodig: false, env: null, regels: STANDAARD,
  },
  garmin: binnenkort('garmin', 'Garmin', 'Horloges en weegschalen van Garmin.', ['stappen', 'slaap_minuten', 'rusthartslag', 'hrv_ms', 'training', 'gewicht_kg', 'vetpercentage', 'vo2max'], 'oauth2_pkce'),
  google_health: binnenkort('google_health', 'Fitbit (Google)', 'Fitbit via de nieuwe Google Health API.', ['gewicht_kg', 'vetpercentage', 'stappen', 'slaap_minuten', 'rusthartslag', 'hrv_ms', 'training', 'vo2max']),
  suunto: binnenkort('suunto', 'Suunto', 'Trainingen en stappen van je Suunto-horloge.', ['training', 'stappen']),
  wahoo: binnenkort('wahoo', 'Wahoo', 'Trainingen van Wahoo.', ['training']),
  samsung: binnenkort('samsung', 'Samsung Health', 'Rechtstreeks met Samsung Health. Nu al mogelijk via Health Connect.', ['stappen', 'slaap_minuten', 'training'], 'native_health_connect'),
  huawei: binnenkort('huawei', 'Huawei Health', 'Activiteit, hartslag, slaap en gewicht van Huawei.', ['stappen', 'slaap_minuten', 'rusthartslag', 'gewicht_kg']),
}

/** Volgorde in de app: eerst de telefoon en wat werkt, dan de rest. */
export const PROVIDER_VOLGORDE: readonly BronId[] = ['apple_health', 'health_connect', 'withings', 'polar', 'oura', 'whoop', 'strava', 'garmin', 'google_health', 'suunto', 'wahoo', 'samsung', 'huawei']

/** Weegschalen en apps zonder eigen koppeling: die komen via de gezondheidsapp van de telefoon binnen. */
export const VIA_TELEFOON: readonly string[] = ['Eufy', 'Renpho', 'Tanita', 'Xiaomi', 'Zepp en Amazfit', 'MyFitnessPal', 'Cronometer']

/**
 * - beschikbaar: nu te koppelen via de website.
 * - alleen_app: werkt alleen in de app op de telefoon (HealthKit, Health Connect).
 * - binnenkort: nog niet te koppelen (geen adapter, goedkeuring nodig, geen sleutels of de schakelaar staat uit).
 */
export type ProviderStatus = 'beschikbaar' | 'alleen_app' | 'binnenkort'

export function isNative(p: Provider): boolean {
  return p.auth === 'native_healthkit' || p.auth === 'native_health_connect'
}

/** De sleutels van de leverancier, of null als ze niet (volledig) in de omgeving staan. */
export function providerSleutels(p: Provider, omgeving: Omgeving = process.env): { clientId: string; secret: string } | null {
  if (!p.env) return null
  const clientId = omgeving[p.env.clientId]?.trim()
  const secret = omgeving[p.env.secret]?.trim()
  return clientId && secret ? { clientId, secret } : null
}

export function providerStatus(p: Provider, omgeving: Omgeving = process.env): ProviderStatus {
  if (!p.adapter || p.goedkeuringNodig || !healthKlaar(omgeving)) return 'binnenkort'
  if (isNative(p)) return 'alleen_app'
  return providerSleutels(p, omgeving) ? 'beschikbaar' : 'binnenkort'
}

export const STATUS_LABEL: Readonly<Record<ProviderStatus, string>> = {
  beschikbaar: 'Te koppelen',
  alleen_app: 'Via de app',
  binnenkort: 'Binnenkort',
}

/** Wat de app per bron laat zien (zonder namen van omgevingsvariabelen). */
export interface ProviderKaart {
  id: BronId
  naam: string
  logo: string | null
  omschrijving: string
  kanttekening: string | null
  soorten: readonly DataSoort[]
  status: ProviderStatus
  native: boolean
  trainerApart: boolean
}

export function providerKaarten(omgeving: Omgeving = process.env): ProviderKaart[] {
  return PROVIDER_VOLGORDE.map((id) => {
    const p = PROVIDERS[id]
    return {
      id, naam: p.naam, logo: p.logo, omschrijving: p.omschrijving, kanttekening: p.kanttekening, soorten: p.soorten,
      status: providerStatus(p, omgeving), native: isNative(p), trainerApart: p.regels.trainer === 'apart',
    }
  })
}

/** Bronnen waarvan alles weg moet als de koppeling weg is (in de nachtelijke ronde van migratie 463). */
export function bronnenWissenBijOntkoppelen(): BronId[] {
  return PROVIDER_VOLGORDE.filter((id) => PROVIDERS[id].regels.wissenBijOntkoppelen)
}
