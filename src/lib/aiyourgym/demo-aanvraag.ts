// ─── AI Your Gym: een demo-aanvraag controleren (PUUR) ──────────────────────
// Systeemgrens van het formulier op /aiyourgym/demo-aanvragen. Alles wat van de
// pagina komt gaat hierdoor; per veld een Nederlandse foutmelding. De waarden
// van soort en moment staan ook in de check van migratie 436.

import { leesEmail, leesTelefoon } from './aanmelding'

export const DEMO_MAX_BODY_BYTES = 4_096
export const MAX_DEMO_NAAM = 60
export const MAX_DEMO_SPORTSCHOOL = 80
export const MAX_DEMO_VESTIGINGEN = 500
export const MAX_DEMO_OPMERKING = 1_000

export const DEMO_SOORTEN = [
  { sleutel: 'zelfstandig', label: 'Zelfstandige sportschool' },
  { sleutel: 'boutique', label: 'Boutique studio' },
  { sleutel: 'pt-studio', label: 'PT-studio' },
  { sleutel: 'keten', label: 'Keten met meerdere vestigingen' },
  { sleutel: 'yoga', label: 'Yoga, pilates of dans' },
  { sleutel: 'vechtsport', label: 'Vechtsport of boksen' },
  { sleutel: 'bootcamp', label: 'Bootcamp of HIIT' },
  { sleutel: 'anders', label: 'Iets anders' },
] as const
export type DemoSoort = (typeof DEMO_SOORTEN)[number]['sleutel']

export const DEMO_MOMENTEN = [
  { sleutel: 'ochtend', label: 'Ochtend' },
  { sleutel: 'middag', label: 'Middag' },
  { sleutel: 'avond', label: 'Avond' },
  { sleutel: 'maakt-niet-uit', label: 'Maakt niet uit' },
] as const
export type DemoMoment = (typeof DEMO_MOMENTEN)[number]['sleutel']

export interface DemoAanvraag {
  naam: string
  sportschool: string
  email: string
  telefoon: string
  vestigingen: number
  soort: DemoSoort
  moment: DemoMoment
  opmerking: string | null
}

export type DemoVeld = keyof DemoAanvraag | 'akkoord'
export type DemoFouten = Partial<Record<DemoVeld, string>>
export type DemoUitslag = { ok: true; waarde: DemoAanvraag } | { ok: false; fouten: DemoFouten }

function tekst(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

/** Geen stuurtekens (behalve een nieuwe regel) of tekens die in een weergave vreemd doen. */
function heeftRareTekens(s: string): boolean {
  return /[\u0000-\u0009\u000b-\u001f\u007f<>]/.test(s)
}

function naamFout(waarde: string, wat: string, max: number): string | null {
  if (waarde.length < 2) return `Vul ${wat} in.`
  if (waarde.length > max) return `Maximaal ${max} tekens.`
  if (heeftRareTekens(waarde)) return 'Gebruik geen speciale tekens zoals < of >.'
  return null
}

function kiesUit<T extends string>(lijst: readonly { sleutel: T }[], v: unknown): T | null {
  return lijst.find((x) => x.sleutel === v)?.sleutel ?? null
}

function leesVestigingen(ruw: unknown): number | null {
  const n = typeof ruw === 'number' ? ruw : typeof ruw === 'string' && /^\d{1,3}$/.test(ruw.trim()) ? Number(ruw) : NaN
  return Number.isInteger(n) && n >= 1 && n <= MAX_DEMO_VESTIGINGEN ? n : null
}

/** De opmerking mag regels houden, maar geen rare tekens en niet te lang. */
function leesOpmerking(ruw: unknown): { ok: true; waarde: string | null } | { ok: false; fout: string } {
  const t = typeof ruw === 'string' ? ruw.replace(/\r\n?/g, '\n').trim() : ''
  if (!t) return { ok: true, waarde: null }
  if (t.length > MAX_DEMO_OPMERKING) return { ok: false, fout: `Maximaal ${MAX_DEMO_OPMERKING} tekens.` }
  if (heeftRareTekens(t)) return { ok: false, fout: 'Gebruik geen speciale tekens zoals < of >.' }
  return { ok: true, waarde: t }
}

export function leesDemoAanvraag(body: unknown): DemoUitslag {
  const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const fouten: DemoFouten = {}

  const naam = tekst(b.naam)
  const naamProbleem = naamFout(naam, 'je naam', MAX_DEMO_NAAM)
  if (naamProbleem) fouten.naam = naamProbleem

  const sportschool = tekst(b.sportschool)
  const schoolProbleem = naamFout(sportschool, 'de naam van je sportschool', MAX_DEMO_SPORTSCHOOL)
  if (schoolProbleem) fouten.sportschool = schoolProbleem

  const email = leesEmail(b.email)
  if (!email) fouten.email = 'Vul een geldig e-mailadres in.'

  const telefoon = leesTelefoon(b.telefoon)
  if (!telefoon) fouten.telefoon = 'Vul een geldig telefoonnummer in, zodat we je kunnen bellen.'

  const vestigingen = leesVestigingen(b.vestigingen)
  if (vestigingen === null) fouten.vestigingen = `Vul een aantal van 1 tot ${MAX_DEMO_VESTIGINGEN} in.`

  const soort = kiesUit(DEMO_SOORTEN, b.soort)
  if (!soort) fouten.soort = 'Kies het soort sportschool.'

  const moment = kiesUit(DEMO_MOMENTEN, b.moment)
  if (!moment) fouten.moment = 'Kies wanneer het je uitkomt.'

  const opmerking = leesOpmerking(b.opmerking)
  if (!opmerking.ok) fouten.opmerking = opmerking.fout

  if (b.akkoord !== true) fouten.akkoord = 'Geef aan dat je de privacyverklaring hebt gelezen.'

  if (Object.keys(fouten).length > 0 || !email || !telefoon || vestigingen === null || !soort || !moment || !opmerking.ok) {
    return { ok: false, fouten }
  }
  return { ok: true, waarde: { naam, sportschool, email, telefoon, vestigingen, soort, moment, opmerking: opmerking.waarde } }
}

export function soortLabel(sleutel: string): string {
  return DEMO_SOORTEN.find((s) => s.sleutel === sleutel)?.label ?? sleutel
}

export function momentLabel(sleutel: string): string {
  return DEMO_MOMENTEN.find((m) => m.sleutel === sleutel)?.label ?? sleutel
}
