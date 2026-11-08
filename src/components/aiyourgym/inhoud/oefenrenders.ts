// ─── AI Your Gym: onze eigen Blender-renders van oefeningen (PUUR) ──────────
// Besluit Kane (27-10-2026): oefenbeelden staan alleen achter het inloggen (Club en
// de ledenapp, via components/club/training/repspeler/render-bron.ts), niet meer op
// de openbare website.
// Per oefening een bewegende lus in drie maten (HD, 720 en 480 px, alle op 24
// beelden per seconde) en twee stilstaande beelden (begin en zwaarste punt, HD
// en 480 px), klaargezet door scripts/oefenbeelden-web.mjs in
// public/oefenbeelden/<slug>/. De gegevens (naam, spieren, maten, versie)
// schrijft dat script in oefenrenders.data.ts; dit bestand maakt er een
// getypeerde lijst van.
// Daarnaast losse beelden plus fasen voor de rep-speler (frameUrl) en de
// vloerlijn (vloerY) voor de schaduw.
// Twee figuren (besluit Kane 06-11-2026): "kane" (Fit Factory) en "neutraal" (elke
// andere sportschool en de openbare website), zelfde beweging en zelfde fasen, in
// public/oefenbeelden/neutraal/<slug>/. Staat een oefening nog niet in neutraal,
// dan valt ze terug op de bestaande render. Wie niets kiest krijgt neutraal.
// Geen zware imports: dit bestand gaat mee naar de browser.

import type { Lichaamsdeel } from '@/lib/club/training/3d/typen'
import { OEFENRENDER_DATA } from './oefenrenders.data'

export const OEFENRENDER_MAP = '/oefenbeelden'

/** Hoe een lichaamsdeel uit de 3D-bibliotheek op de website heet. */
export const SPIER_LABEL: Record<Lichaamsdeel, string> = {
  dij: 'Bovenbenen',
  hamstring: 'Hamstrings',
  kuit: 'Kuiten',
  bil: 'Bilspieren',
  romp: 'Romp',
  borst: 'Borst',
  rug: 'Rug',
  onderrug: 'Onderrug',
  schouder: 'Schouders',
  bovenarm: 'Armen',
  onderarm: 'Onderarmen',
}

/** Welk figuur er in de render staat. */
export type OefenFiguur = 'kane' | 'neutraal'

export interface OefenRenderBestand {
  /** Pad vanaf de root van de site, met ?v= zodat een nieuwe render nooit uit de cache komt. */
  src: string
  breedte: number
  hoogte: number
  bytes: number
}

export interface OefenRender {
  slug: string
  /** Het figuur dat deze beelden echt tonen (kane bij terugval). */
  figuur: OefenFiguur
  /** Map van de bestanden vanaf de root van de site. */
  map: string
  /** Naam exact zoals in de oefenbibliotheek van Club. */
  naam: string
  /** Werkende spieren (primair), als label. */
  spieren: readonly string[]
  /** Meewerkende spieren (secundair), als label. */
  spierenSecundair: readonly string[]
  /** Bewegende lus op de volle bronmaat (tot 1440 px), 24 beelden per seconde: retina en grote schermen. */
  lusHd: OefenRenderBestand
  /** Bewegende lus van 720 px: gewone schermen. */
  lus: OefenRenderBestand
  /** Bewegende lus van 480 px: telefoons en kaartjes. */
  lusKlein: OefenRenderBestand
  /** Stilstaand beginbeeld op HD-maat (poster), zelfde uitsnede als de lus. */
  begin: OefenRenderBestand
  beginKlein: OefenRenderBestand
  /** Stilstaand beeld op het zwaarste punt, HD-maat. */
  piek: OefenRenderBestand
  piekKlein: OefenRenderBestand
  /**
   * Vloerlijn als fractie van de hoogte van de uitsnede (0 boven, 1 onder): de
   * rij waar voeten, of bij vloeroefeningen handen, voeten of lichaam, de vloer
   * raken. Hier hoort de schaduw. null bij een render van voor deze gegevens.
   */
  vloerY: number | null
  /** Losse beelden plus fasen voor de rep-speler; null bij een render zonder losse beelden. */
  frames: OefenFrames | null
}

// ─── Losse beelden en fasen voor de rep-speler (besluit Kane 24-10-2026) ────
// Een geanimeerde WebP is niet per beeld te sturen. Daarom staan alle beelden
// van de lus ook los in public/oefenbeelden/<slug>/frames/<maat>/f000.webp, en
// zegt de data welke beelden bij welke fase horen. De speler speelt elke oefening
// in haar eigen uitvoeringstempo (besluit Kane 03-11-2026,
// src/lib/club/training/repspeler/uitvoering.ts), niet in het schematempo.

