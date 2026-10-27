// ─── Club, ledenkaart als hub: wat deze persoon op de kaart ziet (PUUR) ─────
// Elk blok op de ledenkaart hoort bij een onderdeel (sleutels uit
// shell/onderdelen.ts) en soms bij een module van de sportschool. Wie het
// onderdeel niet mag (een clubmanager zonder recht, een trainer), ziet het blok
// niet; de API's controleren hetzelfde nog een keer (rechten.ts, magApi).
// De kern van het lid (bezoek, status, lidmaatschap, notities, gegevens, AVG)
// hoort bij Leden: wie de kaart mag openen, ziet die altijd, en daarom ook
// alle tabbladen (alleen de blokken erin verschillen per rol).

import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import type { Module } from '@/lib/club/kern/organisatie'

export interface KaartRechtenInvoer {
  /** De onderdelen van deze persoon; null = alles (Kane en de eigenaar). */
  onderdelen: readonly string[] | null
  /** De modules die de sportschool uit heeft staan. */
  modulesUit: readonly Module[]
  /** CLUB_HEALTH_ACTIEF. */
  healthAan: boolean
  /** Lidgeld staat aan en deze persoon mag Lidmaatschappen (lidgeldOpen). */
  lidgeldOpen: boolean
}

export interface KaartRechten {
  /** Intakes en schema's (module Training, onderdeel Training). */
  training: boolean
  voeding: boolean
  /** Metingen uit apps van het lid (alleen met toestemming van het lid). */
  apps: boolean
  /** Lessen boeken en annuleren voor het lid. */
  rooster: boolean
  afspraken: boolean
  /** Het lid inchecken vanaf de kaart. */
  checkin: boolean
  challenges: boolean
  /** De berichten die het lid in de ledenapp ziet. */
  berichten: boolean
  /** De link en QR voor de ledenapp. */
  ledenapp: boolean
  /** Plan en contract (lidgeld), achter de schakelaars. */
  betalen: boolean
}

function aan(invoer: KaartRechtenInvoer, onderdeel: string, module?: Module): boolean {
  return (module === undefined || !invoer.modulesUit.includes(module)) && magOnderdeel(invoer.onderdelen, onderdeel)
}

export function kaartRechten(invoer: KaartRechtenInvoer): KaartRechten {
  const training = aan(invoer, 'schemas', 'training')
  return {
    training,
    voeding: aan(invoer, 'voeding'),
    apps: invoer.healthAan && magOnderdeel(invoer.onderdelen, 'schemas'),
    rooster: aan(invoer, 'rooster', 'rooster'),
    afspraken: aan(invoer, 'afspraken', 'afspraken'),
    checkin: aan(invoer, 'checkin', 'checkin'),
    challenges: aan(invoer, 'challenges'),
    berichten: aan(invoer, 'berichten'),
    ledenapp: !invoer.modulesUit.includes('app'),
    betalen: invoer.lidgeldOpen && magOnderdeel(invoer.onderdelen, 'lidmaatschappen'),
  }
}
