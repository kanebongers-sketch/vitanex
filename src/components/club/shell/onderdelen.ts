// ─── Fit Factory clubsoftware: de onderdelen (PUUR) ─────────────────────────
// Eén lijst voor de navigatie, het zoekveld en de rechten per rol. De
// onderdelen zijn ingedeeld in vijf groepen (besluit Kane: een ingedeeld menu
// zoals Virtuagym, maar op onze eigen manier: groepen bovenin, de onderdelen van
// de groep eronder, en op de telefoon een menupaneel).
// Het menu is voor dagelijks werk (besluit Kane 18-10-2026). In Beheer staan
// alleen Cijfers en Rapporten; alles wat je instelt staat in het
// instellingencentrum (src/lib/club/kern/instel-paginas.ts). Onderdelen met
// inMenu: false bestaan voor de rechten en het zoekveld, niet in de balk.
// Instellingen, de Ledenapp en Hulp staan onderaan in de hulpbalk (hulpbalk:
// true, idee Kane 23-10-2026, zie hulpbalk.ts), niet in het menu: niets dubbel.
// Minder tabbladen (besluit Kane 27-10-2026): Check-in, Taken en Opvolgen zijn
// een sectie op Vandaag (sectie: het anker), geen eigen tab. Hun rechtensleutels
// blijven, net als hun volledige schermen (schermen), voor diepe links en API.

import type { Module } from '@/lib/club/kern/organisatie'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'

export const GROEPEN = [
  { sleutel: 'werkvloer', label: 'Werkvloer', uitleg: 'Wat er vandaag in de club gebeurt' },
  { sleutel: 'leden', label: 'Leden', uitleg: 'Leden, leads en de ledenapp' },
  { sleutel: 'planning', label: 'Planning', uitleg: 'Groepslessen, personeel en taken' },
  { sleutel: 'coaching', label: 'Coaching', uitleg: "Intakes, schema's en oefeningen" },
  { sleutel: 'beheer', label: 'Beheer', uitleg: 'Cijfers en rapporten' },
] as const

export type GroepSleutel = (typeof GROEPEN)[number]['sleutel']

export interface Onderdeel {
  sleutel: string
  /** Pad binnen /club ('' = Vandaag). */
  pad: string
  label: string
  /** Korte uitleg voor de zoekbalk en de presentatie. */
  uitleg: string
  groep: GroepSleutel
  /** Het onderdeel dat een sportschool uit kan zetten (zie het huisstijl-portaal). Zonder: altijd aan. */
  module?: Module
  /** false: niet in de menubalk, alleen via het instellingencentrum (wel in de rechten en het zoekveld). */
  inMenu?: false
  /** true: niet in het menu maar onderaan in de hulpbalk (Instellingen, Ledenapp, Hulp). */
  hulpbalk?: true
  /** Sneltoets op de pc: G en dan deze letter (bijvoorbeeld G dan L voor Leden). */
  toets?: string
  /** Staat als sectie op Vandaag met dit anker (/club#anker), niet als tab in het menu. */
  sectie?: string
  /** Volledige schermen achter deze sectie (te vinden via zoeken en de links in de sectie). */
  schermen?: readonly Scherm[]
}

/** Een volledig scherm achter een sectie op Vandaag, bijvoorbeeld de takenweek. */
export interface Scherm {
  id: string
  label: string
  uitleg: string
  /** Pad binnen /club. */
  pad: string
}

