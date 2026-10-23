// ─── AI Your Gym: onze eigen Blender-renders van oefeningen (PUUR) ──────────
// Besluit Kane (23-10-2026): de renders zijn de oefenbeelden op de website.
// Per oefening een bewegende lus (groot en klein) en twee stilstaande beelden
// (begin en zwaarste punt), klaargezet door scripts/oefenbeelden-web.mjs in
// public/oefenbeelden/<slug>/. De gegevens (naam, spieren, maten, versie)
// schrijft dat script in oefenrenders.data.ts; dit bestand maakt er een
// getypeerde lijst van. Een oefening zonder render valt terug op Oefenbeeld3d.
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
  lus: OefenRenderBestand
  lusKlein: OefenRenderBestand
  begin: OefenRenderBestand
  piek: OefenRenderBestand
}

type Data = (typeof OEFENRENDER_DATA)[number]

function bestand(d: Data, naam: keyof Data['bytes'], breedte: number): OefenRenderBestand {
  const verhouding = d.hoogte / d.breedte
  return {
    src: `${OEFENRENDER_MAP}/${d.slug}/${naam}.webp?v=${d.versie}`,
    breedte,
    hoogte: Math.round(breedte * verhouding),
    bytes: d.bytes[naam],
  }
}

/** Breedte van de kleine lus (zie KLEIN in het script). */
export const LUS_KLEIN_BREEDTE = 360

function render(d: Data): OefenRender {
  return {
    slug: d.slug,
    naam: d.naam,
    spieren: (d.spieren as readonly Lichaamsdeel[]).map((s) => SPIER_LABEL[s]),
    spierenSecundair: (d.spierenSecundair as readonly Lichaamsdeel[]).map((s) => SPIER_LABEL[s]),
    lus: bestand(d, 'lus', d.breedte),
    lusKlein: bestand(d, 'lus-klein', Math.min(LUS_KLEIN_BREEDTE, d.breedte)),
    begin: bestand(d, 'begin', d.breedte),
    piek: bestand(d, 'piek', d.breedte),
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
