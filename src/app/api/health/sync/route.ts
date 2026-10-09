import { NextRequest, NextResponse } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { isRateLimited } from '@/lib/utils/rate-limit'
import {
  leesSyncStatus, slaDagMetingenOp, slaWorkoutsOp, werkSyncStatusBij,
} from '@/lib/health/health-sync-server'
import { schoonDagMeting, schoonFout, schoonRechten, schoonWorkout } from '@/lib/health/health-validatie'
import type { DagMeting, HealthBron, WorkoutMeting } from '@/lib/health/health-data'

/** Bronnen die de native app mag aanleveren (Google Fit loopt via de server zelf). */
const NATIVE_BRONNEN: HealthBron[] = ['health_connect', 'healthkit']
const MAX_DAGEN = 62
const MAX_WORKOUTS = 300
const SYNC_PER_VENSTER = 20
const VENSTER_MS = 10 * 60 * 1000
/** 62 dagen + 300 trainingen passen ruim in 1 MB; alles daarboven weigeren vóór het parsen. */
const MAX_BODY_BYTES = 1_000_000

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

/** Sync-status per bron, zodat de app incrementeel kan synchroniseren. */
export async function GET(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return json({ error: 'Niet ingelogd' }, 401)
  try {
    return json({ status: await leesSyncStatus(sessie.db, sessie.user.id) })
  } catch (err) {
    console.error('[health/sync] status', err)
    return json({ error: 'Status ophalen mislukt' }, 500)
  }
}

interface SchoneBody {
  bron: HealthBron
  dagen: DagMeting[]
  workouts: WorkoutMeting[]
  rechten: string[]
  fout: string | null
  overgeslagen: number
}

/** Valideert de body. Onzin per dag/training valt af; alleen de vorm kan de batch weigeren. */
function leesBody(body: unknown): SchoneBody | string {
  if (typeof body !== 'object' || body === null) return 'Ongeldige body'
  const b = body as Record<string, unknown>
  if (!NATIVE_BRONNEN.includes(b.bron as HealthBron)) return 'Onbekende bron'
  const ruweDagen = Array.isArray(b.dagen) ? b.dagen : []
  const ruweWorkouts = Array.isArray(b.workouts) ? b.workouts : []
  if (ruweDagen.length > MAX_DAGEN) return `Hooguit ${MAX_DAGEN} dagen per sync`
  if (ruweWorkouts.length > MAX_WORKOUTS) return `Hooguit ${MAX_WORKOUTS} trainingen per sync`

  const nu = new Date()
  // Eén meting per datum: twee keer dezelfde dag in één upsert laat Postgres falen.
  const dagen = [...new Map(
    ruweDagen.map(d => schoonDagMeting(d, nu)).filter((d): d is DagMeting => d !== null).map(d => [d.datum, d]),
  ).values()]
  const workouts = ruweWorkouts.map(w => schoonWorkout(w, nu)).filter((w): w is WorkoutMeting => w !== null)
  return {
    bron: b.bron as HealthBron,
    dagen,
    workouts,
    rechten: schoonRechten(b.rechten),
    fout: schoonFout(b.fout),
    overgeslagen: ruweDagen.length - dagen.length + ruweWorkouts.length - workouts.length,
  }
}

/**
 * Ontvangt per-dag-metingen en trainingen uit de native app (Health Connect
 * op Android, Apple Health op iOS) en slaat ze idempotent op met de sessie
 * van de gebruiker (RLS: alleen eigen rijen).
 */
export async function POST(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return json({ error: 'Niet ingelogd' }, 401)
  if (isRateLimited(`health-sync:${sessie.user.id}`, SYNC_PER_VENSTER, VENSTER_MS)) {
    return json({ error: 'Te veel synchronisaties — probeer het zo opnieuw' }, 429)
  }

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return json({ error: 'Te veel gegevens in één keer' }, 413)
  }

  let ruw: unknown
  try {
    ruw = await req.json()
  } catch {
    return json({ error: 'Ongeldige JSON' }, 400)
  }
  const body = leesBody(ruw)
  if (typeof body === 'string') return json({ error: body }, 400)

  const { db, user } = sessie
  try {
    const dagen = await slaDagMetingenOp(db, user.id, body.bron, body.dagen)
    const workouts = await slaWorkoutsOp(db, user.id, body.bron, body.workouts)
    // Een lege sync (bv. nog geen toestemming) telt niet als "laatste sync":
    // anders zou de eerstvolgende echte sync de 30 dagen historie overslaan.
    const heeftData = body.dagen.length > 0 || body.workouts.length > 0
    await werkSyncStatusBij(db, user.id, body.bron, {
      rechten: body.rechten,
      laatsteSync: heeftData ? new Date().toISOString() : undefined,
      laatsteFout: body.fout,
    })
    return json({ ok: true, opgeslagen: dagen.opgeslagen, workouts: workouts.opgeslagen, overgeslagen: body.overgeslagen })
  } catch (err) {
    console.error('[health/sync]', err)
    await werkSyncStatusBij(db, user.id, body.bron, { laatsteFout: 'Opslaan op de server mislukt' })
    return json({ error: 'Opslaan mislukt' }, 500)
  }
}
