// ─── Club, meldingen: soorten en instellingen per sportschool (PUUR) ────────
// Welke meldingen een lid kan krijgen, hoe ze heten in het instellingencentrum
// en de herinnertijden. Lezen is vergevingsgezind (kapot = standaard), opslaan
// is streng (leesInstellingenInvoer).

export const SOORTEN = [
  'les_geboekt',
  'les_wachtlijst',
  'les_afgemeld',
  'les_doorgeschoven',
  'les_herinnering',
  'les_geannuleerd',
  'afspraak_geboekt',
  'afspraak_verplaatst',
  'afspraak_herinnering',
  'afspraak_afgemeld',
  'afspraak_geannuleerd',
] as const
/** Mails rond de ledenapp (migratie 435): geen gebeurtenis, alleen per mail. */
export const APP_SOORTEN = ['app_uitnodiging', 'app_link'] as const
export type GebeurtenisSoort = (typeof SOORTEN)[number]
export type AppSoort = (typeof APP_SOORTEN)[number]
export type Soort = GebeurtenisSoort | AppSoort
export type LesSoort = Extract<Soort, `les_${string}`>
export type AfspraakSoort = Extract<Soort, `afspraak_${string}`>

/** 'push' (migratie 438): web push naar de toestellen van het lid. */
export const KANALEN = ['email', 'app', 'push'] as const
export type Kanaal = (typeof KANALEN)[number]

export const STATUSSEN = ['gepland', 'bezig', 'verstuurd', 'mislukt', 'overgeslagen'] as const
export type MeldingStatus = (typeof STATUSSEN)[number]

export const SOORT_LABEL: Record<Soort, { label: string; uitleg: string }> = {
  les_geboekt: { label: 'Reservering bevestigd', uitleg: 'Na het boeken van een groepsles.' },
  les_wachtlijst: { label: 'Op de wachtlijst', uitleg: 'Als de les vol is en het lid op de wachtlijst staat.' },
  les_afgemeld: { label: 'Afmelding bevestigd', uitleg: 'Als het lid zich afmeldt voor een les.' },
  les_doorgeschoven: { label: 'Doorgeschoven van de wachtlijst', uitleg: 'Als er een plek vrijkomt en het lid alsnog meedoet.' },
  les_herinnering: { label: 'Herinnering voor de les', uitleg: 'Een tijd voor de les begint.' },
  les_geannuleerd: { label: 'Les gaat niet door', uitleg: 'Als de club een les annuleert.' },
  afspraak_geboekt: { label: 'Afspraak bevestigd', uitleg: 'Na het boeken van een afspraak met een trainer.' },
  afspraak_verplaatst: { label: 'Afspraak verplaatst', uitleg: 'Als de club de afspraak naar een andere tijd zet.' },
  afspraak_herinnering: { label: 'Herinnering voor de afspraak', uitleg: 'Een tijd voor de afspraak begint.' },
  afspraak_afgemeld: { label: 'Annulering door het lid bevestigd', uitleg: 'Als het lid de afspraak zelf annuleert in de app.' },
  afspraak_geannuleerd: { label: 'Afspraak gaat niet door', uitleg: 'Als de club de afspraak annuleert.' },
  app_uitnodiging: { label: 'Uitnodiging voor de app', uitleg: 'Als de club leden uitnodigt voor de ledenapp.' },
  app_link: { label: 'Inloglink aangevraagd', uitleg: 'Als een lid zelf een inloglink aanvraagt.' },
}

export const SOORTEN_LES: readonly Soort[] = SOORTEN.filter((s) => s.startsWith('les_'))
export const SOORTEN_AFSPRAAK: readonly Soort[] = SOORTEN.filter((s) => s.startsWith('afspraak_'))

export function isSoort(v: unknown): v is Soort {
  return isGebeurtenisSoort(v) || isAppSoort(v)
}

export function isGebeurtenisSoort(v: unknown): v is GebeurtenisSoort {
  return typeof v === 'string' && (SOORTEN as readonly string[]).includes(v)
}

