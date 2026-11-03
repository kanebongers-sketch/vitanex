// ─── Club: vijf plekken en hun schermen (PUUR) ──────────────────────────────
// Een lijst voor de navigatie, het zoekveld en de rechten per rol.
// Opdracht Kane (03-11-2026): "ik moet iemand in 10 minuten de volledige app
// kunnen uitleggen" (ontwerp docs/club/EENVOUD-10-MINUTEN.md). Alles staat op
// vijf vaste plekken, op de pc bovenin en op de telefoon onderin, in dezelfde
// volgorde: Vandaag, Leden, Rooster, Training en Beheer. Elke plek heeft
// hoogstens drie schermen in het menu. Hulp (met Wat is nieuw) en je naam
// (vestiging, taal, uitloggen) staan rechts in de kop; er is geen hulpbalk meer.
//
// Een onderdeel is een rechtensleutel met een pad. Het staat op een van vier manieren:
// - in het menu: een scherm van zijn plek (inMenu);
// - als sectie op Vandaag (sectie: het anker, zoals Check-in en Opvolgen);
// - onder een ander scherm (onder: de sleutel van dat scherm, zoals Berichten
//   onder Ledenapp en Rapporten onder Cijfers). Mag iemand het scherm erboven
//   niet zien maar dit wel, dan staat dit onderdeel in het menu in zijn plaats,
//   zodat geen functie verdwijnt;
// - in het instellingencentrum (inMenu: false; het menu licht dan Beheer ·
//   Instellingen op) of in de kop (kop: true, alleen Hulp).
// Elk onderdeel blijft via zoeken (Ctrl K) te vinden en elk pad blijft werken.

import type { Module } from '@/lib/club/kern/organisatie'
import { zichtbaar, type Verborgen } from '@/lib/club/kern/pakketten'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { ONDERDEEL_SLEUTELS } from '@/lib/club/kern/org-instellingen'
import type { GebruikStand } from '@/lib/club/menu/in-gebruik'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'

// De Nederlandse namen komen uit het woordenboek (bron); in beeld altijd via
// plekInTaal(), onderdeelInTaal() en schermInTaal().
const P = MENU.nl.plekken
const G = MENU.nl.groepen
const O = MENU.nl.onderdelen
const S = MENU.nl.schermen

export const PLEKKEN = [
  { sleutel: 'vandaag', label: P.vandaag.label, uitleg: P.vandaag.uitleg, toets: 'v' },
  { sleutel: 'leden', label: P.leden.label, uitleg: P.leden.uitleg, toets: 'l' },
  { sleutel: 'rooster', label: P.rooster.label, uitleg: P.rooster.uitleg, toets: 'r' },
  { sleutel: 'training', label: P.training.label, uitleg: P.training.uitleg, toets: 't' },
  { sleutel: 'beheer', label: P.beheer.label, uitleg: P.beheer.uitleg, toets: 'b' },
] as const

export type PlekSleutel = (typeof PLEKKEN)[number]['sleutel']
export type Plek = (typeof PLEKKEN)[number]

/** Hoogstens zoveel schermen per plek in het menu. */
export const MAX_SCHERMEN = 3

/**
 * De oude indeling in vijf groepen (Werkvloer, Leden, Planning, Coaching,
 * Beheer). Club zelf gebruikt hem niet meer; alleen de websiteschermen
 * (src/components/aiyourgym/mockups) tekenen er nog mee, tot die mee zijn.
 */
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
  /** De plek waar dit onderdeel woont. */
  plek: PlekSleutel
  /** De oude groep, alleen nog voor de websiteschermen (zie GROEPEN). */
  groep: GroepSleutel
  /** Het onderdeel dat een sportschool uit kan zetten (zie het huisstijl-portaal). Zonder: altijd aan. */
  module?: Module
  /** false: niet in het menu, alleen via het instellingencentrum (wel in de rechten en het zoekveld). */
  inMenu?: false
  /** true: in de kop rechtsboven (Hulp), niet in het menu. */
  kop?: true
  /** Woont onder dit scherm (sleutel); in het menu alleen in zijn plaats als iemand dat scherm niet ziet. */
  onder?: string
  /** Sneltoets op de pc: G en dan deze letter (bijvoorbeeld G dan K voor Taken). */
  toets?: string
  /** Extra zoekwoorden voor het zoekveld (Ctrl K), ook oude namen (Werkvloer, Rapporten). */
  trefwoorden?: string
  /** Staat als sectie op Vandaag met dit anker (/club#anker), niet als scherm in het menu. */
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