export const ONDERDELEN: readonly Onderdeel[] = [
  { sleutel: 'vandaag', pad: '', label: 'Vandaag', uitleg: 'Wat er nu speelt in je vestiging', groep: 'werkvloer', toets: 'v' },
  { sleutel: 'checkin', pad: '/checkin', label: 'Check-in', uitleg: 'Leden inchecken en wie er nu binnen is, bovenaan Vandaag', groep: 'werkvloer', module: 'checkin', toets: 'c', sectie: 'checkin',
    schermen: [
      { id: 'balie', label: 'Check-in op volledig scherm', uitleg: 'De balie voor een vaste tablet of pc, met scanner of bandjeslezer', pad: '/checkin' },
      { id: 'kiosk', label: 'Zelf-check-in scherm', uitleg: 'Tablet bij de ingang: leden scannen de QR-code uit hun app', pad: '/checkin/kiosk' },
    ] },
  { sleutel: 'taken', pad: '/taken', label: 'Taken', uitleg: 'Dagelijkse taken en de afsluitronde, op Vandaag', groep: 'werkvloer', module: 'taken', toets: 'k', sectie: 'taken',
    schermen: [
      { id: 'week', label: 'Takenweek', uitleg: 'Alle taken en poetslijsten van de hele week in een tabel', pad: '/taken/week' },
      { id: 'overzicht', label: 'Takenoverzicht', uitleg: 'Gemiste dagtaken, weektaken die achterlopen en afsluitrondes', pad: '/taken/overzicht' },
      { id: 'beheer', label: 'Takenlijsten beheren', uitleg: 'Lijsten en taken maken, hoe vaak en wanneer, kopieren naar een vestiging', pad: '/taken/beheer' },
    ] },
  { sleutel: 'opvolgen', pad: '/opvolgen', label: 'Opvolgen', uitleg: 'Leden en leads die je vandaag belt of aanspreekt, op Vandaag', groep: 'werkvloer', toets: 'o', sectie: 'opvolgen',
    schermen: [
      { id: 'lijst', label: 'Opvolgen: volledige lijst', uitleg: 'Alle open opvolging per regel en wat de laatste 7 dagen is afgehandeld', pad: '/opvolgen' },
    ] },
  { sleutel: 'notities', pad: '/notities', label: 'Notities', uitleg: 'Overdracht, afspraken, kennis en ideeën', groep: 'werkvloer', toets: 'n' },
  { sleutel: 'leden', pad: '/leden', label: 'Leden', uitleg: 'Ledenkaart, bezoek, notities en status', groep: 'leden', module: 'leden', toets: 'l' },
  { sleutel: 'leads', pad: '/leads', label: 'Leads', uitleg: 'Proeflessen en nieuwe leden opvolgen', groep: 'leden', module: 'leads', toets: 'e' },
  { sleutel: 'berichten', pad: '/berichten', label: 'Berichten', uitleg: 'Nieuws en acties op Home in de ledenapp', groep: 'leden', toets: 'b' },
  { sleutel: 'community', pad: '/community', label: 'Community', uitleg: 'Groepen, berichten en meldingen van leden', groep: 'leden', module: 'app' },
  { sleutel: 'challenges', pad: '/challenges', label: 'Challenges', uitleg: 'Doelen, voortgang en badges voor leden', groep: 'leden' },
  { sleutel: 'rooster', pad: '/rooster', label: 'Groepslessen', uitleg: 'Lesrooster, reserveringen en wachtlijst', groep: 'planning', module: 'rooster', toets: 'r' },
  { sleutel: 'afspraken', pad: '/afspraken', label: 'Afspraken', uitleg: 'Intakes, personal training en metingen per trainer', groep: 'planning', module: 'afspraken', toets: 'a' },
  { sleutel: 'personeel', pad: '/personeel', label: 'Personeel', uitleg: 'Diensten en uren van het fitnesspersoneel', groep: 'planning', module: 'personeel', toets: 'p' },
  { sleutel: 'agenda', pad: '/agenda', label: 'Agenda', uitleg: 'Overleg, intakes en afspraken per week', groep: 'planning' },
  { sleutel: 'schemas', pad: '/training', label: 'Training', uitleg: "Intakes, schema's en oefeningen", groep: 'coaching', module: 'training', toets: 't' },
  { sleutel: 'voeding', pad: '/voeding', label: 'Voeding', uitleg: 'Dagdoelen, adviezen en sjablonen per lid', groep: 'coaching' },
  { sleutel: 'cijfers', pad: '/cijfers', label: 'Cijfers', uitleg: 'Groei, bezoek, bezetting en behoud per maand', groep: 'beheer', module: 'cijfers' },
  { sleutel: 'rapporten', pad: '/rapporten', label: 'Rapporten', uitleg: 'Exports per maand naar Excel: leden, bezoek, lessen, leads en uren', groep: 'beheer' },
  { sleutel: 'beheer', pad: '/beheer', label: 'Instellingen', uitleg: 'Alles van je sportschool instellen, op een plek', groep: 'beheer', toets: 'i', hulpbalk: true },
  { sleutel: 'hulp', pad: '/hulp', label: 'Hulp', uitleg: 'Handleidingen en een vraag of probleem melden', groep: 'beheer', toets: 'h', hulpbalk: true },
  // Alleen via het instellingencentrum (en het zoekveld); wel hier voor de rechten per rol.
  { sleutel: 'instellingen', pad: '/instellingen', label: 'Vestigingen, rooster en team', uitleg: 'Regels, openingstijden, zalen, lestypen, weekrooster en medewerkers', groep: 'beheer', inMenu: false },
  { sleutel: 'app', pad: '/app', label: 'Ledenapp bekijken', uitleg: 'Zo ziet een lid de app op zijn telefoon', groep: 'beheer', module: 'app', hulpbalk: true },
  { sleutel: 'start', pad: '/start', label: 'Startwizard', uitleg: 'Je sportschool stap voor stap inrichten', groep: 'beheer', inMenu: false },
  { sleutel: 'huisstijl', pad: '/huisstijl', label: 'Huisstijl', uitleg: 'Logo, kleuren en onderdelen van je sportschool', groep: 'beheer', inMenu: false },
  { sleutel: 'bedrijf', pad: '/beheer/bedrijf', label: 'Bedrijf en huisregels', uitleg: 'KvK, btw, contact en de teksten voor je leden', groep: 'beheer', inMenu: false },
  { sleutel: 'lidmaatschappen', pad: '/beheer/lidmaatschappen', label: 'Lidmaatschappen en labels', uitleg: 'Lidmaatschapsvormen met hun toegang, en labels voor leden', groep: 'beheer', inMenu: false },
  { sleutel: 'sluiting', pad: '/beheer/sluiting', label: 'Sluitingsdagen', uitleg: 'Feestdagen, sluitingen en andere openingstijden', groep: 'beheer', inMenu: false },
]

