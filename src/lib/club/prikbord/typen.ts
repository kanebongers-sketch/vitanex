// ─── Club, Prikbord: soorten en vormen (PUUR) ───────────────────────────────
// Het Prikbord (Vandaag · Prikbord, migratie 489) heeft drie blokken:
// mededelingen aan het team, werkwijzen stap voor stap en de notities.
// Ontwerp: docs/club/EENVOUD-10-MINUTEN.md, hoofdstuk 2.5 en deel 5.

import type { Rol } from '@/lib/club/rollen/typen'

export const WERKWIJZE_SOORTEN = ['openen', 'sluiten', 'veiligheid', 'nieuw_lid', 'klacht', 'eigen'] as const
export type WerkwijzeSoort = (typeof WERKWIJZE_SOORTEN)[number]

export function isWerkwijzeSoort(v: unknown): v is WerkwijzeSoort {
  return typeof v === 'string' && (WERKWIJZE_SOORTEN as readonly string[]).includes(v)
}

/** De voorbeelden die een eigenaar kan kiezen (nooit automatisch aangemaakt, besluit Kane). */
export const VOORBEELDEN = ['openen', 'sluiten', 'veiligheid', 'nieuw_lid', 'klacht'] as const
export type Voorbeeld = (typeof VOORBEELDEN)[number]

export function isVoorbeeld(v: unknown): v is Voorbeeld {
  return typeof v === 'string' && (VOORBEELDEN as readonly string[]).includes(v)
}

/** Grenzen, gelijk aan de checks in migratie 489. */
export const GRENZEN = {
  titel: 120,
  inhoud: 4000,
  stappen: 40,
  stapTekst: 200,
  stapUitleg: 600,
  watAnders: 600,
  notitie: 1000,
} as const

export type MededelingSoort = 'mededeling' | 'wijziging'

/** Voor wie: leeg = alle vestigingen of iedereen. */
export interface Doelgroep {
  vestigingen: readonly string[]
  rollen: readonly Rol[]
}

export interface Mededeling extends Doelgroep {
  id: string
  titel: string
  inhoud: string
  verplicht: boolean
  soort: MededelingSoort
  werkwijzeId: string | null
  werkwijzeVersie: number | null
  doorProfiel: string | null
  geplaatstOp: string
  verlooptOp: string | null
  gearchiveerd: boolean
}

export interface Gelezen {
  mededelingId: string
  profielId: string
  gelezenOp: string
  bevestigdOp: string | null
}

export interface Stap {
  tekst: string
  uitleg: string | null
}

export interface Werkwijze extends Doelgroep {
  id: string
  titel: string
  soort: WerkwijzeSoort
  /** De huidige versie. */
  versie: number
  takenlijstId: string | null
  bronNotitieId: string | null
  gearchiveerd: boolean
  bijgewerktOp: string
  /** De stappen van de huidige versie. */
  stappen: Stap[]
  /** Wat er anders is in de huidige versie (leeg bij versie 1). */
  watAnders: string | null
}

export interface Uitvoering {
  id: string
  werkwijzeId: string
  versie: number
  vestiging: string
  profielId: string | null
  gestartOp: string
  afgerondOp: string | null
  /** De nummers (vanaf 0) van de afgevinkte stappen. */
  afgevinkt: number[]
  notitie: string | null
  lidId: string | null
}

/** Wie er kijkt: genoeg om te weten welke mededelingen en werkwijzen voor hem zijn. */
export interface Kijker {
  /** Het profiel (club_medewerkers.id); null voor wie geen profiel heeft (het master account). */
  profielId: string | null
  rollen: readonly Rol[]
  /** De vestigingen waar deze persoon werkt (sleutels). */
  vestigingen: readonly string[]
}

/** Iemand in het team, om "7 van 9 bevestigd" uit te rekenen. */
export interface TeamPersoon {
  id: string
  naam: string
  rollen: readonly Rol[]
  vestigingen: readonly string[]
  alleVestigingen: boolean
}