/**
 * Het Prikbord (mededelingen, werkwijzen en notities) staat in het menu zodra
 * de sleutel `prikbord` als onderdeel bestaat (ONDERDEEL_SLEUTELS, rechten en
 * pakket). Tot dan staat Notities zelf op die plek.
 */
export const PRIKBORD_KLAAR = (ONDERDEEL_SLEUTELS as readonly string[]).includes('prikbord')

const PRIKBORD: readonly Onderdeel[] = PRIKBORD_KLAAR
  ? [{ sleutel: 'prikbord', pad: '/prikbord', label: O.prikbord.label, uitleg: O.prikbord.uitleg, plek: 'vandaag', groep: 'werkvloer', toets: 'n', trefwoorden: 'mededelingen werkwijzen protocollen updates team notities' }]
  : []

const NOTITIES: Onderdeel = PRIKBORD_KLAAR
  ? { sleutel: 'notities', pad: '/notities', label: O.notities.label, uitleg: O.notities.uitleg, plek: 'vandaag', groep: 'werkvloer', onder: 'prikbord', trefwoorden: 'kladblok overdracht' }
  : { sleutel: 'notities', pad: '/notities', label: O.notities.label, uitleg: O.notities.uitleg, plek: 'vandaag', groep: 'werkvloer', toets: 'n', trefwoorden: 'kladblok overdracht prikbord' }

