// ─── LifeOS — WHOOP ────────────────────────────────────────────────────────
// Haalt recovery + slaap op en bouwt het ruwe payload dat `vanWhoop()` leest.
//
// Geverifieerd tegen developer.whoop.com/api (juli 2026):
//   GET /developer/v2/recovery        scope read:recovery
//   GET /developer/v2/activity/sleep  scope read:sleep
//   Antwoord: { records: [...], next_token: "..." }   limit ≤ 25
//   Query: start, end (date-time), limit, nextToken
//
// LET OP — v1 is uitgefaseerd. De comment boven `vanWhoop` in `herstel.ts`
// noemt nog `/v1/recovery` + `/v1/cycle/sleep`; die paden bestaan niet meer.
// De VELDNAMEN in die normalizer kloppen wél met v2, dus de module zelf is
// gezond; alleen het pad in de comment is verouderd.

import { getal, isObject, lijst, tekst, veld } from './narrow'
import { lokaleDatum, type IsoDatum } from './tijd'

const WHOOP_API = 'https://api.prod.whoop.com/developer/v2'

/** Max per pagina volgens de API-spec. */
const PAGINA = 25
/** Harde bovengrens op paginering: liever data missen dan oneindig doorlopen. */
const MAX_PAGINAS = 10

export interface WhoopRecovery {
  slaapId: string | null
  aangemaaktOp: string | null
  /** Null als `score_state` niet SCORED is — een ongescoorde recovery is geen 0. */
  score: Record<string, unknown> | null
}

export interface WhoopSlaap {
  id: string | null
  /** Wektijd (UTC). */
  eind: string | null
  /** Tijdzone van de meting, bv. '+02:00'. */
  offset: string | null
  nap: boolean
  score: Record<string, unknown> | null
}

// ── Narrowing ──────────────────────────────────────────────────────────────

/** Alleen een SCORED record heeft een score-object; anders is het er niet. */
function leesScore(rij: unknown): Record<string, unknown> | null {
  if (tekst(veld(rij, 'score_state')) !== 'SCORED') return null
  const score = veld(rij, 'score')
  return isObject(score) ? score : null
}

export function leesRecoveries(ruw: unknown): WhoopRecovery[] {
  return lijst(veld(ruw, 'records')).map((rij) => ({
    slaapId: tekst(veld(rij, 'sleep_id')),
    aangemaaktOp: tekst(veld(rij, 'created_at')),
    score: leesScore(rij),
  }))
}

export function leesSlapen(ruw: unknown): WhoopSlaap[] {
  return lijst(veld(ruw, 'records')).map((rij) => ({
    id: tekst(veld(rij, 'id')),
    eind: tekst(veld(rij, 'end')),
    offset: tekst(veld(rij, 'timezone_offset')),
    nap: veld(rij, 'nap') === true,
    score: leesScore(rij),
  }))
}

// ── De mapping ─────────────────────────────────────────────────────────────

export interface WhoopPayload {
  datum: IsoDatum
  /** Precies de vorm die `vanWhoop()` verwacht. */
  ruw: Record<string, unknown>
  /** De onbewerkte records, voor de `ruw`-kolom (audittrail). */
  bron: Record<string, unknown>
}

/**
 * Koppelt elke recovery aan de slaap waaruit hij berekend is, en bouwt daaruit
 * één payload per dag.
 *
 * ── Waarom de datum uit de SLAAP komt en niet uit `created_at` ─────────────
 * Een recovery hoort bij de dag waarop je wakker wordt. Whoop levert daar geen
 * `day`-veld voor, maar de bijbehorende slaap heeft `end` (wektijd, UTC) plus
 * `timezone_offset`. Daaruit volgt de lokale kalenderdag exact. Alleen als die
 * slaap ontbreekt vallen we terug op de UTC-datum van `created_at` — zie
 * `datumVanRecovery`.
 *
 * ── Slaap: de echte veldnamen, geen vertaling ─────────────────────────────
 * Deze functie gaf de efficiency ooit door onder de sleutel
 * `sleep_performance_percentage`, omdat `vanWhoop()` die las terwijl het
 * `sleep_efficiency_percentage` bedoelde. Dat is nu bij de bron gerepareerd:
 * de normalizer leest de juiste sleutel, dus hier gaan de échte namen door.
 *
 * De twee cijfers blijven verwarrend en lijken op elkaar — houd ze uit elkaar:
 *   • sleep_performance_percentage — geslapen t.o.v. je slaapBEHOEFTE
 *   • sleep_efficiency_percentage  — geslapen t.o.v. tijd IN BED  ← dit bedoelen we
 *
 * `stage_summary` gaat mee zodat `vanWhoop()` de slaapDUUR kan afleiden. Zonder
 * dat blok zag een Whoop-only gebruiker nooit hoe lang hij sliep, en opende hij
 * de Whoop-app alsnog — precies wat LifeOS overbodig moet maken.
 */
