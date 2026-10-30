// ─── Club, AVG voor medewerkers: inzage en wissen (PUUR) ────────────────────
// Inzage (art. 15 AVG): alles wat Club over een (oud-)medewerker bewaart, als
// JSON-bestand met Nederlandse sleutels. Bewust een vaste lijst velden: nooit
// de inlogcode, pin_hash, token_hash, user_id of interne ids.
//
// Wissen (art. 17 AVG): de database-functie club_medewerker_anonimiseren
// (migratie 449). Naam wordt "Oud-medewerker XXXX", e-mail, inlog,
// beschikbaarheid en vrije notities gaan weg. Diensten en uren blijven
// (fiscale bewaarplicht loonadministratie, 7 jaar). Alleen voor wie uit dienst
// is: eerst op inactief zetten. Wie mag wissen: Kane en de eigenaar (de
// werkgever); een clubmanager of medewerker niet.

import type { WieMag } from '@/lib/club/beheerders/rechten'
import { naamKlopt } from '@/lib/club/leden/avg/verwijderen'
import { ROL_LABEL } from '@/lib/club/kern/medewerker'
import { avgBestandsnaam, namenUit, naamOfZelf, vertaalRij, type Omzettingen, type Rij, type Velden } from '@/lib/club/kern/avg-velden'
import { isEigenaar } from '@/lib/club/rollen/wie'

/** De ruwe rijen zoals avg-opslag.ts ze leest. */
export interface MedewerkerExportRuw {
  medewerker: Rij
  diensten: Rij[]
  beschikbaarheid: Rij[]
  roosterNotities: Rij[]
  afgevinkt: Rij[]
  taakNotities: Rij[]
  afsluitrondes: Rij[]
  inloggen: Rij[]
  sessies: Rij[]
  /** Rollen v2 (club_profiel_rollen, migratie 469). */
  profielRollen: Rij[]
  /** Profielfoto (club_profielfotos, migratie 473): alleen wanneer gezet, nooit het pad. */
  profielfoto: Rij[]
  logboek: Rij[]
  hulpvragen: Rij[]
}

export type MedewerkerSectieSleutel = Exclude<keyof MedewerkerExportRuw, 'medewerker'>

export interface MedewerkerExportMeta {
  sportschool: string
  gemaaktOp: Date
  /** Vestiging-slug naar naam. */
  vestigingen: ReadonlyMap<string, string>
}

export const MEDEWERKER_VELDEN = {
  naam: 'Naam',
  email: 'E-mail',
  rollen: 'Rollen',
  vestigingen: 'Vestigingen',
  actief: 'In dienst',
  contracturen_per_week: 'Contracturen per week',
  aangemaakt_op: 'In Club gezet op',
  geanonimiseerd_op: 'Gewist op',
} as const

interface Sectie {
  sleutel: MedewerkerSectieSleutel
  titel: string
  velden: Velden
}

export const MEDEWERKER_SECTIES: readonly Sectie[] = [
  {
    sleutel: 'diensten',
    titel: 'Diensten en uren',
    velden: {
      datum: 'Datum',
      begin: 'Begin',
      eind: 'Eind',
      vestiging: 'Vestiging',
      'club_dienst_soorten.naam': 'Soort dienst',
      status: 'Status',
      uursoort: 'Soort uren',
      uur_status: 'Status uren',
      gewerkt_begin: 'Gewerkt vanaf',
      gewerkt_eind: 'Gewerkt tot',
      pauze_min: 'Pauze (minuten)',
      uren_opmerking: 'Opmerking bij de uren',
      notitie: 'Notitie',
      bevestigd_door: 'Bevestigd door',
      bevestigd_op: 'Bevestigd op',
      goedgekeurd_door: 'Goedgekeurd door',
      goedgekeurd_op: 'Goedgekeurd op',
      verwerkt_op: 'Verwerkt op',
    },
  },
  {
    sleutel: 'beschikbaarheid',
    titel: 'Beschikbaarheid',
    velden: { weekdag: 'Weekdag (1 is maandag)', datum: 'Datum', datum_tot: 'Tot en met', beschikbaar: 'Beschikbaar', van: 'Van', tot: 'Tot', reden: 'Reden', notitie: 'Notitie', aangemaakt_op: 'Vastgelegd op' },
  },
  { sleutel: 'roosterNotities', titel: 'Notities in het rooster', velden: { datum: 'Datum', van: 'Van', tot: 'Tot', vestiging: 'Vestiging', soort: 'Soort', tekst: 'Tekst', aangemaakt_op: 'Geschreven op' } },
  { sleutel: 'afgevinkt', titel: 'Afgevinkte taken', velden: { datum: 'Datum', vestiging: 'Vestiging', 'club_taken.naam': 'Taak', afgevinkt_op: 'Afgevinkt op', wie: 'Afgevinkt als', notitie: 'Notitie' } },
  { sleutel: 'taakNotities', titel: 'Notities bij taken', velden: { datum: 'Datum', vestiging: 'Vestiging', tekst: 'Tekst', wie: 'Geschreven als', aangemaakt_op: 'Geschreven op' } },
  { sleutel: 'afsluitrondes', titel: 'Afsluitrondes', velden: { datum: 'Datum', vestiging: 'Vestiging', wie: 'Gedaan als', open_taken: 'Open taken', op: 'Moment' } },
  { sleutel: 'inloggen', titel: 'Eigen login', velden: { actief: 'Login actief', email: 'Inlogadres', pin_status: 'Status oude pincode', laatst_ingelogd_op: 'Laatst ingelogd op', aangemaakt_op: 'Login gemaakt op' } },
  { sleutel: 'sessies', titel: 'Ingelogde toestellen', velden: { aangemaakt_op: 'Ingelogd op', laatst_gebruikt_op: 'Laatst gebruikt op', verloopt_op: 'Verloopt op' } },
  { sleutel: 'profielRollen', titel: 'Rollen', velden: { rol: 'Rol', toegekend_door: 'Gegeven door', toegekend_op: 'Gegeven op' } },
  { sleutel: 'profielfoto', titel: 'Profielfoto', velden: { bron: 'Gezet door', aangemaakt_op: 'Gezet op' } },
  { sleutel: 'logboek', titel: 'Logboek (acties van deze medewerker)', velden: { op: 'Moment', actie: 'Actie', onderwerp: 'Onderwerp', vestiging: 'Vestiging' } },
  { sleutel: 'hulpvragen', titel: 'Hulpvragen aan de leverancier', velden: { onderwerp: 'Onderwerp', status: 'Status', aangemaakt_op: 'Gesteld op' } },
]

