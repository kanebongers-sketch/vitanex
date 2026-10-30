// ─── Club, training: wat de ledenapp over eigen schema's krijgt (PUUR) ──────
// Slanke vormen voor de browser: geen interne kolommen, geen andere leden.

import type { Spier } from '../spieren'
import type { SchemaRegel } from '../rijen'
import type { Doel, Materiaal, Niveau, Patroon, Spiergroep } from '../typen'
import type { Maker } from './regels'

/** Een oefening uit de bibliotheek die een lid mag kiezen (Blender-render en coaching). */
export interface LidOefening {
  id: string
  naam: string
  spiergroep: Spiergroep
  materiaal: Materiaal
  niveau: Niveau
  patroon: Patroon | null
  spierenPrimair: Spier[]
  spierenSecundair: Spier[]
  uitleg: string | null
  aandachtspunten: string | null
}

/** Een schema in de lijst "Mijn schema's". */
export interface SchemaKeuze {
  id: string
  naam: string
  maker: Maker
  dagen: number
  /** Dit schema ziet het lid nu in de app. */
  actief: boolean
  /** Mag het lid het aanpassen (eigen schema, of de sportschool staat het toe)? */
  magBewerken: boolean
  magVerwijderen: boolean
}

/** Een schema om te bewerken in de ledenapp. */
export interface LidSchemaDetail {
  id: string
  naam: string
  maker: Maker
  doel: Doel | null
  niveau: Niveau
  dagTitels: string[]
  regels: SchemaRegel[]
  /** De oefeningen die in het schema staan (ook een eigen oefening van de trainer). */
  oefeningen: LidOefening[]
}

/** Wat de app nodig heeft om het eigen schema te tonen en te beheren. */
export interface EigenSchemaInfo {
  /** Het actieve schema komt van de trainer of van het lid zelf. */
  maker: Maker | null
  keuzes: SchemaKeuze[]
  /** Instelling van de sportschool: mag een lid het schema van de trainer aanpassen? */
  trainerAanpassen: boolean
}