export const ONDERDELEN: readonly Onderdeel[] = [
  // Vandaag · Vandaag, Taken, Prikbord (of Notities)
  { sleutel: 'vandaag', pad: '', label: O.vandaag.label, uitleg: O.vandaag.uitleg, plek: 'vandaag', groep: 'werkvloer', trefwoorden: 'werkvloer dagscherm' },
  { sleutel: 'checkin', pad: '/checkin', label: O.checkin.label, uitleg: O.checkin.uitleg, plek: 'vandaag', groep: 'werkvloer', module: 'checkin', toets: 'c', sectie: 'checkin',
    schermen: [
      { id: 'balie', label: S.balie.label, uitleg: S.balie.uitleg, pad: '/checkin' },
      { id: 'kiosk', label: S.kiosk.label, uitleg: S.kiosk.uitleg, pad: '/checkin/kiosk' },
    ] },
  { sleutel: 'taken', pad: '/taken', label: O.taken.label, uitleg: O.taken.uitleg, plek: 'vandaag', groep: 'werkvloer', module: 'taken', toets: 'k',
    trefwoorden: 'poetsrooster poetslijst poetsen schoonmaak dagtaken dagelijkse taken afsluitronde excel',
    schermen: [
      { id: 'week', label: S.week.label, uitleg: S.week.uitleg, pad: '/taken/week' },
      { id: 'overzicht', label: S.overzicht.label, uitleg: S.overzicht.uitleg, pad: '/taken/overzicht' },
      { id: 'beheer', label: S.beheer.label, uitleg: S.beheer.uitleg, pad: '/taken/beheer' },
    ] },
  { sleutel: 'opvolgen', pad: '/opvolgen', label: O.opvolgen.label, uitleg: O.opvolgen.uitleg, plek: 'vandaag', groep: 'werkvloer', toets: 'o', sectie: 'opvolgen', trefwoorden: 'bellen',
    schermen: [
      { id: 'lijst', label: S.lijst.label, uitleg: S.lijst.uitleg, pad: '/opvolgen' },
    ] },
  ...PRIKBORD,
  NOTITIES,
  // Leden · Leden, Leads, Ledenapp
  { sleutel: 'leden', pad: '/leden', label: O.leden.label, uitleg: O.leden.uitleg, plek: 'leden', groep: 'leden', module: 'leden' },
  { sleutel: 'leads', pad: '/leads', label: O.leads.label, uitleg: O.leads.uitleg, plek: 'leden', groep: 'leden', module: 'leads', toets: 'e' },
  { sleutel: 'app', pad: '/app', label: O.app.label, uitleg: O.app.uitleg, plek: 'leden', groep: 'beheer', module: 'app', trefwoorden: 'ledenapp bekijken voorvertoning voorbeeld telefoon poster qr uitnodigen' },
  { sleutel: 'berichten', pad: '/berichten', label: O.berichten.label, uitleg: O.berichten.uitleg, plek: 'leden', groep: 'leden', onder: 'app', trefwoorden: 'nieuws ledenapp' },
  { sleutel: 'community', pad: '/community', label: O.community.label, uitleg: O.community.uitleg, plek: 'leden', groep: 'leden', module: 'app', onder: 'app', trefwoorden: 'ledenapp groepen' },
  { sleutel: 'challenges', pad: '/challenges', label: O.challenges.label, uitleg: O.challenges.uitleg, plek: 'leden', groep: 'leden', onder: 'app', trefwoorden: 'ledenapp badges' },
  // Rooster · Lessen, Agenda, Diensten
  { sleutel: 'rooster', pad: '/rooster', label: O.rooster.label, uitleg: O.rooster.uitleg, plek: 'rooster', groep: 'planning', module: 'rooster', trefwoorden: 'groepslessen lesrooster weekrooster planning' },
  { sleutel: 'agenda', pad: '/agenda', label: O.agenda.label, uitleg: O.agenda.uitleg, plek: 'rooster', groep: 'planning', toets: 'a', trefwoorden: 'planning' },
  { sleutel: 'afspraken', pad: '/afspraken', label: O.afspraken.label, uitleg: O.afspraken.uitleg, plek: 'rooster', groep: 'planning', module: 'afspraken', onder: 'agenda', trefwoorden: 'intake personal training pt' },
  { sleutel: 'personeel', pad: '/personeel', label: O.personeel.label, uitleg: O.personeel.uitleg, plek: 'rooster', groep: 'planning', module: 'personeel', toets: 'p', trefwoorden: 'personeel personeelsrooster uren planning' },
  // Training · Schema's, Voeding
  { sleutel: 'schemas', pad: '/training', label: O.schemas.label, uitleg: O.schemas.uitleg, plek: 'training', groep: 'coaching', module: 'training', trefwoorden: 'training coaching sjablonen bibliotheek' },
  { sleutel: 'voeding', pad: '/voeding', label: O.voeding.label, uitleg: O.voeding.uitleg, plek: 'training', groep: 'coaching' },
  // Beheer · Cijfers, Instellingen
  { sleutel: 'cijfers', pad: '/cijfers', label: O.cijfers.label, uitleg: O.cijfers.uitleg, plek: 'beheer', groep: 'beheer', module: 'cijfers' },
  { sleutel: 'rapporten', pad: '/rapporten', label: O.rapporten.label, uitleg: O.rapporten.uitleg, plek: 'beheer', groep: 'beheer', onder: 'cijfers', trefwoorden: 'exporteren export excel' },
  { sleutel: 'beheer', pad: '/beheer', label: O.beheer.label, uitleg: O.beheer.uitleg, plek: 'beheer', groep: 'beheer', toets: 'i', trefwoorden: 'instellingencentrum hulpbalk' },
  // In de kop rechtsboven.
  { sleutel: 'hulp', pad: '/hulp', label: O.hulp.label, uitleg: O.hulp.uitleg, plek: 'beheer', groep: 'beheer', toets: 'h', kop: true },
  // Alleen via het instellingencentrum (en het zoekveld); wel hier voor de rechten per rol.
  { sleutel: 'instellingen', pad: '/instellingen', label: O.instellingen.label, uitleg: O.instellingen.uitleg, plek: 'beheer', groep: 'beheer', inMenu: false },
  { sleutel: 'start', pad: '/start', label: O.start.label, uitleg: O.start.uitleg, plek: 'beheer', groep: 'beheer', inMenu: false },
  { sleutel: 'huisstijl', pad: '/huisstijl', label: O.huisstijl.label, uitleg: O.huisstijl.uitleg, plek: 'beheer', groep: 'beheer', inMenu: false },
  { sleutel: 'bedrijf', pad: '/beheer/bedrijf', label: O.bedrijf.label, uitleg: O.bedrijf.uitleg, plek: 'beheer', groep: 'beheer', inMenu: false },
  { sleutel: 'lidmaatschappen', pad: '/beheer/lidmaatschappen', label: O.lidmaatschappen.label, uitleg: O.lidmaatschappen.uitleg, plek: 'beheer', groep: 'beheer', inMenu: false },
  { sleutel: 'sluiting', pad: '/beheer/sluiting', label: O.sluiting.label, uitleg: O.sluiting.uitleg, plek: 'beheer', groep: 'beheer', inMenu: false },
]

