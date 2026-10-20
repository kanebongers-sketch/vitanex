// ─── Fit Factory clubsoftware: de onderdelen (PUUR) ─────────────────────────
// Eén lijst voor de navigatie, het zoekveld en de rechten per rol. De
// onderdelen zijn ingedeeld in vijf groepen (besluit Kane: een ingedeeld menu
// zoals Virtuagym, maar op onze eigen manier: groepen bovenin, de onderdelen van
// de groep eronder, en op de telefoon een menupaneel).
// Het menu is voor dagelijks werk (besluit Kane 18-10-2026). In Beheer staan
// alleen Cijfers, Rapporten, Instellingen en Hulp; alles wat je instelt staat in
// het instellingencentrum (src/lib/club/kern/instel-paginas.ts). Onderdelen met
// inMenu: false bestaan voor de rechten en het zoekveld, niet in de balk.

import type { Module } from '@/lib/club/kern/organisatie'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'

export const GROEPEN = [
  { sleutel: 'werkvloer', label: 'Werkvloer', uitleg: 'Wat er vandaag in de club gebeurt' },
  { sleutel: 'leden', label: 'Leden', uitleg: 'Leden, leads en de ledenapp' },
  { sleutel: 'planning', label: 'Planning', uitleg: 'Groepslessen, personeel en taken' },
  { sleutel: 'coaching', label: 'Coaching', uitleg: "Intakes, schema's en oefeningen" },
  { sleutel: 'beheer', label: 'Beheer', uitleg: 'Cijfers, rapporten, instellingen en hulp' },
] as const

export type GroepSleutel = (typeof GROEPEN)[number]['sleutel']

export interface Onderdeel {
  sleutel: string
  /** Pad binnen /clubkane ('' = Vandaag). */
  pad: string
  label: string
  /** Korte uitleg voor de zoekbalk en de presentatie. */
  uitleg: string
  groep: GroepSleutel
  /** Het onderdeel dat een sportschool uit kan zetten (zie het huisstijl-portaal). Zonder: altijd aan. */
  module?: Module
  /** false: niet in de menubalk, alleen via het instellingencentrum (wel in de rechten en het zoekveld). */
  inMenu?: false
  /** Sneltoets op de pc: G en dan deze letter (bijvoorbeeld G dan L voor Leden). */
  toets?: string
}

export const ONDERDELEN: readonly Onderdeel[] = [
  { sleutel: 'vandaag', pad: '', label: 'Vandaag', uitleg: 'Wat er nu speelt in je vestiging', groep: 'werkvloer', toets: 'v' },
  { sleutel: 'checkin', pad: '/checkin', label: 'Check-in', uitleg: 'Balie: leden inchecken en wie er binnen is', groep: 'werkvloer', module: 'checkin', toets: 'c' },
  { sleutel: 'taken', pad: '/taken', label: 'Taken', uitleg: 'Dagelijkse taken, afsluitronde en poetsrooster', groep: 'werkvloer', module: 'taken', toets: 'k' },
  { sleutel: 'opvolgen', pad: '/opvolgen', label: 'Opvolgen', uitleg: 'Leden die je vandaag belt of aanspreekt (nieuwe leads volg je op bij Leads)', groep: 'werkvloer', toets: 'o' },
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
  { sleutel: 'beheer', pad: '/beheer', label: 'Instellingen', uitleg: 'Alles van je sportschool instellen, op een plek', groep: 'beheer', toets: 'i' },
  { sleutel: 'hulp', pad: '/hulp', label: 'Hulp', uitleg: 'Handleidingen en een vraag of probleem melden', groep: 'beheer', toets: 'h' },
  // Alleen via het instellingencentrum (en het zoekveld); wel hier voor de rechten per rol.
  { sleutel: 'instellingen', pad: '/instellingen', label: 'Vestigingen, rooster en team', uitleg: 'Regels, openingstijden, zalen, lestypen, weekrooster en medewerkers', groep: 'beheer', inMenu: false },
  { sleutel: 'app', pad: '/app', label: 'Ledenapp bekijken', uitleg: 'Zo ziet een lid de app op zijn telefoon', groep: 'beheer', module: 'app', inMenu: false },
  { sleutel: 'start', pad: '/start', label: 'Startwizard', uitleg: 'Je sportschool stap voor stap inrichten', groep: 'beheer', inMenu: false },
  { sleutel: 'huisstijl', pad: '/huisstijl', label: 'Huisstijl', uitleg: 'Logo, kleuren en onderdelen van je sportschool', groep: 'beheer', inMenu: false },
  { sleutel: 'bedrijf', pad: '/beheer/bedrijf', label: 'Bedrijf en huisregels', uitleg: 'KvK, btw, contact en de teksten voor je leden', groep: 'beheer', inMenu: false },
  { sleutel: 'lidmaatschappen', pad: '/beheer/lidmaatschappen', label: 'Lidmaatschappen en labels', uitleg: 'Vormen uit Sportivity met hun toegang, en labels voor leden', groep: 'beheer', inMenu: false },
  { sleutel: 'sluiting', pad: '/beheer/sluiting', label: 'Sluitingsdagen', uitleg: 'Feestdagen, sluitingen en andere openingstijden', groep: 'beheer', inMenu: false },
]

