// ─── LifeOS — Oura ─────────────────────────────────────────────────────────
// Haalt readiness + slaap op en bouwt het ruwe payload dat `vanOura()` leest.
//
// Geverifieerd tegen cloud.ouraring.com/docs (juli 2026), veldnamen tegen het
// Pydantic-model van de-momentum/open-wearables (Oura API v2):
//   GET /v2/usercollection/daily_readiness?start_date=&end_date=
//       → { data: [{ id, day, score, contributors, temperature_deviation }], next_token }
//   GET /v2/usercollection/sleep?start_date=&end_date=
//       → { data: [{ id, day, average_hrv, lowest_heart_rate, average_heart_rate,
//                    total_sleep_duration, efficiency, type, period }], next_token }
//   Scope: `daily`
//
// ── De valkuil: er zijn twee endpoints die "sleep" heten ───────────────────
// `daily_sleep` geeft een SCORE met `contributors` — en die contributors zijn
// zelf 0-100 sub-scores, geen metingen. `contributors.efficiency` is dus NIET
// je slaapefficiëntie; het is Oura's puntenwaardering ervan.
// De échte percentages staan op `sleep` (enkelvoud): `efficiency`,
// `average_hrv`, `total_sleep_duration`. Die gebruiken we. Zie `bouwOuraPayloads`.

import { getal, lijst, tekst, veld } from './narrow'
import { isoDatum, type IsoDatum } from './tijd'

const OURA_API = 'https://api.ouraring.com/v2/usercollection'

const MAX_PAGINAS = 10

/**
 * Slaaptypes die als "de nacht" tellen. `late_nap` en `rest` zijn geen nacht,
 * en `deleted` is door de gebruiker weggegooid — die overnemen zou data
 * terugtoveren die hij bewust wiste.
 */
const NACHT_TYPES = new Set(['long_sleep', 'sleep'])

export interface OuraReadiness {
  dag: IsoDatum | null
  score: number | null
}

export interface OuraSlaap {
  dag: IsoDatum | null
  type: string | null
  hrvMs: number | null
  laagsteHartslag: number | null
  gemiddeldeHartslag: number | null
  slaapSeconden: number | null
  /** Het échte efficiëntiepercentage (0-100), niet de contributor-score. */
  efficientie: number | null
}

// ── Narrowing ──────────────────────────────────────────────────────────────

export function leesReadiness(ruw: unknown): OuraReadiness[] {
  return lijst(veld(ruw, 'data')).map((rij) => ({
    dag: isoDatum(veld(rij, 'day')),
    score: getal(veld(rij, 'score')),
  }))
}

export function leesSlapen(ruw: unknown): OuraSlaap[] {
  return lijst(veld(ruw, 'data')).map((rij) => ({
    dag: isoDatum(veld(rij, 'day')),
    type: tekst(veld(rij, 'type')),
    hrvMs: getal(veld(rij, 'average_hrv')),
    laagsteHartslag: getal(veld(rij, 'lowest_heart_rate')),
    gemiddeldeHartslag: getal(veld(rij, 'average_heart_rate')),
    slaapSeconden: getal(veld(rij, 'total_sleep_duration')),
    efficientie: getal(veld(rij, 'efficiency')),
  }))
}

// ── De mapping ─────────────────────────────────────────────────────────────

export interface OuraPayload {
  datum: IsoDatum
  /** Precies de vorm die `vanOura()` verwacht. */
  ruw: Record<string, unknown>
  /** De onbewerkte records, voor de `ruw`-kolom (audittrail). */
  bron: Record<string, unknown>
}