/** Fasen van een herhaling in volgorde. Samen dekken ze de lus van 0 tot aantal. */
export const FASE_VOLGORDE = ['rust_begin', 'heen', 'houden_ver', 'terug', 'rust_eind'] as const
export type FaseNaam = (typeof FASE_VOLGORDE)[number]
/** Halfopen reeks beeldnummers [van, tot): van telt mee, tot niet. Leeg als van gelijk is aan tot. */
export type FaseReeks = readonly [van: number, tot: number]
/** excentrisch: heen is eerst zakken onder belasting (squat, push-up). concentrisch: heen is eerst omhoog of trekken (curl, deadlift). */
export type HeenIs = 'excentrisch' | 'concentrisch'
/** herhaling: elke lus is een rep. vasthouden: houding blijft staan, de lus is ademen (plank). */
export type BewegingSoort = 'herhaling' | 'vasthouden'

export interface OefenFrameMaat {
  /** Breedte in px (sleutel van de map frames/<maat>/). */
  maat: number
  breedte: number
  hoogte: number
  /** Alle beelden van deze maat samen. */
  bytes: number
}

export interface OefenFrames {
  aantal: number
  fps: number
  /** Voor ?v= zodat nieuwe beelden nooit uit de cache komen. */
  versie: string
  /** Beschikbare maten, klein naar groot. */
  maten: readonly OefenFrameMaat[]
  fasen: Readonly<Record<FaseNaam, FaseReeks>>
  heenIs: HeenIs
  soort: BewegingSoort
  /**
   * Wisselende render (besluit Kane 30-10-2026): de lus is een herhaling links
   * (`fasen`) en daarna een herhaling rechts (`fasenRechts`). null bij een
   * gewone render.
   */
  fasenRechts: Readonly<Record<FaseNaam, FaseReeks>> | null
}

type Data = (typeof OEFENRENDER_DATA)[number]
type Naam = keyof Data['bytes'] & keyof Data['maten']

/** Wat per figuur verschilt aan de lussen en stills. */
interface BeeldSet {
  versie: string
  breedte: number
  hoogte: number
  maten: Readonly<Record<Naam, number>>
  bytes: Readonly<Record<Naam, number>>
}

/** Het blok "neutraal" in de data (scripts/oefenbeelden-web.mjs --figuur neutraal). */
export interface NeutraalData extends BeeldSet {
  vloer_y: number
  frames: { versie: string; maten: Readonly<Record<string, FrameMaatData>> }
}

function bestand(map: string, set: BeeldSet, naam: Naam): OefenRenderBestand {
  const breedte = set.maten[naam]
  return {
    src: `${map}/${naam}.webp?v=${set.versie}`,
    breedte,
    hoogte: Math.round((breedte * set.hoogte) / set.breedte),
    bytes: set.bytes[naam],
  }
}

function bestanden(map: string, set: BeeldSet) {
  return {
    lusHd: bestand(map, set, 'lus-hd'),
    lus: bestand(map, set, 'lus'),
    lusKlein: bestand(map, set, 'lus-klein'),
    begin: bestand(map, set, 'begin'),
    beginKlein: bestand(map, set, 'begin-klein'),
    piek: bestand(map, set, 'piek'),
    piekKlein: bestand(map, set, 'piek-klein'),
  }
}

/** srcset van dezelfde beelden in verschillende maten, klein naar groot. */
export function srcSetVan(bestanden: readonly OefenRenderBestand[]): string {
  return [...bestanden]
    .sort((a, b) => a.breedte - b.breedte)
    .filter((b, i, lijst) => i === 0 || b.breedte > lijst[i - 1].breedte)
    .map((b) => `${b.src} ${b.breedte}w`)
    .join(', ')
}

interface FrameMaatData {
  breedte: number
  hoogte: number
  bytes: number
}

interface FramesData {
  aantal: number
  fps: number
  versie: string
  maten: Readonly<Record<string, FrameMaatData>>
  fasen: Readonly<Record<FaseNaam, readonly number[]>>
  heen_is: string
  soort: string
  wisselend?: boolean
  fasen_rechts?: Readonly<Record<FaseNaam, readonly number[]>>
}

function fasenVan(f: Readonly<Record<FaseNaam, readonly number[]>>): Record<FaseNaam, FaseReeks> {
  return Object.fromEntries(FASE_VOLGORDE.map((n) => [n, [f[n][0], f[n][1]] as const])) as Record<FaseNaam, FaseReeks>
}

function matenVan(maten: Readonly<Record<string, FrameMaatData>>): OefenFrameMaat[] {
  return Object.entries(maten)
    .map(([maat, m]) => ({ maat: Number(maat), breedte: m.breedte, hoogte: m.hoogte, bytes: m.bytes }))
    .sort((a, b) => a.maat - b.maat)
}