export const MEDEWERKER_EXPORT_UITLEG =
  'Dit bestand bevat alle gegevens die de sportschool in Club over deze medewerker bewaart, op het moment van downloaden. ' +
  'Salaris en contracten staan niet in Club. Inlogcodes en pincodes zijn om veiligheidsredenen niet opgenomen.'

const ROLLEN: ReadonlyMap<string, string> = new Map(Object.entries(ROL_LABEL))

/** Het volledige bestand: per onderdeel een lijst rijen met Nederlandse sleutels. */
export function bouwMedewerkerExport(ruw: MedewerkerExportRuw, meta: MedewerkerExportMeta): Rij {
  const vestiging = naamOfZelf(meta.vestigingen)
  const omzetten: Omzettingen = { vestiging }
  const bestand: Rij = {
    'Over dit bestand': { Sportschool: meta.sportschool, 'Gemaakt op': meta.gemaaktOp.toISOString(), Uitleg: MEDEWERKER_EXPORT_UITLEG },
    Medewerker: vertaalRij(ruw.medewerker, MEDEWERKER_VELDEN, { rollen: namenUit(ROLLEN), vestigingen: namenUit(meta.vestigingen) }),
  }
  for (const sectie of MEDEWERKER_SECTIES) bestand[sectie.titel] = ruw[sectie.sleutel].map((r) => vertaalRij(r, sectie.velden, omzetten))
  return bestand
}

/** gegevens-medewerker-<naam>-<datum>.json */
export function medewerkerExportBestandsnaam(naam: string, op: Date): string {
  return avgBestandsnaam('gegevens-medewerker', naam, op, 'medewerker')
}

/** Kane en de eigenaar (de werkgever); een clubmanager of medewerker nooit. */
export function magMedewerkerWissen(t: WieMag): boolean {
  return isEigenaar(t)
}

/** Dezelfde naamcontrole als bij leden: hoofdletters, accenten en dubbele spaties tellen niet. */
export function medewerkerNaamKlopt(invoer: unknown, naam: string): boolean {
  return naamKlopt(invoer, { voornaam: naam, achternaam: '' })
}

export const MEDEWERKER_NOG_ACTIEF = 'Deze medewerker is nog in dienst. Zet de medewerker eerst op "Uit dienst" en wis daarna de gegevens.'
export const MEDEWERKER_AL_GEWIST = 'De gegevens van deze medewerker zijn al gewist.'

/** Mag deze medewerker gewist worden? null = ja, anders de melding. */
export function medewerkerWisBlokkade(m: { actief: boolean; gewist: boolean }): string | null {
  if (m.gewist) return MEDEWERKER_AL_GEWIST
  if (m.actief) return MEDEWERKER_NOG_ACTIEF
  return null
}

/** Een naam als ilike-patroon zonder jokers: % en _ en \ letterlijk. */
export function letterlijkPatroon(tekst: string): string {
  return tekst.trim().replace(/[\\%_]/g, (t) => `\\${t}`)
}
