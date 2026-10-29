// ─── Club: bewaartermijnen van een sportschool (PUUR) ───────────────────────
// De sportschool is verwerkingsverantwoordelijke en bepaalt hoe lang Club
// gegevens bewaart; de nachtelijke functie club_privacy_opruimen() (migratie
// 449, laatste versie 466) past ze toe. Geen rij in club_privacy_instellingen = de standaard.
// De grenzen hier MOETEN gelijk zijn aan de checks in de migratie; een test
// bewaakt dat.

export const TERMIJN_VELDEN = ['leadsMaanden', 'oudLedenMaanden', 'bezoekenMaanden', 'logboekMaanden', 'voedingMaanden'] as const

export type TermijnVeld = (typeof TERMIJN_VELDEN)[number]

export type Termijnen = Readonly<Record<TermijnVeld, number>>

export const STANDAARD_TERMIJNEN: Termijnen = {
  leadsMaanden: 12,
  oudLedenMaanden: 24,
  bezoekenMaanden: 24,
  logboekMaanden: 24,
  voedingMaanden: 12,
}

export interface Grens {
  min: number
  max: number
}

/** Toegestane maanden per veld, gelijk aan de checks in de database. */
export const TERMIJN_GRENZEN: Readonly<Record<TermijnVeld, Grens>> = {
  leadsMaanden: { min: 3, max: 36 },
  oudLedenMaanden: { min: 6, max: 84 },
  bezoekenMaanden: { min: 3, max: 84 },
  logboekMaanden: { min: 6, max: 84 },
  voedingMaanden: { min: 3, max: 36 },
}

/** De kolom in club_privacy_instellingen per veld. */
export const TERMIJN_KOLOM: Readonly<Record<TermijnVeld, string>> = {
  leadsMaanden: 'leads_maanden',
  oudLedenMaanden: 'oud_leden_maanden',
  bezoekenMaanden: 'bezoeken_maanden',
  logboekMaanden: 'logboek_maanden',
  voedingMaanden: 'voeding_dagboek_maanden',
}

export const TERMIJN_KOLOMMEN = TERMIJN_VELDEN.map((v) => TERMIJN_KOLOM[v]).join(', ')

/** Een vaste termijn die de sportschool niet zelf instelt (alleen tonen). */
export interface VasteTermijn {
  onderwerp: string
  termijn: string
  uitleg: string
}

export const VASTE_TERMIJNEN: readonly VasteTermijn[] = [
  { onderwerp: 'Berichten en mails aan leden', termijn: '12 maanden', uitleg: 'Daarna verwijderd.' },
  { onderwerp: 'Verlopen inlogsessies', termijn: 'Dagelijks', uitleg: 'Elke nacht opgeruimd.' },
  { onderwerp: 'Toestellen voor pushmeldingen', termijn: '6 maanden', uitleg: 'Verwijderd als een toestel zo lang geen melding kreeg.' },
  { onderwerp: 'Remmen tegen misbruik', termijn: '7 dagen', uitleg: 'Alleen versleutelde kenmerken (hashes), geen namen of adressen.' },
  { onderwerp: 'Foutregistratie', termijn: '90 dagen', uitleg: 'Zonder persoonsgegevens.' },
  { onderwerp: 'Beschikbaarheid, roosternotities, taken en afsluitrondes van personeel', termijn: '24 maanden', uitleg: 'Daarna verwijderd.' },
  { onderwerp: 'Diensten en uren van personeel', termijn: '7 jaar', uitleg: 'Fiscale bewaarplicht.' },
  { onderwerp: 'Verkopen in de ledenapp', termijn: 'Blijven bewaard', uitleg: 'Fiscale bewaarplicht. Na verwijderen van een lid blijven ze zonder naam.' },
  { onderwerp: 'Hulpvragen aan AI Your Gym', termijn: '24 maanden', uitleg: 'Na de laatste wijziging verwijderd.' },
  { onderwerp: 'Trainingsschema\'s, gelogde trainingen, sets, metingen, intakes en voedingsplannen', termijn: 'Zolang iemand lid is', uitleg: 'Weg zodra het lid wordt verwijderd.' },
]

export type Gelezen = { ok: true; waarde: Termijnen } | { ok: false; fout: string }

const LABEL: Readonly<Record<TermijnVeld, string>> = {
  leadsMaanden: 'Leads',
  oudLedenMaanden: 'Oud-leden',
  bezoekenMaanden: 'Bezoeken en boekingen',
  logboekMaanden: 'Logboek',
  voedingMaanden: 'Voedingsdagboek',
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/** Invoer van het formulier controleren. Alle vier de velden zijn verplicht, hele maanden binnen de grenzen. */
export function leesTermijnen(body: unknown): Gelezen {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }
  const uit: Record<string, number> = {}
  for (const veld of TERMIJN_VELDEN) {
    const waarde = body[veld]
    const { min, max } = TERMIJN_GRENZEN[veld]
    if (typeof waarde !== 'number' || !Number.isInteger(waarde) || waarde < min || waarde > max) {
      return { ok: false, fout: `${LABEL[veld]}: kies een termijn van ${min} tot ${max} maanden.` }
    }
    uit[veld] = waarde
  }
  return { ok: true, waarde: uit as Termijnen }
}

/** Een rij uit de database naar termijnen; geen rij of een vreemde waarde = de standaard. */
export function uitRij(rij: unknown): Termijnen {
  if (!isObject(rij)) return STANDAARD_TERMIJNEN
  const uit: Record<string, number> = {}
  for (const veld of TERMIJN_VELDEN) {
    const waarde = rij[TERMIJN_KOLOM[veld]]
    const { min, max } = TERMIJN_GRENZEN[veld]
    uit[veld] = typeof waarde === 'number' && Number.isInteger(waarde) && waarde >= min && waarde <= max ? waarde : STANDAARD_TERMIJNEN[veld]
  }
  return uit as Termijnen
}

/** Termijnen naar een rij voor de database (zonder user_id). */
export function naarRij(t: Termijnen): Record<string, number> {
  return Object.fromEntries(TERMIJN_VELDEN.map((v) => [TERMIJN_KOLOM[v], t[v]]))
}

const KEUZES = [3, 6, 9, 12, 18, 24, 36, 48, 60, 72, 84]

/** De maanden om uit te kiezen voor een veld, binnen de grenzen en altijd met de huidige waarde. */
export function keuzesVoor(veld: TermijnVeld, huidig: number): number[] {
  const { min, max } = TERMIJN_GRENZEN[veld]
  const lijst = KEUZES.filter((m) => m >= min && m <= max)
  return lijst.includes(huidig) ? lijst : [...lijst, huidig].sort((a, b) => a - b)
}

/** "12 maanden" of "2 jaar" als het precies uitkomt. */
export function maandenTekst(m: number, taal: 'nl' | 'en' = 'nl'): string {
  if (taal === 'en') {
    if (m >= 24 && m % 12 === 0) return `${m / 12} years`
    return m === 1 ? '1 month' : `${m} months`
  }
  if (m >= 24 && m % 12 === 0) return `${m / 12} jaar`
  return m === 1 ? '1 maand' : `${m} maanden`
}