/** Is dit onderdeel actief op dit pad? */
export function isActief(onderdeel: Onderdeel, pad: string): boolean {
  const basis = `/club${onderdeel.pad}`
  if (onderdeel.pad === '') return pad === '/club' || pad === '/club/'
  return pad === basis || pad.startsWith(`${basis}/`)
}

/** Het onderdeel dat bij dit pad hoort (het langste passende pad wint), of Vandaag. */
export function actiefOnderdeel(pad: string): Onderdeel {
  const passend = ONDERDELEN.filter((o) => isActief(o, pad)).sort((a, b) => b.pad.length - a.pad.length)
  return passend[0] ?? ONDERDELEN[0]
}

/**
 * Staat dit onderdeel aan bij deze sportschool, en mag deze persoon het zien?
 * `toegestaan` null = alles (Kane en de eigenaar); anders de sleutels die de
 * eigenaar aan de rol gaf (zie src/lib/club/beheerders/rechten.ts).
 */
export function isZichtbaar(onderdeel: Onderdeel, uit: readonly Module[] = [], toegestaan: readonly string[] | null = null): boolean {
  if (!magOnderdeel(toegestaan, onderdeel.sleutel)) return false
  return !onderdeel.module || !uit.includes(onderdeel.module)
}

/** Staat dit onderdeel in de menubalk (niet in het instellingencentrum, niet in de hulpbalk en geen sectie op Vandaag)? */
export function inMenu(onderdeel: Onderdeel): boolean {
  return onderdeel.inMenu !== false && !onderdeel.hulpbalk && !onderdeel.sectie
}

/** Waar een onderdeel heen gaat: een sectie op Vandaag als anker (#checkin), anders zijn pad. */
export function onderdeelPad(onderdeel: Pick<Onderdeel, 'pad' | 'sectie'>): string {
  return onderdeel.sectie ? `#${onderdeel.sectie}` : onderdeel.pad
}

/** Vandaag, waar de secties op staan. */
const VANDAAG = ONDERDELEN[0]

