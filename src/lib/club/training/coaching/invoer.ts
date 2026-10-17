// ─── Club, training: eigen coaching controleren (PUUR) ──────────────────────
// Systeemgrens voor coaching die een sportschool zelf schrijft. Dezelfde regels
// als de standaardcoaching (zie coaching.test.ts): 3 tot 5 kernpunten, 1 tot 3
// zinnen opstelling, 2 tot 4 stappen, 2 tot 4 fouten, plus ademhaling en tempo.
// Ook gebruikt om opgeslagen coaching uit de database te lezen.

import type { Coaching, Fout, Kernpunt } from './typen'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export const GRENZEN = {
  kernpunten: [3, 5],
  opstelling: [1, 3],
  stappen: [2, 4],
  fouten: [2, 4],
  punt: 32,
  uitleg: 140,
  zin: 240,
  fout: 60,
  beter: 140,
  ademhaling: 160,
  tempo: 80,
  variant: 140,
} as const

function tekst(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function lijst<T>(v: unknown, lees: (x: unknown) => T | null): T[] {
  return Array.isArray(v) ? v.map(lees).filter((x): x is T => x !== null) : []
}

function aantal(naam: string, n: number, [min, max]: readonly [number, number]): string | null {
  if (n < min || n > max) return `${naam}: ${min} tot ${max} nodig (nu ${n}).`
  return null
}

function langer(naam: string, waarde: string, max: number): string | null {
  return waarde.length > max ? `${naam} mag maximaal ${max} tekens zijn.` : null
}

/** Lege regels vallen weg: een half ingevuld formulier is geen fout. */
function leesKernpunt(v: unknown): Kernpunt | null {
  const o = object(v)
  const punt = tekst(o?.punt)
  return punt ? { punt, uitleg: tekst(o?.uitleg) } : null
}

function leesFout(v: unknown): Fout | null {
  const o = object(v)
  const fout = tekst(o?.fout)
  return fout ? { fout, beter: tekst(o?.beter) } : null
}

function leesZin(v: unknown): string | null {
  return tekst(v) || null
}

export function leesCoaching(invoer: unknown): Uitslag<Coaching> {
  const o = object(invoer)
  if (!o) return { ok: false, fout: 'Ongeldige coaching.' }
  const coaching: Coaching = {
    kernpunten: lijst(o.kernpunten, leesKernpunt),
    opstelling: lijst(o.opstelling, leesZin),
    stappen: lijst(o.stappen, leesZin),
    fouten: lijst(o.fouten, leesFout),
    ademhaling: tekst(o.ademhaling),
    tempo: tekst(o.tempo),
    ...(tekst(o.makkelijker) ? { makkelijker: tekst(o.makkelijker) } : {}),
    ...(tekst(o.zwaarder) ? { zwaarder: tekst(o.zwaarder) } : {}),
  }
  const fouten = [
    aantal('Kernpunten', coaching.kernpunten.length, GRENZEN.kernpunten),
    aantal('Opstelling', coaching.opstelling.length, GRENZEN.opstelling),
    aantal('Stappen', coaching.stappen.length, GRENZEN.stappen),
    aantal('Fouten', coaching.fouten.length, GRENZEN.fouten),
    ...coaching.kernpunten.flatMap((k) => [langer(`Kernpunt "${k.punt.slice(0, 20)}"`, k.punt, GRENZEN.punt), langer('De uitleg bij een kernpunt', k.uitleg, GRENZEN.uitleg)]),
    ...coaching.kernpunten.map((k) => (k.uitleg ? null : `Kernpunt "${k.punt.slice(0, 20)}" heeft nog geen uitleg.`)),
    ...coaching.opstelling.map((z) => langer('Een zin bij opstelling', z, GRENZEN.zin)),
    ...coaching.stappen.map((z) => langer('Een stap', z, GRENZEN.zin)),
    ...coaching.fouten.flatMap((f) => [langer('Een fout', f.fout, GRENZEN.fout), langer('Een correctie', f.beter, GRENZEN.beter), f.beter ? null : `Fout "${f.fout.slice(0, 20)}" heeft nog geen correctie.`]),
    coaching.ademhaling ? langer('Ademhaling', coaching.ademhaling, GRENZEN.ademhaling) : 'Vul de ademhaling in.',
    coaching.tempo ? langer('Tempo', coaching.tempo, GRENZEN.tempo) : 'Vul het tempo in.',
    langer('Makkelijker', coaching.makkelijker ?? '', GRENZEN.variant),
    langer('Zwaarder', coaching.zwaarder ?? '', GRENZEN.variant),
  ].filter((f): f is string => f !== null)
  return fouten.length > 0 ? { ok: false, fout: fouten[0] } : { ok: true, waarde: coaching }
}

/** Opgeslagen coaching uit de database: alleen als hij (nog) aan de regels voldoet, anders null. */
export function coachingUitRij(v: unknown): Coaching | null {
  if (v === null || v === undefined) return null
  const uitslag = leesCoaching(v)
  return uitslag.ok ? uitslag.waarde : null
}