/**
 * Voegt readiness en slaap per dag samen tot het payload dat `vanOura()` leest.
 *
 * `vanOura` leest `ruw.contributors.efficiency` voor `slaapEfficientie`. Wij
 * zetten daar het ECHTE percentage van het `sleep`-endpoint neer, niet de
 * gelijknamige contributor-score van `daily_sleep`. `HerstelMeting.slaapEfficientie`
 * is gedocumenteerd als "% van tijd in bed daadwerkelijk geslapen"; dát is de
 * waarde die daar hoort. De contributor-score is een ander getal met dezelfde
 * naam — die doorgeven zou een puntenwaardering als een meting laten doorgaan.
 *
 * Een dag met alleen slaap (readiness nog niet berekend) levert gewoon een
 * payload zonder score op: HRV en slaap zijn dan wél gemeten, en die verzwijgen
 * omdat het cijfer ontbreekt zou data weggooien die er is.
 */
export function bouwOuraPayloads(
  readiness: readonly OuraReadiness[],
  slapen: readonly OuraSlaap[],
): OuraPayload[] {
  const scorePerDag = new Map<IsoDatum, number | null>()
  for (const r of readiness) {
    if (r.dag !== null) scorePerDag.set(r.dag, r.score)
  }

  const nachtPerDag = new Map<IsoDatum, OuraSlaap>()
  for (const s of slapen) {
    if (s.dag === null) continue
    if (s.type === null || !NACHT_TYPES.has(s.type)) continue

    // Meerdere nachten op één dag (bv. onderbroken slaap): de langste is de
    // hoofdslaap. Ze optellen zou van twee losse periodes één nacht maken.
    const staand = nachtPerDag.get(s.dag)
    if (staand === undefined || (s.slaapSeconden ?? 0) > (staand.slaapSeconden ?? 0)) {
      nachtPerDag.set(s.dag, s)
    }
  }

  const dagen = new Set<IsoDatum>([...scorePerDag.keys(), ...nachtPerDag.keys()])
  const payloads: OuraPayload[] = []

  for (const datum of dagen) {
    const score = scorePerDag.get(datum) ?? null
    const slaap = nachtPerDag.get(datum) ?? null

    payloads.push({
      datum,
      ruw: {
        score: score ?? undefined,
        average_hrv: slaap?.hrvMs ?? undefined,
        lowest_heart_rate: slaap?.laagsteHartslag ?? undefined,
        average_heart_rate: slaap?.gemiddeldeHartslag ?? undefined,
        total_sleep_duration: slaap?.slaapSeconden ?? undefined,
        contributors: { efficiency: slaap?.efficientie ?? undefined },
      },
      bron: { readiness: { day: datum, score }, sleep: slaap },
    })
  }

  return payloads
}

// ── Ophalen ────────────────────────────────────────────────────────────────

async function haalPaginas(pad: string, token: string, query: URLSearchParams): Promise<unknown[]> {
  const data: unknown[] = []
  let volgende: string | null = null

  for (let i = 0; i < MAX_PAGINAS; i++) {
    const q = new URLSearchParams(query)
    if (volgende !== null) q.set('next_token', volgende)

    const res = await fetch(`${OURA_API}${pad}?${q.toString()}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        res.status === 401
          ? 'Oura wees het token af — opnieuw koppelen'
          : `Oura gaf een fout (${res.status})`,
      )
    }

    const body: unknown = await res.json()
    data.push(...lijst(veld(body, 'data')))

    volgende = tekst(veld(body, 'next_token'))
    if (volgende === null) break
  }

  return data
}

/**
 * Readiness + slaap over [startDatum, eindDatum] (lokale kalenderdagen).
 * Oura interpreteert deze datums in de tijdzone van de gebruiker — daarom
 * hoeven we hier, anders dan bij Whoop, zelf niets om te rekenen.
 */
export async function haalOura(
  token: string,
  startDatum: IsoDatum,
  eindDatum: IsoDatum,
): Promise<{ readiness: OuraReadiness[]; slapen: OuraSlaap[] }> {
  const venster = new URLSearchParams({ start_date: startDatum, end_date: eindDatum })

  const [readinessData, slaapData] = await Promise.all([
    haalPaginas('/daily_readiness', token, venster),
    haalPaginas('/sleep', token, venster),
  ])

  return {
    readiness: leesReadiness({ data: readinessData }),
    slapen: leesSlapen({ data: slaapData }),
  }
}
