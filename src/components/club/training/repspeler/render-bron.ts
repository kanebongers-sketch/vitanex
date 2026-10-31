// ─── Club, rep-speler: de Blender-render van een oefening (PUUR) ────────────
// Besluit Kane (24-10-2026): de Blender-renders komen in Club en de ledenapp,
// met een rep-speler. De beelden en hun fasen staan in de renderlijst van de
// website (oefenrenders.ts, frames en frameUrl); dit bestand maakt er de vorm
// van die de speler nodig heeft. Een render zonder losse beelden telt niet:
// dan blijft het oude beeld staan.
// Let op: de fasen in de renderdata zijn halfopen [van, tot); de tijdlijn van de
// speler rekent met inclusieve bereiken [eerste, laatste].
// Geen zware imports: dit bestand gaat mee naar de browser.

import { frameUrl, renderVoor, type FaseNaam, type FaseReeks, type OefenRender } from '@/components/aiyourgym/inhoud/oefenrenders'
import type { RenderTiming } from '@/lib/club/training/repspeler/plan'
import type { FrameBereik, FrameFases } from '@/lib/club/training/repspeler/typen'

export interface RepMaat {
  /** Breedte van een frame in px (480, 720 of 1080). */
  breedte: number
}

export interface RepRender extends RenderTiming {
  slug: string
  naam: string
  /** Van klein naar groot. */
  maten: readonly RepMaat[]
  /** Stilstaand beginbeeld (poster) groot en klein, en het zwaarste punt. */
  poster: string
  posterKlein: string
  piek: string
  /** Bewegende lus van 480 px, voor kleine voorbeelden. */
  lusKlein: string
  versie: string
  /** De render zelf, voor frameUrl. */
  bron: OefenRender
}

/**
 * Halfopen [van, tot) naar inclusief [van, tot - 1]. Een lege fase (van gelijk
 * aan tot) houdt het beeld ervoor vast: zo kan het schema daar toch een pauze
 * hebben (bijvoorbeeld 1 seconde onderin) zonder dat het beeld verspringt.
 */
export function inclusief(reeks: FaseReeks, aantal: number): FrameBereik {
  const max = Math.max(0, aantal - 1)
  const van = Math.min(max, Math.max(0, reeks[0]))
  const tot = Math.min(aantal, Math.max(0, reeks[1]))
  if (tot > van) return [van, tot - 1]
  const vast = Math.max(0, Math.min(max, van - 1))
  return [vast, vast]
}

function fasesVan(fasen: Readonly<Record<FaseNaam, FaseReeks>>, aantal: number): FrameFases {
  const b = (n: FaseNaam) => inclusief(fasen[n], aantal)
  return { rust_begin: b('rust_begin'), heen: b('heen'), houden_ver: b('houden_ver'), terug: b('terug'), rust_eind: b('rust_eind') }
}

export function leesRepRender(r: OefenRender): RepRender | null {
  const f = r.frames
  if (!f || f.aantal < 2 || !(f.fps > 0) || f.maten.length === 0) return null
  return {
    slug: r.slug,
    naam: r.naam,
    frames: f.aantal,
    fps: f.fps,
    fases: fasesVan(f.fasen, f.aantal),
    heenIs: f.heenIs,
    soort: f.soort,
    ...(f.fasenRechts ? { fasesRechts: fasesVan(f.fasenRechts, f.aantal) } : {}),
    maten: [...f.maten].sort((a, b) => a.maat - b.maat).map((m) => ({ breedte: m.maat })),
    poster: r.begin.src,
    posterKlein: r.beginKlein.src,
    piek: r.piek.src,
    lusKlein: r.lusKlein.src,
    versie: f.versie,
    bron: r,
  }
}

const CACHE = new Map<string, RepRender | null>()

/** De render met losse frames bij een oefening (naam zoals in de bibliotheek), of null. */
export function repRenderVoor(naam: string): RepRender | null {
  const sleutel = naam.trim().toLowerCase()
  if (!CACHE.has(sleutel)) {
    const r = renderVoor(naam)
    CACHE.set(sleutel, r ? leesRepRender(r) : null)
  }
  return CACHE.get(sleutel) ?? null
}

/** Adres van frame i op een maat. */
export function frameSrc(r: RepRender, maat: RepMaat, i: number): string {
  return frameUrl(r.bron, maat.breedte, i) ?? r.poster
}

/**
 * De kleinste maat die scherp is op dit scherm (breedte in css-px maal
 * devicePixelRatio), anders de grootste. Met een `plafond` (telefoon, databesparing)
 * nooit groter dan dat plafond; past er geen onder, dan de kleinste.
 */
export function kiesMaat(maten: readonly RepMaat[], breedteCss: number, dpr: number, plafond?: number | null): RepMaat | null {
  if (maten.length === 0) return null
  const binnen = plafond ? maten.filter((m) => m.breedte <= plafond) : maten
  const keus = binnen.length > 0 ? binnen : maten.slice(0, 1)
  const nodig = Math.max(1, breedteCss) * Math.min(3, Math.max(1, Number.isFinite(dpr) ? dpr : 1))
  return keus.find((m) => m.breedte >= nodig * 0.95) ?? keus[keus.length - 1]
}