export function isAppSoort(v: unknown): v is AppSoort {
  return typeof v === 'string' && (APP_SOORTEN as readonly string[]).includes(v)
}

export function isHerinnering(soort: Soort): boolean {
  return soort === 'les_herinnering' || soort === 'afspraak_herinnering'
}

/** De keuzes voor de herinnertijd, in minuten voor de start. */
export const LES_HERINNER_KEUZES = [30, 60, 120, 180, 240, 720, 1440] as const
export const AFSPRAAK_HERINNER_KEUZES = [60, 120, 240, 720, 1440, 2880] as const

export const STANDAARD_LES_MIN = 120
export const STANDAARD_AFSPRAAK_MIN = 1440

export interface MeldingInstellingen {
  /** Soorten die uit staan; ontbreekt een soort, dan staat hij aan. */
  uit: Soort[]
  lesHerinneringMin: number
  afspraakHerinneringMin: number
}

export const STANDAARD_INSTELLINGEN: MeldingInstellingen = {
  uit: [],
  lesHerinneringMin: STANDAARD_LES_MIN,
  afspraakHerinneringMin: STANDAARD_AFSPRAAK_MIN,
}

export function soortAan(i: MeldingInstellingen, soort: Soort): boolean {
  return !i.uit.includes(soort)
}

function binnen(v: unknown, keuzes: readonly number[]): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isInteger(n) && keuzes.includes(n) ? n : null
}

/** Systeemgrens: een databaserij naar instellingen; geen of kapotte rij = standaard. */
export function instellingenUitRij(rij: unknown): MeldingInstellingen {
  if (typeof rij !== 'object' || rij === null) return STANDAARD_INSTELLINGEN
  const r = rij as Record<string, unknown>
  const uit = Array.isArray(r.uit) ? [...new Set(r.uit.filter(isGebeurtenisSoort))] : []
  const lesMin = typeof r.les_herinnering_min === 'number' && r.les_herinnering_min >= 15 ? r.les_herinnering_min : STANDAARD_LES_MIN
  const afsMin = typeof r.afspraak_herinnering_min === 'number' && r.afspraak_herinnering_min >= 15 ? r.afspraak_herinnering_min : STANDAARD_AFSPRAAK_MIN
  return { uit, lesHerinneringMin: lesMin, afspraakHerinneringMin: afsMin }
}

export function instellingenNaarRij(i: MeldingInstellingen): Record<string, unknown> {
  return { uit: i.uit, les_herinnering_min: i.lesHerinneringMin, afspraak_herinnering_min: i.afspraakHerinneringMin }
}

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/** Wat het formulier stuurt, streng gecontroleerd. */
export function leesInstellingenInvoer(body: unknown): Invoer<MeldingInstellingen> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Onleesbare invoer.' }
  const b = body as Record<string, unknown>
  if (!Array.isArray(b.uit) || b.uit.length > SOORTEN.length || !b.uit.every(isGebeurtenisSoort)) return { ok: false, fout: 'Kies geldige meldingen.' }
  const les = binnen(b.lesHerinneringMin, LES_HERINNER_KEUZES)
  if (les === null) return { ok: false, fout: 'Kies een geldige herinnertijd voor lessen.' }
  const afspraak = binnen(b.afspraakHerinneringMin, AFSPRAAK_HERINNER_KEUZES)
  if (afspraak === null) return { ok: false, fout: 'Kies een geldige herinnertijd voor afspraken.' }
  return { ok: true, waarde: { uit: [...new Set(b.uit)], lesHerinneringMin: les, afspraakHerinneringMin: afspraak } }
}

/** "2 uur", "30 minuten", "1 dag", "2 dagen". */
export function duurLabel(minuten: number): string {
  if (minuten % 1440 === 0) return minuten === 1440 ? '1 dag' : `${minuten / 1440} dagen`
  if (minuten % 60 === 0) return `${minuten / 60} uur`
  return `${minuten} minuten`
}
