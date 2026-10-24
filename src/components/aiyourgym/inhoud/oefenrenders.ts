// ─── AI Your Gym: onze eigen Blender-renders van oefeningen (PUUR) ──────────
// Besluit Kane (23-10-2026): de renders zijn de oefenbeelden op de website.
// Per oefening een bewegende lus in drie maten (HD, 720 en 480 px, alle op 24
// beelden per seconde) en twee stilstaande beelden (begin en zwaarste punt, HD
// en 480 px), klaargezet door scripts/oefenbeelden-web.mjs in
// public/oefenbeelden/<slug>/. De gegevens (naam, spieren, maten, versie)
// schrijft dat script in oefenrenders.data.ts; dit bestand maakt er een
// getypeerde lijst van. Een oefening zonder render valt terug op Oefenbeeld3d.
// Daarnaast losse beelden plus fasen voor de rep-speler (frameUrl) en de
// vloerlijn (vloerY) voor de schaduw.
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

export interface OefenRenderBestand {
  /** Pad vanaf de root van de site, met ?v= zodat een nieuwe render nooit uit de cache komt. */
  src: string
  breedte: number
  hoogte: number
  bytes: number
}

export interface OefenRender {
  slug: string
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
// zegt de data welke beelden bij welke fase horen. De speler rekt of krimpt elke
// fase tot het tempo van het schema (bijvoorbeeld 2 seconden omlaag, 2 omhoog).

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
}

type Data = (typeof OEFENRENDER_DATA)[number]
type Naam = keyof Data['bytes'] & keyof Data['maten']

function bestand(d: Data, naam: Naam): OefenRenderBestand {
  const breedte = d.maten[naam]
  return {
    src: `${OEFENRENDER_MAP}/${d.slug}/${naam}.webp?v=${d.versie}`,
    breedte,
    hoogte: Math.round((breedte * d.hoogte) / d.breedte),
    bytes: d.bytes[naam],
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

interface FramesData {
  aantal: number
  fps: number
  versie: string
  maten: Readonly<Record<string, { breedte: number; hoogte: number; bytes: number }>>
  fasen: Readonly<Record<FaseNaam, readonly number[]>>
  heen_is: string
  soort: string
}

function framesVan(d: Data): OefenFrames | null {
  if (!('frames' in d)) return null
  const f = d.frames as FramesData
  return {
    aantal: f.aantal,
    fps: f.fps,
    versie: f.versie,
    maten: Object.entries(f.maten)
      .map(([maat, m]) => ({ maat: Number(maat), breedte: m.breedte, hoogte: m.hoogte, bytes: m.bytes }))
      .sort((a, b) => a.maat - b.maat),
    fasen: Object.fromEntries(FASE_VOLGORDE.map((n) => [n, [f.fasen[n][0], f.fasen[n][1]] as const])) as Record<
      FaseNaam,
      FaseReeks
    >,
    heenIs: f.heen_is as HeenIs,
    soort: f.soort as BewegingSoort,
  }
}

/** De kleinste beschikbare maat van minstens `breedte` px, anders de grootste. */
export function kiesFrameMaat(frames: OefenFrames, breedte: number): OefenFrameMaat {
  return frames.maten.find((m) => m.maat >= breedte) ?? frames.maten[frames.maten.length - 1]
}

/**
 * Pad van een los beeld: /oefenbeelden/<slug>/frames/<maat>/f000.webp?v=<versie>.
 * `maat` is een gewenste breedte in px (de dichtstbijzijnde maat erboven wordt
 * gekozen); `index` loopt rond binnen de lus. undefined zonder losse beelden.
 */
export function frameUrl(render: OefenRender, maat: number, index: number): string | undefined {
  const f = render.frames
  if (!f || f.maten.length === 0) return undefined
  const m = kiesFrameMaat(f, maat).maat
  const i = ((Math.round(index) % f.aantal) + f.aantal) % f.aantal
  return `${OEFENRENDER_MAP}/${render.slug}/frames/${m}/f${String(i).padStart(3, '0')}.webp?v=${f.versie}`
}

/** Aantal beelden van een fase (0 als hij leeg is). */
export function faseLengte(frames: OefenFrames, fase: FaseNaam): number {
  const [van, tot] = frames.fasen[fase]
  return tot - van
}

function render(d: Data): OefenRender {
  return {
    slug: d.slug,
    naam: d.naam,
    spieren: (d.spieren as readonly Lichaamsdeel[]).map((s) => SPIER_LABEL[s]),
    spierenSecundair: (d.spierenSecundair as readonly Lichaamsdeel[]).map((s) => SPIER_LABEL[s]),
    lusHd: bestand(d, 'lus-hd'),
    lus: bestand(d, 'lus'),
    lusKlein: bestand(d, 'lus-klein'),
    begin: bestand(d, 'begin'),
    beginKlein: bestand(d, 'begin-klein'),
    piek: bestand(d, 'piek'),
    piekKlein: bestand(d, 'piek-klein'),
    vloerY: 'vloer_y' in d ? (d.vloer_y as number) : null,
    frames: framesVan(d),
  }
}

export const OEFENRENDERS: readonly OefenRender[] = OEFENRENDER_DATA.map(render)

const OP_NAAM = new Map(OEFENRENDERS.map((r) => [r.naam.toLowerCase(), r]))

/** De render bij een oefening (naam zoals in de bibliotheek), of undefined. */
export function renderVoor(naam: string): OefenRender | undefined {
  return OP_NAAM.get(naam.trim().toLowerCase())
}

/** ["Bovenbenen", "Bilspieren", "Romp"] wordt "bovenbenen, bilspieren en romp". */
export function spierZin(spieren: readonly string[]): string {
  const klein = spieren.map((s) => s.toLowerCase())
  if (klein.length <= 1) return klein.join('')
  return `${klein.slice(0, -1).join(', ')} en ${klein[klein.length - 1]}`
}