export function bouwWhoopPayloads(
  recoveries: readonly WhoopRecovery[],
  slapen: readonly WhoopSlaap[],
): WhoopPayload[] {
  // Naps tellen niet mee: een middagdutje is niet de nacht waar de recovery op
  // slaat, en zijn efficiency als "jouw slaapefficiëntie" tonen is onwaar.
  const perId = new Map<string, WhoopSlaap>()
  for (const s of slapen) {
    if (s.id !== null && !s.nap) perId.set(s.id, s)
  }

  const payloads = new Map<IsoDatum, WhoopPayload>()

  for (const r of recoveries) {
    const slaap = r.slaapId !== null ? perId.get(r.slaapId) ?? null : null
    const datum = datumVanRecovery(r, slaap)
    if (datum === null) continue

    const efficiency = slaap?.score !== null && slaap?.score !== undefined
      ? getal(slaap.score.sleep_efficiency_percentage)
      : null

    payloads.set(datum, {
      datum,
      ruw: {
        score: {
          // Uit de recovery. Ontbreekt de score (PENDING/UNSCORABLE), dan zijn
          // dit `undefined` → de normalizer maakt er null van. Geen 0.
          recovery_score: r.score?.recovery_score,
          resting_heart_rate: r.score?.resting_heart_rate,
          hrv_rmssd_milli: r.score?.hrv_rmssd_milli,
          // Uit de slaap. Echte namen — zie de uitleg hierboven.
          sleep_efficiency_percentage: efficiency ?? undefined,
          stage_summary: slaap?.score?.stage_summary,
        },
      },
      bron: {
        recovery: { sleep_id: r.slaapId, created_at: r.aangemaaktOp, score: r.score },
        sleep: slaap === null ? null : { id: slaap.id, end: slaap.eind, score: slaap.score },
      },
    })
  }

  return [...payloads.values()]
}

/**
 * De lokale dag van een recovery.
 *
 * Eerste keus: de wektijd van de bijbehorende slaap + haar tijdzone-offset —
 * exact.
 *
 * Terugval: de UTC-datum van `created_at`. AANNAME: Whoop scoort je recovery
 * 's ochtends, en voor een gebruiker in West-Europa (UTC+1/+2) valt dat
 * ochtendmoment op dezelfde UTC-kalenderdag. Voor een gebruiker ten westen van
 * UTC klopt dat niet meer. We gebruiken deze terugval alleen als de slaap
 * buiten het opgehaalde venster viel — zeldzaam, want we halen slaap over een
 * ruimer venster op dan recovery (zie `haalWhoop`).
 */
export function datumVanRecovery(
  recovery: WhoopRecovery,
  slaap: WhoopSlaap | null,
): IsoDatum | null {
  if (slaap !== null) {
    const uitSlaap = lokaleDatum(slaap.eind, slaap.offset)
    if (uitSlaap !== null) return uitSlaap
  }
  if (recovery.aangemaaktOp === null) return null
  const t = new Date(recovery.aangemaaktOp)
  return Number.isNaN(t.getTime()) ? null : t.toISOString().slice(0, 10)
}

// ── Ophalen ────────────────────────────────────────────────────────────────

async function haalPaginas(pad: string, token: string, query: URLSearchParams): Promise<unknown[]> {
  const records: unknown[] = []
  let volgende: string | null = null

  for (let i = 0; i < MAX_PAGINAS; i++) {
    const q = new URLSearchParams(query)
    q.set('limit', String(PAGINA))
    if (volgende !== null) q.set('nextToken', volgende)

    const res = await fetch(`${WHOOP_API}${pad}?${q.toString()}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        res.status === 401
          ? 'WHOOP wees het token af — opnieuw koppelen'
          : `WHOOP gaf een fout (${res.status})`,
      )
    }

    const body: unknown = await res.json()
    records.push(...lijst(veld(body, 'records')))

    volgende = tekst(veld(body, 'next_token'))
    if (volgende === null) break
  }

  return records
}

/**
 * Recovery + slaap over het venster [start, eind].
 *
 * Slaap halen we een dag rúímer op: de slaap die bij de oudste recovery hoort,
 * begon de avond ervóór. Zonder die marge mist die recovery zijn slaap en valt
 * hij terug op de minder precieze datum.
 */
export async function haalWhoop(
  token: string,
  start: Date,
  eind: Date,
): Promise<{ recoveries: WhoopRecovery[]; slapen: WhoopSlaap[] }> {
  const venster = new URLSearchParams({ start: start.toISOString(), end: eind.toISOString() })
  const slaapVenster = new URLSearchParams({
    start: new Date(start.getTime() - 86_400_000).toISOString(),
    end: eind.toISOString(),
  })

  const [recRecords, slaapRecords] = await Promise.all([
    haalPaginas('/recovery', token, venster),
    haalPaginas('/activity/sleep', token, slaapVenster),
  ])

  return {
    recoveries: leesRecoveries({ records: recRecords }),
    slapen: leesSlapen({ records: slaapRecords }),
  }
}