/**
 * Het menu-onderdeel dat oplicht op dit pad, of null als je buiten het menu
 * bent: in de hulpbalk (Instellingen en elke instel-pagina, Koppelingen,
 * Ledenapp, Wat is nieuw, Hulp) of op een pagina zonder onderdeel. Op een
 * volledig scherm van een sectie (de takenweek, de balie) licht Vandaag op.
 */
export function menuOnderdeel(pad: string): Onderdeel | null {
  const o = actiefOnderdeel(pad)
  if (!isActief(o, pad)) return null
  if (o.sectie) return VANDAAG
  return inMenu(o) ? o : null
}

/** De secties op Vandaag die deze persoon ziet, in vaste volgorde. */
export function sectiesVoor(uit: readonly Module[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  if (!isZichtbaar(VANDAAG, uit, toegestaan)) return []
  return ONDERDELEN.filter((o) => o.sectie && isZichtbaar(o, uit, toegestaan))
}

/** De onderdelen van een groep in het menu, in vaste volgorde. */
export function onderdelenVan(groep: GroepSleutel, uit: readonly Module[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  return ONDERDELEN.filter((o) => o.groep === groep && inMenu(o) && isZichtbaar(o, uit, toegestaan))
}

/** De groepen met minstens een onderdeel in het menu. */
export function groepenMet(uit: readonly Module[] = [], toegestaan: readonly string[] | null = null): (typeof GROEPEN)[number][] {
  return GROEPEN.filter((g) => onderdelenVan(g.sleutel, uit, toegestaan).length > 0)
}

// ── Onderbalk (telefoon en tablet staand) ────────────────────────────────────
// Besluit Kane (20-10-2026): de trainer op de vloer moet het makkelijk hebben.
// Onder in beeld staan de vier onderdelen die deze persoon het meest nodig heeft,
// plus Meer (het menupaneel met alles). Check-in, Taken en Opvolgen staan op
// Vandaag (de eerste knop), dus niet apart in de balk. Vaste volgorde op basis van de rechten,
// niet op gebruik: een knop die verspringt kost meer dan hij oplevert.

/** Volgorde van belang op de werkvloer; de eerste vier die iemand mag, komen in de onderbalk. */
export const ONDERBALK_VOLGORDE: readonly string[] = ['vandaag', 'leden', 'schemas', 'rooster', 'personeel', 'afspraken', 'leads', 'agenda', 'voeding', 'notities']

export const ONDERBALK_MAX = 4

/** De onderdelen in de onderbalk voor deze persoon (zonder Meer). */
export function onderbalkOnderdelen(uit: readonly Module[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  return ONDERBALK_VOLGORDE.map((s) => ONDERDELEN.find((o) => o.sleutel === s))
    .filter((o): o is Onderdeel => !!o && isZichtbaar(o, uit, toegestaan))
    .slice(0, ONDERBALK_MAX)
}

// ── Sneltoetsen (pc) ─────────────────────────────────────────────────────────

/**
 * Het onderdeel achter G en dan deze letter, als deze persoon het in het menu,
 * in de hulpbalk of als sectie op Vandaag heeft (G C gaat naar /club#checkin,
 * zie onderdeelPad). Instellingen (G I) volgt `instellingen` (zie
 * heeftInstellingen in instel-paginas.ts); standaard alleen bij alle rechten.
 */
export function onderdeelVoorToets(letter: string, uit: readonly Module[] = [], toegestaan: readonly string[] | null = null, instellingen: boolean = toegestaan === null): Onderdeel | null {
  const l = letter.toLowerCase()
  const o = ONDERDELEN.find((x) => x.toets === l && (inMenu(x) || x.hulpbalk || x.sectie))
  if (!o) return null
  if (o.sleutel === 'beheer') return instellingen ? o : null
  if (o.sectie) return sectiesVoor(uit, toegestaan).includes(o) ? o : null
  if (o.hulpbalk) return isZichtbaar(o, uit, toegestaan) ? o : null
  return onderdelenVan(o.groep, uit, toegestaan).includes(o) ? o : null
}

/** De toets als tekst voor in beeld, bijvoorbeeld "G L". */
export function toetsTekst(o: Pick<Onderdeel, 'toets'>): string | null {
  return o.toets ? `G ${o.toets.toUpperCase()}` : null
}
