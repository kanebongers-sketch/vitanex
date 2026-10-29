// ─── Club, AVG voor leads: inzage en wissen (PUUR) ──────────────────────────
// Inzage (art. 15 AVG): alles wat Club over een belangstellende bewaart als
// JSON-bestand met Nederlandse sleutels. Bewust een vaste lijst velden: nooit
// user_id, het lead-id of andere interne ids; een medewerker staat er met naam in.
//
// Wissen (art. 17 AVG): de database-functie club_lead_anonimiseren (migratie
// 449) haalt naam, contact en vrije tekst weg; status, bron en datums blijven
// voor de cijfers. Een lead die lid werd hoort bij het lid: die wis je via de
// ledenkaart. Wie mag wissen: Kane, de eigenaar en de clubmanager (leads zijn
// dagelijks werk van de clubmanager); een medewerker niet.

import type { WieMag } from '@/lib/club/beheerders/rechten'
import { naamKlopt } from '@/lib/club/leden/avg/verwijderen'
import { avgBestandsnaam, naamOfZelf, naamUit, vertaalRij, type Rij } from '@/lib/club/kern/avg-velden'
import { LEAD_BRON_LABEL, LEAD_STATUS_LABEL } from './model'

/** De ruwe rijen zoals avg-opslag.ts ze leest. */
export interface LeadExportRuw {
  lead: Rij
  historie: Rij[]
  afspraken: Rij[]
}

export interface LeadExportMeta {
  sportschool: string
  gemaaktOp: Date
  /** Vestiging-slug naar naam. */
  vestigingen: ReadonlyMap<string, string>
  /** Medewerker-id naar naam. */
  medewerkers: ReadonlyMap<string, string>
}

export const LEAD_VELDEN = {
  naam: 'Naam',
  email: 'E-mail',
  telefoon: 'Telefoon',
  vestiging: 'Vestiging',
  bron: 'Hoe binnengekomen',
  interesse: 'Interesse',
  status: 'Status',
  proefles_op: 'Proefles op',
  opvolgen_op: 'Opvolgen op',
  verloren_reden: 'Reden afgesloten',
  medewerker_id: 'Contactpersoon',
  toestemming_contact: 'Toestemming voor contact',
  aangemaakt_op: 'Aangemeld op',
  bijgewerkt_op: 'Laatst bijgewerkt op',
  geanonimiseerd_op: 'Gewist op',
} as const

export const HISTORIE_VELDEN = { soort: 'Soort', tekst: 'Tekst', auteur: 'Door', op: 'Moment' } as const

export const AFSPRAAK_VELDEN = {
  'club_afspraak_typen.naam': 'Soort afspraak',
  start_op: 'Begint',
  eind_op: 'Eindigt',
  vestiging: 'Vestiging',
  medewerker_id: 'Met',
  status: 'Status',
  notitie: 'Notitie',
  geannuleerd_op: 'Geannuleerd op',
} as const

export const LEAD_EXPORT_UITLEG =
  'Dit bestand bevat alle gegevens die de sportschool in Club over deze belangstellende bewaart, op het moment van downloaden: ' +
  'de aanmelding, de contactmomenten en de afspraken.'

function labelUit(labels: Readonly<Record<string, string>>): (waarde: unknown) => unknown {
  return (waarde) => (typeof waarde === 'string' ? labels[waarde] ?? waarde : waarde)
}

/** Het volledige bestand, met Nederlandse sleutels. */
export function bouwLeadExport(ruw: LeadExportRuw, meta: LeadExportMeta): Rij {
  const medewerker = naamUit(meta.medewerkers, 'Medewerker (niet meer bekend)')
  const vestiging = naamOfZelf(meta.vestigingen)
  const lead = vertaalRij(ruw.lead, LEAD_VELDEN, {
    vestiging,
    medewerker_id: medewerker,
    bron: labelUit(LEAD_BRON_LABEL),
    status: labelUit(LEAD_STATUS_LABEL),
  })
  lead['Lid geworden'] = typeof ruw.lead.lid_id === 'string'
  return {
    'Over dit bestand': { Sportschool: meta.sportschool, 'Gemaakt op': meta.gemaaktOp.toISOString(), Uitleg: LEAD_EXPORT_UITLEG },
    Belangstellende: lead,
    Contactmomenten: ruw.historie.map((r) => vertaalRij(r, HISTORIE_VELDEN)),
    Afspraken: ruw.afspraken.map((r) => vertaalRij(r, AFSPRAAK_VELDEN, { vestiging, medewerker_id: medewerker })),
  }
}

/** gegevens-lead-<naam>-<datum>.json */
export function leadExportBestandsnaam(naam: string, op: Date): string {
  return avgBestandsnaam('gegevens-lead', naam, op, 'lead')
}

/** Kane, de eigenaar en de clubmanager; een medewerker nooit. */
export function magLeadWissen(t: WieMag): boolean {
  return t.isPlatformEigenaar || t.rol === 'eigenaar' || t.rol === 'clubmanager'
}

/** Dezelfde naamcontrole als bij leden: hoofdletters, accenten en dubbele spaties tellen niet. */
export function leadNaamKlopt(invoer: unknown, naam: string): boolean {
  return naamKlopt(invoer, { voornaam: naam, achternaam: '' })
}

export const LEAD_IS_LID = 'Deze lead is lid geworden; wis het lid via de ledenkaart.'
export const LEAD_AL_GEWIST = 'Deze lead is al gewist.'

/** Mag deze lead gewist worden? null = ja, anders de melding. */
export function wisBlokkade(lead: { lidId: string | null; geanonimiseerdOp: string | null }): string | null {
  const soort = wisBlokkadeSoort(lead)
  return soort === 'gewist' ? LEAD_AL_GEWIST : soort === 'isLid' ? LEAD_IS_LID : null
}

/** Waarom wissen niet kan, als sleutel (voor de tekst in de taal van de pagina). */
export function wisBlokkadeSoort(lead: { lidId: string | null; geanonimiseerdOp: string | null }): 'gewist' | 'isLid' | null {
  if (lead.geanonimiseerdOp) return 'gewist'
  if (lead.lidId) return 'isLid'
  return null
}