const PER_SLEUTEL = new Map(ONDERDELEN.map((o) => [o.sleutel, o]))

/** Het onderdeel met deze sleutel. */
export function onderdeelVan(sleutel: string): Onderdeel | undefined {
  return PER_SLEUTEL.get(sleutel)
}

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

/** Is dit onderdeel een eigen scherm in het menu (geen sectie, niet onder een ander, niet in de kop of het centrum)? */
export function inMenu(onderdeel: Onderdeel): boolean {
  return onderdeel.inMenu !== false && !onderdeel.kop && !onderdeel.sectie && !onderdeel.onder
}

/** Waar een onderdeel heen gaat: een sectie op Vandaag als anker (#checkin), anders zijn pad. */
export function onderdeelPad(onderdeel: Pick<Onderdeel, 'pad' | 'sectie'>): string {
  return onderdeel.sectie ? `#${onderdeel.sectie}` : onderdeel.pad
}

/** Vandaag, waar de secties op staan, en Instellingen, waar het centrum begint. */
const VANDAAG = ONDERDELEN[0]
const INSTELLINGEN = ONDERDELEN.find((o) => o.sleutel === 'beheer') as Onderdeel

function onderPad(pad: string, basis: string): boolean {
  return pad === basis || pad.startsWith(`${basis}/`)
}

/**
 * Het scherm in het menu dat oplicht op dit pad, of null buiten het menu
 * (Hulp en Wat is nieuw in de kop, het platform, onbekende paden). Op een
 * volledig scherm van een sectie (de takenweek, de balie) licht Vandaag op, op
 * een onderdeel onder een ander scherm dat scherm (Berichten: Ledenapp), en
 * in het hele instellingencentrum (en Koppelingen) Beheer · Instellingen.
 */
export function menuOnderdeel(pad: string): Onderdeel | null {
  if (onderPad(pad, '/club/koppelingen')) return INSTELLINGEN
  const o = actiefOnderdeel(pad)
  if (!isActief(o, pad) || o.kop) return null
  if (o.sectie) return VANDAAG
  if (o.onder) return onderdeelVan(o.onder) ?? null
  if (o.inMenu === false) return INSTELLINGEN
  return o
}

/** De plek waar je bent op dit pad, of null (Hulp, platform, onbekend). */
export function plekOp(pad: string): PlekSleutel | null {
  return menuOnderdeel(pad)?.plek ?? null
}

/** Is dit menuscherm het scherm waar je bent (ook als het in de plaats van zijn bovenliggende scherm staat)? */
export function isHier(o: Onderdeel, pad: string): boolean {
  const hier = menuOnderdeel(pad)
  if (!hier) return false
  return o.sleutel === hier.sleutel || o.sleutel === actiefOnderdeel(pad).sleutel
}

/** De secties op Vandaag die deze persoon ziet, in vaste volgorde. */
export function sectiesVoor(uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  if (!isZichtbaar(VANDAAG, uit, toegestaan)) return []
  return ONDERDELEN.filter((o) => o.sectie && isZichtbaar(o, uit, toegestaan))
}

// ── Schermen per plek ────────────────────────────────────────────────────────