/** Is dit onderdeel actief op dit pad? */
export function isActief(onderdeel: Onderdeel, pad: string): boolean {
  const basis = `/clubkane${onderdeel.pad}`
  if (onderdeel.pad === '') return pad === '/clubkane' || pad === '/clubkane/'
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

export function inMenu(onderdeel: Onderdeel): boolean {
  return onderdeel.inMenu !== false
}

const INSTELLINGEN = ONDERDELEN.find((o) => o.sleutel === 'beheer') as Onderdeel

/** Het menu-onderdeel dat oplicht op dit pad: een instel-pagina valt onder Instellingen. */
export function menuOnderdeel(pad: string): Onderdeel {
  const o = actiefOnderdeel(pad)
  return inMenu(o) ? o : INSTELLINGEN
}

/**
 * De onderdelen van een groep in het menu, in vaste volgorde. Instellingen staat
 * erin als de persoon iets in het instellingencentrum mag (`instellingen`, zie
 * heeftInstellingen in instel-paginas.ts); standaard alleen bij alle rechten.
 */
export function onderdelenVan(groep: GroepSleutel, uit: readonly Module[] = [], toegestaan: readonly string[] | null = null, instellingen: boolean = toegestaan === null): Onderdeel[] {
  return ONDERDELEN.filter((o) => o.groep === groep && inMenu(o) && (o === INSTELLINGEN ? instellingen : isZichtbaar(o, uit, toegestaan)))
}

/** De groepen met minstens een onderdeel in het menu. */
export function groepenMet(uit: readonly Module[] = [], toegestaan: readonly string[] | null = null, instellingen: boolean = toegestaan === null): (typeof GROEPEN)[number][] {
  return GROEPEN.filter((g) => onderdelenVan(g.sleutel, uit, toegestaan, instellingen).length > 0)
}

// ── Onderbalk (telefoon en tablet staand) ────────────────────────────────────
// Besluit Kane (20-10-2026): de trainer op de vloer moet het makkelijk hebben.
// Onder in beeld staan de vier onderdelen die deze persoon het meest nodig heeft,
// plus Meer (het menupaneel met alles). Vaste volgorde op basis van de rechten,
// niet op gebruik: een knop die verspringt kost meer dan hij oplevert.

/** Volgorde van belang op de werkvloer; de eerste vier die iemand mag, komen in de onderbalk. */
export const ONDERBALK_VOLGORDE: readonly string[] = ['vandaag', 'checkin', 'leden', 'schemas', 'rooster', 'taken', 'personeel', 'afspraken', 'opvolgen', 'leads', 'agenda', 'voeding', 'notities']

export const ONDERBALK_MAX = 4

/** De onderdelen in de onderbalk voor deze persoon (zonder Meer). */
export function onderbalkOnderdelen(uit: readonly Module[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  return ONDERBALK_VOLGORDE.map((s) => ONDERDELEN.find((o) => o.sleutel === s))
    .filter((o): o is Onderdeel => !!o && isZichtbaar(o, uit, toegestaan))
    .slice(0, ONDERBALK_MAX)
}

// ── Sneltoetsen (pc) ─────────────────────────────────────────────────────────

/** Het onderdeel achter G en dan deze letter, als deze persoon het in het menu heeft. */
export function onderdeelVoorToets(letter: string, uit: readonly Module[] = [], toegestaan: readonly string[] | null = null, instellingen: boolean = toegestaan === null): Onderdeel | null {
  const l = letter.toLowerCase()
  const o = ONDERDELEN.find((x) => x.toets === l && inMenu(x))
  if (!o) return null
  return onderdelenVan(o.groep, uit, toegestaan, instellingen).includes(o) ? o : null
}

/** De toets als tekst voor in beeld, bijvoorbeeld "G L". */
export function toetsTekst(o: Pick<Onderdeel, 'toets'>): string | null {
  return o.toets ? `G ${o.toets.toUpperCase()}` : null
}
