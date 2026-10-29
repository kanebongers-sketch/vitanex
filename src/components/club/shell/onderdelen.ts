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
// Minder tabbladen (besluit Kane 27-10-2026): Check-in en Opvolgen zijn een
// sectie op Vandaag (sectie: het anker), geen eigen tab. Hun rechtensleutels
// blijven, net als hun volledige schermen (schermen), voor diepe links en API.
// Taken heeft weer een eigen tab in Werkvloer (besluit Kane 28-10-2026: de
// poetsroosters en dagelijkse taken waren niet te vinden); de sectie met de
// taken van vandaag blijft daarnaast op Vandaag staan (TakenSectie).

import type { Module } from '@/lib/club/kern/organisatie'
import { zichtbaar, type Verborgen } from '@/lib/club/kern/pakketten'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'

// De Nederlandse namen komen uit het woordenboek (bron); in beeld altijd via
// onderdeelInTaal(), groepInTaal() en schermInTaal().
const G = MENU.nl.groepen
const O = MENU.nl.onderdelen
const S = MENU.nl.schermen

export const GROEPEN = [
  { sleutel: 'werkvloer', label: G.werkvloer.label, uitleg: G.werkvloer.uitleg },
  { sleutel: 'leden', label: G.leden.label, uitleg: G.leden.uitleg },
  { sleutel: 'planning', label: G.planning.label, uitleg: G.planning.uitleg },
  { sleutel: 'coaching', label: G.coaching.label, uitleg: G.coaching.uitleg },
  { sleutel: 'beheer', label: G.beheer.label, uitleg: G.beheer.uitleg },
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
  /** Extra zoekwoorden voor het zoekveld (Ctrl K), bijvoorbeeld "poetsrooster" bij Taken. */
  trefwoorden?: string
  /** Staat als sectie op Vandaag met dit anker (/club#anker), niet als tab in het menu. */
  sectie?: string
  /** Volledige schermen achter dit onderdeel of deze sectie (te vinden via zoeken). */
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
  { sleutel: 'vandaag', pad: '', label: O.vandaag.label, uitleg: O.vandaag.uitleg, groep: 'werkvloer', toets: 'v' },
  { sleutel: 'checkin', pad: '/checkin', label: O.checkin.label, uitleg: O.checkin.uitleg, groep: 'werkvloer', module: 'checkin', toets: 'c', sectie: 'checkin',
    schermen: [
      { id: 'balie', label: S.balie.label, uitleg: S.balie.uitleg, pad: '/checkin' },
      { id: 'kiosk', label: S.kiosk.label, uitleg: S.kiosk.uitleg, pad: '/checkin/kiosk' },
    ] },
  { sleutel: 'taken', pad: '/taken', label: O.taken.label, uitleg: O.taken.uitleg, groep: 'werkvloer', module: 'taken', toets: 'k',
    trefwoorden: 'poetsrooster poetslijst poetsen schoonmaak dagtaken dagelijkse taken afsluitronde excel',
    schermen: [
      { id: 'week', label: S.week.label, uitleg: S.week.uitleg, pad: '/taken/week' },
      { id: 'overzicht', label: S.overzicht.label, uitleg: S.overzicht.uitleg, pad: '/taken/overzicht' },
      { id: 'beheer', label: S.beheer.label, uitleg: S.beheer.uitleg, pad: '/taken/beheer' },
    ] },
  { sleutel: 'opvolgen', pad: '/opvolgen', label: O.opvolgen.label, uitleg: O.opvolgen.uitleg, groep: 'werkvloer', toets: 'o', sectie: 'opvolgen',
    schermen: [
      { id: 'lijst', label: S.lijst.label, uitleg: S.lijst.uitleg, pad: '/opvolgen' },
    ] },
  { sleutel: 'notities', pad: '/notities', label: O.notities.label, uitleg: O.notities.uitleg, groep: 'werkvloer', toets: 'n' },
  { sleutel: 'leden', pad: '/leden', label: O.leden.label, uitleg: O.leden.uitleg, groep: 'leden', module: 'leden', toets: 'l' },
  { sleutel: 'leads', pad: '/leads', label: O.leads.label, uitleg: O.leads.uitleg, groep: 'leden', module: 'leads', toets: 'e' },
  { sleutel: 'berichten', pad: '/berichten', label: O.berichten.label, uitleg: O.berichten.uitleg, groep: 'leden', toets: 'b' },
  { sleutel: 'community', pad: '/community', label: O.community.label, uitleg: O.community.uitleg, groep: 'leden', module: 'app' },
  { sleutel: 'challenges', pad: '/challenges', label: O.challenges.label, uitleg: O.challenges.uitleg, groep: 'leden' },
  { sleutel: 'rooster', pad: '/rooster', label: O.rooster.label, uitleg: O.rooster.uitleg, groep: 'planning', module: 'rooster', toets: 'r' },
  { sleutel: 'afspraken', pad: '/afspraken', label: O.afspraken.label, uitleg: O.afspraken.uitleg, groep: 'planning', module: 'afspraken', toets: 'a' },
  { sleutel: 'personeel', pad: '/personeel', label: O.personeel.label, uitleg: O.personeel.uitleg, groep: 'planning', module: 'personeel', toets: 'p' },
  { sleutel: 'agenda', pad: '/agenda', label: O.agenda.label, uitleg: O.agenda.uitleg, groep: 'planning' },
  { sleutel: 'schemas', pad: '/training', label: O.schemas.label, uitleg: O.schemas.uitleg, groep: 'coaching', module: 'training', toets: 't' },
  { sleutel: 'voeding', pad: '/voeding', label: O.voeding.label, uitleg: O.voeding.uitleg, groep: 'coaching' },
  { sleutel: 'cijfers', pad: '/cijfers', label: O.cijfers.label, uitleg: O.cijfers.uitleg, groep: 'beheer', module: 'cijfers' },
  { sleutel: 'rapporten', pad: '/rapporten', label: O.rapporten.label, uitleg: O.rapporten.uitleg, groep: 'beheer' },
  { sleutel: 'beheer', pad: '/beheer', label: O.beheer.label, uitleg: O.beheer.uitleg, groep: 'beheer', toets: 'i', hulpbalk: true },
  { sleutel: 'hulp', pad: '/hulp', label: O.hulp.label, uitleg: O.hulp.uitleg, groep: 'beheer', toets: 'h', hulpbalk: true },
  // Alleen via het instellingencentrum (en het zoekveld); wel hier voor de rechten per rol.
  { sleutel: 'instellingen', pad: '/instellingen', label: O.instellingen.label, uitleg: O.instellingen.uitleg, groep: 'beheer', inMenu: false },
  { sleutel: 'app', pad: '/app', label: O.app.label, uitleg: O.app.uitleg, groep: 'beheer', module: 'app', hulpbalk: true },
  { sleutel: 'start', pad: '/start', label: O.start.label, uitleg: O.start.uitleg, groep: 'beheer', inMenu: false },
  { sleutel: 'huisstijl', pad: '/huisstijl', label: O.huisstijl.label, uitleg: O.huisstijl.uitleg, groep: 'beheer', inMenu: false },
  { sleutel: 'bedrijf', pad: '/beheer/bedrijf', label: O.bedrijf.label, uitleg: O.bedrijf.uitleg, groep: 'beheer', inMenu: false },
  { sleutel: 'lidmaatschappen', pad: '/beheer/lidmaatschappen', label: O.lidmaatschappen.label, uitleg: O.lidmaatschappen.uitleg, groep: 'beheer', inMenu: false },
  { sleutel: 'sluiting', pad: '/beheer/sluiting', label: O.sluiting.label, uitleg: O.sluiting.uitleg, groep: 'beheer', inMenu: false },
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
 * Staat dit onderdeel aan bij deze sportschool (en is het pakket afgenomen), en mag deze persoon het zien?
 * `toegestaan` null = alles (Kane en de eigenaar); anders de sleutels die de
 * eigenaar aan de rol gaf (zie src/lib/club/beheerders/rechten.ts).
 */
export function isZichtbaar(onderdeel: Onderdeel, uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null): boolean {
  if (!magOnderdeel(toegestaan, onderdeel.sleutel)) return false
  // Uit gezet door de sportschool, of het pakket is niet afgenomen (kern/pakketten.ts).
  return zichtbaar(uit, onderdeel)
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
export function sectiesVoor(uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  if (!isZichtbaar(VANDAAG, uit, toegestaan)) return []
  return ONDERDELEN.filter((o) => o.sectie && isZichtbaar(o, uit, toegestaan))
}

/** De onderdelen van een groep in het menu, in vaste volgorde. */
export function onderdelenVan(groep: GroepSleutel, uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  return ONDERDELEN.filter((o) => o.groep === groep && inMenu(o) && isZichtbaar(o, uit, toegestaan))
}

/** De groepen met minstens een onderdeel in het menu. */
export function groepenMet(uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null): (typeof GROEPEN)[number][] {
  return GROEPEN.filter((g) => onderdelenVan(g.sleutel, uit, toegestaan).length > 0)
}

// ── Onderbalk (telefoon en tablet staand) ────────────────────────────────────
// Besluit Kane (20-10-2026): de trainer op de vloer moet het makkelijk hebben.
// Onder in beeld staan de vier onderdelen die deze persoon het meest nodig heeft,
// plus Meer (het menupaneel met alles). Check-in en Opvolgen staan op Vandaag
// (de eerste knop), dus niet apart in de balk; Taken staat in Meer onder Werkvloer. Vaste volgorde op basis van de rechten,
// niet op gebruik: een knop die verspringt kost meer dan hij oplevert.

/** Volgorde van belang op de werkvloer; de eerste vier die iemand mag, komen in de onderbalk. */
export const ONDERBALK_VOLGORDE: readonly string[] = ['vandaag', 'leden', 'schemas', 'rooster', 'personeel', 'afspraken', 'leads', 'agenda', 'voeding', 'notities']

export const ONDERBALK_MAX = 4

/** De onderdelen in de onderbalk voor deze persoon (zonder Meer). */
export function onderbalkOnderdelen(uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
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
export function onderdeelVoorToets(letter: string, uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null, instellingen: boolean = toegestaan === null): Onderdeel | null {
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

// ── Taal ─────────────────────────────────────────────────────────────────────

/** Een onderdeel met naam en uitleg in de gekozen taal. */
export function onderdeelInTaal<T extends Pick<Onderdeel, 'sleutel' | 'label' | 'uitleg'>>(o: T, taal: Taal): T {
  const t = MENU[taal].onderdelen[o.sleutel as keyof typeof O]
  return t ? { ...o, label: t.label, uitleg: t.uitleg } : o
}

/** Een groep met naam en uitleg in de gekozen taal. */
export function groepInTaal<T extends { sleutel: GroepSleutel; label: string; uitleg: string }>(g: T, taal: Taal): T {
  const t = MENU[taal].groepen[g.sleutel]
  return { ...g, label: t.label, uitleg: t.uitleg }
}

/** Een volledig scherm met naam en uitleg in de gekozen taal. */
export function schermInTaal(s: Scherm, taal: Taal): Scherm {
  const t = MENU[taal].schermen[s.id as keyof typeof S]
  return t ? { ...s, label: t.label, uitleg: t.uitleg } : s
}