/** Wat het menu van een persoon bepaalt, naast de pakketten en de rechten. */
export interface MenuOpties {
  /** Mag deze persoon iets instellen (heeftInstellingen)? Standaard alleen met alle rechten. */
  instellingen?: boolean
  /** Schermen die nog nooit gebruikt zijn (zie inGebruik); die staan er niet, tenzij je er bent. */
  nogLeeg?: readonly string[]
  /** Het pad waar je nu bent: een nog leeg scherm blijft dan staan. */
  pad?: string
}

/** Mag deze persoon dit menuscherm zien? Instellingen volgt `instellingen`, de rest de rechten. */
function magScherm(o: Onderdeel, uit: readonly Verborgen[], toegestaan: readonly string[] | null, instellingen: boolean): boolean {
  if (o.sleutel === INSTELLINGEN.sleutel) return instellingen
  return isZichtbaar(o, uit, toegestaan)
}

/**
 * De schermen van een plek in het menu, in vaste volgorde, hoogstens drie.
 * Mag iemand een scherm niet zien maar een onderdeel eronder wel (een trainer
 * met Afspraken maar zonder Agenda), dan staat het eerste daarvan in zijn
 * plaats. Een nog leeg scherm (verbergen tot gebruikt) valt weg, behalve als
 * je er nu bent of als de plek anders leeg wordt.
 */
export function schermenVan(plek: PlekSleutel, uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null, opties: MenuOpties = {}): Onderdeel[] {
  const instellingen = opties.instellingen ?? toegestaan === null
  const alle = ONDERDELEN.filter((o) => o.plek === plek && inMenu(o)).flatMap((o) => {
    if (magScherm(o, uit, toegestaan, instellingen)) return [o]
    const kind = ONDERDELEN.find((k) => k.onder === o.sleutel && isZichtbaar(k, uit, toegestaan))
    return kind ? [kind] : []
  })
  const leeg = new Set(opties.nogLeeg ?? [])
  const pad = opties.pad
  const gebruikt = alle.filter((o) => !leeg.has(o.sleutel) || (pad !== undefined && isHier(o, pad)))
  return (gebruikt.length > 0 ? gebruikt : alle).slice(0, MAX_SCHERMEN)
}

/** De plekken met minstens een scherm voor deze persoon. */
export function plekkenMet(uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null, opties: MenuOpties = {}): Plek[] {
  return PLEKKEN.filter((p) => schermenVan(p.sleutel, uit, toegestaan, opties).length > 0)
}

/** Het eerste scherm van een plek: daar brengt de plek je heen. */
export function plekStart(plek: PlekSleutel, uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null, opties: MenuOpties = {}): Onderdeel | null {
  return schermenVan(plek, uit, toegestaan, opties)[0] ?? null
}

const GEBRUIK: Readonly<Record<string, (s: GebruikStand) => number | null>> = {
  taken: (s) => s.takenlijsten,
  prikbord: (s) => s.prikbord,
}

/**
 * Is dit scherm al in gebruik (staat er iets in)? Alleen Taken en het Prikbord
 * wachten tot het eerste item; de rest staat er altijd (dat regelen de
 * pakketten). Onbekend telt als in gebruik: liever een scherm te veel dan een kwijt.
 */
export function inGebruik(sleutel: string, stand: GebruikStand): boolean {
  if (stand.allesTonen) return true
  const aantal = GEBRUIK[sleutel]?.(stand)
  return aantal === undefined || aantal === null || aantal > 0
}

/** De sleutels die nog leeg zijn, voor MenuOpties.nogLeeg. */
export function nogLeeg(stand: GebruikStand): string[] {
  return Object.keys(GEBRUIK).filter((s) => onderdeelVan(s) && !inGebruik(s, stand))
}

// ── Onderbalk (telefoon en tablet staand) ────────────────────────────────────
// Dezelfde vijf plekken als bovenin op de pc, in dezelfde volgorde, zonder Meer:
// vijf past precies onder de duim. Met een plek is er geen onderbalk.

