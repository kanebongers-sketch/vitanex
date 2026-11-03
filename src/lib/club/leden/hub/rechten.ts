// ─── Club, ledenkaart als hub: wat deze persoon op de kaart ziet (PUUR) ─────
// Elk blok op de ledenkaart hoort bij een onderdeel (sleutels uit
// shell/onderdelen.ts) en soms bij een module van de sportschool. Wie het
// onderdeel niet mag (een clubmanager zonder recht, een trainer), ziet het blok
// niet; de API's controleren hetzelfde nog een keer (rechten.ts, magApi).
// De kern van het lid (bezoek, status, lidmaatschap, notities, gegevens, AVG)
// hoort bij Leden: wie de kaart mag openen, ziet die altijd: Overzicht en
// Lidmaatschap staan er dus altijd, Training alleen met een blok erin.

import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import type { Module } from '@/lib/club/kern/organisatie'
import { KAART_TABS, type KaartTab } from './tabs'
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
  /**
   * Rollen v2: mag deze persoon dit onderdeel bewerken (kanBewerken)? Zonder:
   * alles wat zichtbaar is, is ook te bewerken (het oude model).
   */
  bewerkbaar?: (sleutel: string) => boolean
}

/** Wat deze persoon op de kaart mag wijzigen; wie alleen mag zien, krijgt de kaart in leesmodus. */
export interface KaartBewerken {
  /** Kern van het lid: notities, status, lidmaatschap, coach en labels. */
  leden: boolean
  training: boolean
  voeding: boolean
  rooster: boolean
  afspraken: boolean
  berichten: boolean
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
  bewerk: KaartBewerken
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
  const mag = invoer.bewerkbaar ?? (() => true)
  const leden = mag('leden')
  const voeding = aan(invoer, 'voeding')
  const rooster = aan(invoer, 'rooster', 'rooster')
  const afspraken = aan(invoer, 'afspraken', 'afspraken')
  const berichten = aan(invoer, 'berichten')
  const bewerk: KaartBewerken = {
    leden,
    training: training && mag('schemas'),
    voeding: voeding && mag('voeding'),
    rooster: rooster && mag('rooster'),
    afspraken: afspraken && mag('afspraken'),
    berichten: berichten && mag('berichten'),
  }
  return {
    bewerk,
    training,
    voeding,
    apps: invoer.healthAan && aan(invoer, 'schemas', 'training'),
    rooster,
    afspraken,
    checkin: aan(invoer, 'checkin', 'checkin'),
    challenges: aan(invoer, 'challenges'),
    berichten,
    ledenapp: !invoer.modulesUit.includes('app'),
    betalen: invoer.lidgeldOpen && aan(invoer, 'lidmaatschappen'),
    lidmaatschap: lidmaatschapZichtbaar(invoer.modulesUit),
  }
}

/**
 * De tabbladen van de ledenkaart die er voor deze sportschool en deze persoon
 * zijn (EENVOUD-10-MINUTEN.md, hoofdstuk 4). Een tabblad zonder blok valt weg:
 * Training alleen met iets van Training en coaching (schema's, voeding,
 * metingen uit apps) of challenges. Overzicht (bezoek, notities) en
 * Lidmaatschap (gegevens en privacy) horen bij de kern en staan er altijd.
 */
export function zichtbareLidTabs(r: KaartRechten): KaartTab[] {
  const tab: Record<KaartTab, boolean> = {
    overzicht: true,
    training: r.training || r.voeding || r.apps || r.challenges,
    lidmaatschap: true,
  }
  return KAART_TABS.filter((t) => tab[t])
}

/** Een actie die je vanaf de ledenkaart start. */
export type KaartActie = 'inchecken' | 'lesBoeken' | 'afspraak' | 'intake' | 'schema' | 'notitie' | 'lidmaatschap'

/** Volgorde van Meer acties in de kop. */
export const MEER_VOLGORDE: readonly KaartActie[] = ['inchecken', 'lesBoeken', 'afspraak', 'intake', 'schema', 'notitie']

export interface KaartActies {
  /** De hoofdactie van dit tabblad (rechts in de kop, op de telefoon onderaan), of null. */
  hoofd: KaartActie | null
  /** De rest, onder Meer acties. Nooit de hoofdactie, nooit iets zonder recht. */
  meer: KaartActie[]
}

function hoofdVoor(r: KaartRechten, tab: KaartTab, heeftIntake: boolean): KaartActie | null {
  if (tab === 'overzicht') return r.bewerk.leden ? 'notitie' : null
  if (tab === 'training') return r.bewerk.training ? (heeftIntake ? 'schema' : 'intake') : null
  return r.bewerk.leden && r.lidmaatschap ? 'lidmaatschap' : null
}

/**
 * Een hoofdactie per tabblad en de rest onder Meer acties
 * (Overzicht: Notitie toevoegen; Training: Schema maken, zonder intake Intake
 * starten; Lidmaatschap: Lidmaatschap wijzigen). Alleen wat deze persoon mag.
 */
export function kaartActies(r: KaartRechten, tab: KaartTab, heeftIntake: boolean): KaartActies {
  const mag: Record<KaartActie, boolean> = {
    inchecken: r.checkin,
    lesBoeken: r.bewerk.rooster,
    afspraak: r.bewerk.afspraken,
    intake: r.bewerk.training,
    schema: r.bewerk.training,
    notitie: r.bewerk.leden,
    lidmaatschap: r.bewerk.leden && r.lidmaatschap,
  }
  const hoofd = hoofdVoor(r, tab, heeftIntake)
  return { hoofd, meer: MEER_VOLGORDE.filter((a) => mag[a] && a !== hoofd) }
}
