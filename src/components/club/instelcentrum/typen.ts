import type { InstelGroep } from '@/lib/club/kern/instel-paginas'

// De vorm waarin de server het instellingencentrum aan de browser geeft: alle
// teksten al in de gekozen taal, alle links al met de vestiging erbij.

export interface CentrumLink {
  id: string
  titel: string
  href: string
}

export interface CentrumRegel {
  id: string
  titel: string
  uitleg: string
  /** Alleen als het iets zegt: een aantal, of "Nog doen". */
  stand: string | null
  /** Moet nog gebeuren (de stand krijgt de let-op-kleur). */
  let: boolean
  /** Waar je het aanpast; null = nu niet beschikbaar (nog geen vestiging). */
  href: string | null
  /** Kleine links eronder (wat bij deze regel hoort). */
  links: CentrumLink[]
}

export interface CentrumCategorie {
  sleutel: InstelGroep
  label: string
  uitleg: string
  /** Staat er in deze categorie iets open? */
  let: boolean
  rijen: CentrumRegel[]
}

export interface CentrumStart {
  href: string
  /** "Stap 3 van 8", "Afgerond", of null. */
  stand: string | null
}