/** De plekken in de onderbalk; leeg als er maar een is. */
export function onderbalkPlekken(uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null, opties: MenuOpties = {}): Plek[] {
  const plekken = plekkenMet(uit, toegestaan, opties)
  return plekken.length > 1 ? plekken : []
}

// ── Sneltoetsen (pc) ─────────────────────────────────────────────────────────
// G en dan een letter. V, L, R, T en B openen de plekken; de oude letters
// blijven en openen hun scherm (G K Taken, G E Leads, G A Agenda, G N Prikbord
// of Notities, G I Instellingen, G H Hulp, G C en G O de secties op Vandaag).

/**
 * Het pad (binnen /club) achter G en dan deze letter, of null als deze persoon
 * daar niet mag komen. Instellingen (G I) volgt `instellingen`.
 */
export function doelVoorToets(letter: string, uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null, instellingen: boolean = toegestaan === null): string | null {
  const l = letter.toLowerCase()
  const plek = PLEKKEN.find((p) => p.toets === l)
  if (plek) {
    const start = plekStart(plek.sleutel, uit, toegestaan, { instellingen })
    return start ? onderdeelPad(start) : null
  }
  const o = ONDERDELEN.find((x) => x.toets === l)
  if (!o) return null
  if (o.sleutel === INSTELLINGEN.sleutel) return instellingen ? o.pad : null
  if (o.sectie) return sectiesVoor(uit, toegestaan).includes(o) ? onderdeelPad(o) : null
  return isZichtbaar(o, uit, toegestaan) ? o.pad : null
}

/** De toets als tekst voor in beeld, bijvoorbeeld "G K". */
export function toetsTekst(o: { toets?: string }): string | null {
  return o.toets ? `G ${o.toets.toUpperCase()}` : null
}

// ── Taal ─────────────────────────────────────────────────────────────────────

/** Een onderdeel met naam en uitleg in de gekozen taal. */
export function onderdeelInTaal<T extends Pick<Onderdeel, 'sleutel' | 'label' | 'uitleg'>>(o: T, taal: Taal): T {
  const t = MENU[taal].onderdelen[o.sleutel as keyof typeof O]
  return t ? { ...o, label: t.label, uitleg: t.uitleg } : o
}

/** Een plek met naam en uitleg in de gekozen taal. */
export function plekInTaal<T extends { sleutel: PlekSleutel; label: string; uitleg: string }>(p: T, taal: Taal): T {
  const t = MENU[taal].plekken[p.sleutel]
  return { ...p, label: t.label, uitleg: t.uitleg }
}

/** Een volledig scherm met naam en uitleg in de gekozen taal. */
export function schermInTaal(s: Scherm, taal: Taal): Scherm {
  const t = MENU[taal].schermen[s.id as keyof typeof S]
  return t ? { ...s, label: t.label, uitleg: t.uitleg } : s
}

// ── Oude indeling (alleen de websiteschermen) ────────────────────────────────

/** Een oude groep met naam en uitleg in de gekozen taal (websiteschermen). */
export function groepInTaal<T extends { sleutel: GroepSleutel; label: string; uitleg: string }>(g: T, taal: Taal): T {
  const t = MENU[taal].groepen[g.sleutel]
  return { ...g, label: t.label, uitleg: t.uitleg }
}

/** Wat in de oude hulpbalk stond of nieuw is, stond niet in het oude menu. */
const OUD_BUITEN_MENU: ReadonlySet<string> = new Set(['app', 'beheer', 'prikbord'])

/** Stond dit onderdeel in het oude menu (websiteschermen)? */
export function inOudMenu(o: Onderdeel): boolean {
  return (inMenu(o) || Boolean(o.onder)) && !OUD_BUITEN_MENU.has(o.sleutel)
}

/** De menuschermen van een oude groep (websiteschermen). Club zelf gebruikt schermenVan. */
export function onderdelenVan(groep: GroepSleutel, uit: readonly Verborgen[] = [], toegestaan: readonly string[] | null = null): Onderdeel[] {
  return ONDERDELEN.filter((o) => o.groep === groep && inOudMenu(o) && isZichtbaar(o, uit, toegestaan))
}