function framesVan(d: Data): OefenFrames | null {
  if (!('frames' in d)) return null
  const f = d.frames as FramesData
  return {
    aantal: f.aantal,
    fps: f.fps,
    versie: f.versie,
    maten: matenVan(f.maten),
    fasen: fasenVan(f.fasen),
    heenIs: f.heen_is as HeenIs,
    soort: f.soort as BewegingSoort,
    fasenRechts: f.wisselend && f.fasen_rechts ? fasenVan(f.fasen_rechts) : null,
  }
}

/** De kleinste beschikbare maat van minstens `breedte` px, anders de grootste. */
export function kiesFrameMaat(frames: OefenFrames, breedte: number): OefenFrameMaat {
  return frames.maten.find((m) => m.maat >= breedte) ?? frames.maten[frames.maten.length - 1]
}

/**
 * Pad van een los beeld: <map van de render>/frames/<maat>/f000.webp?v=<versie>.
 * `maat` is een gewenste breedte in px (de dichtstbijzijnde maat erboven wordt
 * gekozen); `index` loopt rond binnen de lus. undefined zonder losse beelden.
 */
export function frameUrl(render: OefenRender, maat: number, index: number): string | undefined {
  const f = render.frames
  if (!f || f.maten.length === 0) return undefined
  const m = kiesFrameMaat(f, maat).maat
  const i = ((Math.round(index) % f.aantal) + f.aantal) % f.aantal
  return `${render.map}/frames/${m}/f${String(i).padStart(3, '0')}.webp?v=${f.versie}`
}

/** Aantal beelden van een fase (0 als hij leeg is). */
export function faseLengte(frames: OefenFrames, fase: FaseNaam): number {
  const [van, tot] = frames.fasen[fase]
  return tot - van
}

function render(d: Data): OefenRender {
  const map = `${OEFENRENDER_MAP}/${d.slug}`
  return {
    slug: d.slug,
    figuur: 'kane',
    map,
    naam: d.naam,
    spieren: (d.spieren as readonly Lichaamsdeel[]).map((s) => SPIER_LABEL[s]),
    spierenSecundair: (d.spierenSecundair as readonly Lichaamsdeel[]).map((s) => SPIER_LABEL[s]),
    ...bestanden(map, d),
    vloerY: 'vloer_y' in d ? (d.vloer_y as number) : null,
    frames: framesVan(d),
  }
}

/**
 * Dezelfde oefening met de beelden van het neutrale figuur. Fasen, fps en aantal
 * horen bij de beweging en blijven gelijk (het script weigert een ander aantal).
 */
export function metNeutraal(r: OefenRender, n: NeutraalData): OefenRender {
  const map = `${OEFENRENDER_MAP}/neutraal/${r.slug}`
  return {
    ...r,
    figuur: 'neutraal',
    map,
    ...bestanden(map, n),
    vloerY: n.vloer_y,
    frames: r.frames ? { ...r.frames, versie: n.frames.versie, maten: matenVan(n.frames.maten) } : null,
  }
}

/** Alle renders met het figuur kane. */
export const OEFENRENDERS: readonly OefenRender[] = OEFENRENDER_DATA.map(render)

/** Alle renders met het neutrale figuur; een oefening zonder neutrale render houdt de bestaande. */
export const OEFENRENDERS_NEUTRAAL: readonly OefenRender[] = OEFENRENDER_DATA.map((d, i) =>
  'neutraal' in d ? metNeutraal(OEFENRENDERS[i], d.neutraal as NeutraalData) : OEFENRENDERS[i],
)

const opNaam = (lijst: readonly OefenRender[]) => new Map(lijst.map((r) => [r.naam.toLowerCase(), r]))
const OP_NAAM: Readonly<Record<OefenFiguur, ReadonlyMap<string, OefenRender>>> = {
  kane: opNaam(OEFENRENDERS),
  neutraal: opNaam(OEFENRENDERS_NEUTRAAL),
}

/** De render bij een oefening (naam zoals in de bibliotheek), of undefined. Zonder keuze neutraal. */
export function renderVoor(naam: string, figuur: OefenFiguur = 'neutraal'): OefenRender | undefined {
  return OP_NAAM[figuur].get(naam.trim().toLowerCase())
}

/** ["Bovenbenen", "Bilspieren", "Romp"] wordt "bovenbenen, bilspieren en romp". */
export function spierZin(spieren: readonly string[]): string {
  const klein = spieren.map((s) => s.toLowerCase())
  if (klein.length <= 1) return klein.join('')
  return `${klein.slice(0, -1).join(', ')} en ${klein[klein.length - 1]}`
}
