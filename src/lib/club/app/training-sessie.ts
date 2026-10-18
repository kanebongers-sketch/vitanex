// ─── Fit Factory Club, ledenapp: een lopende training op het toestel (PUUR) ──
// Wat het lid invult staat direct op de telefoon (localStorage), zodat niets
// verloren gaat als de app dichtgaat, het scherm uitgaat of er geen bereik is.
// De rust rekent vanaf een starttijd: na een scherm dat even uit was klopt de
// klok meteen weer, er telt niets af in de achtergrond.

import type { AppAlternatief } from '@/lib/club/training/alternatieven'
import { isBeeldPad } from '@/lib/club/training/beeld'
import { leesTrainingId, maakTrainingId } from './training-id'
import type { Invoer, SetVeld } from './training-modus'

export interface RustStaat {
  /** Tijdstip (ms) waarop de rust begon. */
  start: number
  /** Hoe lang de rust duurt, in seconden. */
  sec: number
  /** Wat er na de rust komt, bijvoorbeeld "set 3 Back squat". */
  volgende: string | null
}

export interface Concept {
  /** Vast id van deze training, gemaakt bij het starten; gaat mee naar de server tegen dubbel opslaan. */
  id: string
  invoer: Invoer
  /** Tijdstip (ms) waarop de training begon. */
  start: number
  /** Welke oefening open staat (index in de dag). */
  scherm: number
  rust: RustStaat | null
  /** Toestel bezet: per schemaregel de andere oefening, alleen voor deze training. */
  wissels: Record<string, AppAlternatief>
}

/** Ouder dan zes uur: een nieuwe training. */
export const CONCEPT_MAX_MS = 6 * 3600_000
const MAX_RUST_SEC = 15 * 60

export const conceptSleutel = (schemaId: string, dag: number): string => `club-training-${schemaId}-${dag}`

const tekst = (v: unknown): string => (typeof v === 'string' ? v.slice(0, 12) : '')

function leesVeld(v: unknown): SetVeld | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  return { kg: tekst(r.kg), herh: tekst(r.herh), tijd: tekst(r.tijd), klaar: r.klaar === true }
}

function leesRust(v: unknown, nu: number): RustStaat | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  if (typeof r.start !== 'number' || typeof r.sec !== 'number' || !Number.isFinite(r.start) || !Number.isFinite(r.sec)) return null
  if (r.sec <= 0 || r.sec > MAX_RUST_SEC || r.start > nu + 60_000) return null
  const rust: RustStaat = { start: r.start, sec: r.sec, volgende: typeof r.volgende === 'string' ? r.volgende.slice(0, 120) : null }
  // Een rust die al lang voorbij is, hoeft niet terug te komen.
  return rustOver(rust, nu) > 0 || nu - (rust.start + rust.sec * 1000) < 10_000 ? rust : null
}

const tekstOfNull = (v: unknown): string | null => (typeof v === 'string' ? v.slice(0, 2000) : null)

function leesWissel(v: unknown): AppAlternatief | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  if (typeof r.oefeningId !== 'string' || !/^[\w-]{1,64}$/.test(r.oefeningId) || typeof r.naam !== 'string') return null
  const b = typeof r.beeld === 'object' && r.beeld !== null ? (r.beeld as Record<string, unknown>) : null
  const beeld = b && isBeeldPad(b.start) && isBeeldPad(b.eind) && (b.bron === 'repdb' || b.bron === 'everkinetic')
    ? { start: b.start, eind: b.eind, bron: b.bron === 'repdb' ? ('repdb' as const) : ('everkinetic' as const), enkel: b.enkel === true }
    : null
  // Alleen wat de training toont; spieren en materiaal komen bij een nieuwe keuze weer van de server.
  return {
    ...(r as unknown as AppAlternatief),
    naam: r.naam.slice(0, 120),
    spiergroep: typeof r.spiergroep === 'string' ? r.spiergroep : '',
    spierenPrimair: [],
    spierenSecundair: [],
    uitleg: tekstOfNull(r.uitleg),
    aandachtspunten: tekstOfNull(r.aandachtspunten),
    beeld,
  }
}

function leesWissels(v: unknown): Record<string, AppAlternatief> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {}
  const uit: Record<string, AppAlternatief> = {}
  for (const [regel, alt] of Object.entries(v).slice(0, 40)) {
    const w = leesWissel(alt)
    if (w && /^[\w-]{1,64}$/.test(regel)) uit[regel] = w
  }
  return uit
}

/** Een bewaarde training van dit toestel, nagekeken. Onleesbaar of te oud: null. */
export function leesConcept(ruw: string | null, nu: number): Concept | null {
  if (!ruw) return null
  let c: unknown
  try {
    c = JSON.parse(ruw)
  } catch {
    return null
  }
  if (typeof c !== 'object' || c === null) return null
  const r = c as Record<string, unknown>
  if (typeof r.start !== 'number' || !Number.isFinite(r.start) || nu - r.start >= CONCEPT_MAX_MS || r.start > nu + 60_000) return null
  if (typeof r.invoer !== 'object' || r.invoer === null || Array.isArray(r.invoer)) return null
  const invoer: Invoer = {}
  for (const [k, v] of Object.entries(r.invoer).slice(0, 400)) {
    const veld = leesVeld(v)
    if (veld && /^[\w-]{1,64}:\d{1,2}$/.test(k)) invoer[k] = veld
  }
  const scherm = typeof r.scherm === 'number' && Number.isInteger(r.scherm) && r.scherm >= 0 ? r.scherm : 0
  // Een bewaarde training van voor dit id krijgt er nu een; daarna blijft het hetzelfde.
  const id = leesTrainingId(r.id) ?? maakTrainingId()
  return { id, invoer, start: r.start, scherm, rust: leesRust(r.rust, nu), wissels: leesWissels(r.wissels) }
}

/** Nog te rusten, in seconden (nooit onder 0). */
export function rustOver(rust: RustStaat, nu: number): number {
  return Math.max(0, (rust.start + rust.sec * 1000 - nu) / 1000)
}

/** Rust langer of korter maken (min 15 of plus 15). Korter dan wat al voorbij is kan niet. */
export function verlengRust(rust: RustStaat, deltaSec: number, nu: number): RustStaat {
  const voorbij = Math.max(0, (nu - rust.start) / 1000)
  return { ...rust, sec: Math.min(MAX_RUST_SEC, Math.max(voorbij, rust.sec + deltaSec)) }
}

/** Een nieuwe training op dit toestel. */
export function nieuwConcept(invoer: Invoer, nu: number): Concept {
  return { id: maakTrainingId(), invoer, start: nu, scherm: 0, rust: null, wissels: {} }
}

/** Hoe lang de training al bezig is, in seconden. */
export function verstreken(start: number, nu: number): number {
  return Math.max(0, Math.floor((nu - start) / 1000))
}
