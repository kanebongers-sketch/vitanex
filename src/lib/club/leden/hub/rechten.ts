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
import { LID_TABS, type LidTab } from './tabs'
import { pakketZichtbaar, zichtbaar, type Verborgen } from '@/lib/club/kern/pakketten'

export interface KaartRechtenInvoer {
  /** De onderdelen van deze persoon; null = alles (Kane en de eigenaar). */
  onderdelen: readonly string[] | null
  /** Wat er niet is: modules die uit staan en pakketten die niet zijn afgenomen (organisatie.uit). */
  modulesUit: readonly Verborgen[]
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
  /** Het tabblad Lidmaatschap (vorm, pauze, opzeggen): pakket Ledenadministratie. */
  lidmaatschap: boolean
}

function aan(invoer: KaartRechtenInvoer, onderdeel: string, module?: Module): boolean {
  return zichtbaar(invoer.modulesUit, { sleutel: onderdeel, module }) && magOnderdeel(invoer.onderdelen, onderdeel)
}

/** Het tabblad Lidmaatschap (vorm, pauze, opzeggen) hoort bij Ledenadministratie. */
export function lidmaatschapZichtbaar(uit: readonly Verborgen[]): boolean {
  return pakketZichtbaar(uit, 'administratie')
}

export function kaartRechten(invoer: KaartRechtenInvoer): KaartRechten {
  const training = aan(invoer, 'schemas', 'training')
  return {
    training,
    voeding: aan(invoer, 'voeding'),
    apps: invoer.healthAan && aan(invoer, 'schemas', 'training'),
    rooster: aan(invoer, 'rooster', 'rooster'),
    afspraken: aan(invoer, 'afspraken', 'afspraken'),
    checkin: aan(invoer, 'checkin', 'checkin'),
    challenges: aan(invoer, 'challenges'),
    berichten: aan(invoer, 'berichten'),
    ledenapp: !invoer.modulesUit.includes('app'),
    betalen: invoer.lidgeldOpen && aan(invoer, 'lidmaatschappen'),
    lidmaatschap: lidmaatschapZichtbaar(invoer.modulesUit),
  }
}

/**
 * De tabbladen van de ledenkaart die er voor deze sportschool en deze persoon
 * zijn: Training alleen met iets van Training en coaching, Lidmaatschap alleen
 * met Ledenadministratie, Planning alleen met Groepslessen of Afspraken.
 * Overzicht, Contact en Privacy horen bij de kern.
 */
export function zichtbareLidTabs(r: KaartRechten): LidTab[] {
  const tab: Record<LidTab, boolean> = {
    overzicht: true,
    training: r.training || r.voeding || r.apps,
    lidmaatschap: r.lidmaatschap || r.betalen,
    planning: r.rooster || r.afspraken,
    contact: true,
    privacy: true,
  }
  return LID_TABS.filter((t) => tab[t])
}
