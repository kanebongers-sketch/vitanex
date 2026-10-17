// ─── Club: invoer van het huisstijl-portaal (PUUR) ──────────────────────────
// Systeemgrens: wat er van de pagina binnenkomt wordt hier gecontroleerd.

import { HEX, THEMAS, type Thema } from './huisstijl'
import { MODULES, type Module } from './organisatie'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export interface HuisstijlInvoer {
  naam: string
  slogan: string | null
  kleurAccent: string
  thema: Thema
  /** Onderdelen die uit staan. */
  uit: Module[]
}

export const MAX_NAAM = 60
export const MAX_SLOGAN = 80

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export function leesHuisstijl(body: unknown): Uitslag<HuisstijlInvoer> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const naam = typeof o.naam === 'string' ? o.naam.trim().replace(/\s+/g, ' ') : ''
  if (!naam) return { ok: false, fout: 'Vul de naam van de sportschool in.' }
  if (naam.length > MAX_NAAM) return { ok: false, fout: `De naam mag maximaal ${MAX_NAAM} tekens zijn.` }
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

/** Een SVG met scripts, event-handlers of externe verwijzingen weigeren we. */
export function isVeiligeSvg(tekst: string): boolean {
  const t = tekst.toLowerCase()
  if (!t.includes('<svg')) return false
  return !/<script|<foreignobject|\son[a-z]+\s*=|javascript:|<iframe|<embed|<object|xlink:href\s*=\s*["']\s*(https?:|data:|\/\/)|href\s*=\s*["']\s*(https?:|data:|\/\/)/.test(t)
}
