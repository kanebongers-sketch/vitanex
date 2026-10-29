// ─── Club: invoer van het huisstijl-portaal (PUUR) ──────────────────────────
// Systeemgrens: wat er van de pagina binnenkomt wordt hier gecontroleerd.

import { HEX, THEMAS, type Thema } from './huisstijl'
import { MODULES, type Module } from './organisatie'
import { MAX_NAAM, leesSportschoolNaam, type NaamFout } from './sportschool-naam'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/** Als Uitslag, maar een fout in de naam heeft ook een code (vertaald in HUISSTIJL.fouten). */
export type HuisstijlUitslag = { ok: true; waarde: HuisstijlInvoer } | { ok: false; fout: string; code?: NaamFout }

export interface HuisstijlInvoer {
  naam: string
  slogan: string | null
  kleurAccent: string
  thema: Thema
  /** Onderdelen die uit staan. */
  uit: Module[]
}

export { MAX_NAAM }
export const MAX_SLOGAN = 80

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

const NAAM_FOUT_NL: Record<NaamFout, string> = {
  naamLeeg: 'Vul de naam van de sportschool in.',
  naamTeKort: 'De naam moet minstens 2 tekens zijn.',
  naamTeLang: `De naam mag maximaal ${MAX_NAAM} tekens zijn.`,
  naamTekens: 'De naam mag geen < of > of onzichtbare tekens bevatten.',
  naamBezet: 'Er is al een sportschool met deze naam.',
}

export function leesHuisstijl(body: unknown): HuisstijlUitslag {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const n = leesSportschoolNaam(o.naam)
  if (!n.ok) return { ok: false, fout: NAAM_FOUT_NL[n.code], code: n.code }
  const naam = n.naam
  const slogan = typeof o.slogan === 'string' ? o.slogan.trim().replace(/\s+/g, ' ') : ''
  if (slogan.length > MAX_SLOGAN) return { ok: false, fout: `De slogan mag maximaal ${MAX_SLOGAN} tekens zijn.` }
  if (typeof o.kleurAccent !== 'string' || !HEX.test(o.kleurAccent)) return { ok: false, fout: 'Kies een geldige kleur (bijvoorbeeld #B58E5C).' }
  if (!(THEMAS as readonly unknown[]).includes(o.thema)) return { ok: false, fout: 'Kies donker of licht.' }
  if (!Array.isArray(o.uit) || !o.uit.every((m) => (MODULES as readonly unknown[]).includes(m))) return { ok: false, fout: 'Onbekend onderdeel.' }
  const uit = [...new Set(o.uit as Module[])]
  if (uit.length === MODULES.length) return { ok: false, fout: 'Laat minstens een onderdeel aan staan.' }
  return { ok: true, waarde: { naam, slogan: slogan || null, kleurAccent: o.kleurAccent.toUpperCase(), thema: o.thema as Thema, uit } }
}

/** De jsonb voor de database: { lessen: false, ... } met alleen de onderdelen die uit staan. */
export function modulesNaarJson(uit: readonly Module[]): Record<string, false> {
  return Object.fromEntries(uit.map((m) => [m, false]))
}

export const LOGO_TYPES: Record<string, 'png' | 'webp' | 'svg' | 'jpg'> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/jpeg': 'jpg',
}
export const MAX_LOGO_BYTES = 1024 * 1024

/** Controle van een geupload logo: soort en grootte. De inhoud van een SVG wordt apart gecontroleerd. */
export function controleerLogo(type: string, grootte: number): Uitslag<'png' | 'webp' | 'svg' | 'jpg'> {
  const extensie = LOGO_TYPES[type]
  if (!extensie) return { ok: false, fout: 'Kies een PNG, WebP, JPG of SVG.' }
  if (grootte <= 0) return { ok: false, fout: 'Het bestand is leeg.' }
  if (grootte > MAX_LOGO_BYTES) return { ok: false, fout: 'Het logo mag maximaal 1 MB zijn.' }
  return { ok: true, waarde: extensie }
}

/**
 * Een SVG met scripts, event-handlers, stijlen, verwijzingen of tekens als
 * entiteit weigeren we. Streng met opzet: een gewoon logo (paden, vormen,
 * kleuren) heeft niets van dit alles nodig. Het logo wordt bovendien alleen als
 * <img> getoond en met een sandbox-CSP geserveerd: dit is de tweede laag.
 */
export function isVeiligeSvg(tekst: string): boolean {
  const t = tekst.toLowerCase()
  if (!t.includes('<svg')) return false
  const verboden = [
    /<\s*(script|style|foreignobject|iframe|embed|object|use|image|a|animate|set|handler|feimage)\b/,
    /\bon[a-z]+\s*=/,
    /(href|src)\s*=/,
    /&#|&[a-z]+;/,
    /url\s*\(|@import|javascript:|data:/,
    /<!doctype|<!entity/,
  ]
  return !verboden.some((r) => r.test(t))
}

/** De eerste bytes moeten passen bij het type (het type zelf komt van de browser). */
export function heeftJuisteKop(bytes: Uint8Array, soort: 'png' | 'webp' | 'svg' | 'jpg'): boolean {
  const begin = (...b: number[]) => b.every((x, i) => bytes[i] === x)
  if (soort === 'png') return begin(0x89, 0x50, 0x4e, 0x47)
  if (soort === 'jpg') return begin(0xff, 0xd8, 0xff)
  if (soort === 'webp') return begin(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  return true
}
