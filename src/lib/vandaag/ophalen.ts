// ─── MentaForce /1 — feiten ophalen (SERVER-ONLY) ───────────────────────────
// Leest alles wat de Vandaag-kaart nodig heeft, met de RLS-gebonden client van
// de gebruiker (src/lib/supabase/gebruiker.ts). Elke bron is best-effort: valt
// er één om, dan is dat veld leeg en zwijgt de kaart erover. Een lege bron is
// nooit een nul.
//
// Bronnen (allemaal al bestaande tabellen, plus het weekplan uit migratie 052):
//   slaap     health_native_logs.slaap_minuten (telefoon/horloge), anders slaap_logs.uren_slaap
//   stappen   health_native_logs.stappen en dagmetingen.stappen (de hoogste per dag)
//   check-in  stemming_logs (stemming, energie, stress: 1–5) van vandaag
//   plan      vandaag_plan (weekdag → training)
//   bedtijd   profiles.slaap_streefbedtijd
//   herstel   health_native_logs.rusthartslag en hrv_ms (horloge)

import type { SupabaseClient } from '@supabase/supabase-js'
import { dagPlus, dagVan, opMoment, weekdag } from '@/lib/lifeos/blokken/tijd'
import { NORMAAL_DAGEN } from './normaal'
import type { CheckIn, Feiten, Herstel, Intensiteit, PlanDag } from './types'

type Rij = Record<string, unknown>

function rijen(data: unknown): Rij[] {
  return Array.isArray(data) ? (data.filter((r) => typeof r === 'object' && r !== null) as Rij[]) : []
}

function getal(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Per dag één waarde: de hoogste (twee bronnen voor dezelfde dag tellen niet dubbel). */
function perDag(bronnen: readonly { datum: unknown; waarde: number | null }[]): Map<string, number> {
  const uit = new Map<string, number>()
  for (const { datum, waarde } of bronnen) {
    if (typeof datum !== 'string' || waarde === null || waarde <= 0) continue
    const dag = datum.slice(0, 10)
    uit.set(dag, Math.max(uit.get(dag) ?? 0, waarde))
  }
  return uit
}

/** Historie vóór `vanaf` (exclusief), nieuwste eerst. */
function historie(map: Map<string, number>, vanaf: string): number[] {
  return [...map.entries()]
    .filter(([dag]) => dag < vanaf)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([, w]) => w)
}

function leesPlanDag(r: Rij | undefined): PlanDag | null {
  if (!r || typeof r.soort !== 'string') return null
  const intensiteit: Intensiteit = r.intensiteit === 'licht' ? 'licht' : 'zwaar'
  const tijd = typeof r.tijd === 'string' ? r.tijd.slice(0, 5) : null
  return { soort: r.soort, intensiteit, tijd }
}

function leesCheckIn(r: Rij | undefined): CheckIn | null {
  const stemming = getal(r?.stemming)
  if (!r || stemming === null) return null
  return { stemming, energie: getal(r.energie), stress: getal(r.stress) }
}

/**
 * Rusthartslag en HRV: de meting van vandaag, anders die van gisteren (de
 * horloge-sync loopt soms achter). Historie = de dagen daarvóór.
 */
function leesHerstel(nativeRijen: Rij[], vandaag: string, gisteren: string): Herstel | null {
  const hartslag = perDag(nativeRijen.map((r) => ({ datum: r.datum, waarde: getal(r.rusthartslag) })))
  const hrv = perDag(nativeRijen.map((r) => ({ datum: r.datum, waarde: getal(r.hrv_ms) })))
  if (hartslag.size === 0 && hrv.size === 0) return null
  const dag = hartslag.has(vandaag) || hrv.has(vandaag) ? vandaag : gisteren
  return {
    rustHartslag: hartslag.get(dag) ?? null,
    rustHartslagHistorie: historie(hartslag, dag),
    hrv: hrv.get(dag) ?? null,
    hrvHistorie: historie(hrv, dag),
  }
}

export async function haalFeiten(db: SupabaseClient, userId: string, nu: Date = new Date()): Promise<Feiten> {
  const vandaag = dagVan(nu)
  const gisteren = dagPlus(vandaag, -1)
  const vanaf = dagPlus(vandaag, -NORMAAL_DAGEN - 1)
  const begin = opMoment(vandaag, 0).toISOString()

  const [native, slaap, metingen, stemming, plan, profiel] = await Promise.all([
    db.from('health_native_logs').select('datum, stappen, slaap_minuten, rusthartslag, hrv_ms').eq('user_id', userId).gte('datum', vanaf),
    db.from('slaap_logs').select('datum, uren_slaap').eq('user_id', userId).gte('datum', vanaf),
    db.from('dagmetingen').select('datum, stappen').eq('user_id', userId).gte('datum', vanaf),
    db
      .from('stemming_logs')
      .select('stemming, energie, stress, aangemaakt_op')
      .eq('user_id', userId)
      .gte('aangemaakt_op', begin)
      .order('aangemaakt_op', { ascending: false })
      .limit(1),
    db.from('vandaag_plan').select('weekdag, soort, intensiteit, tijd').eq('user_id', userId),
    db.from('profiles').select('slaap_streefbedtijd').eq('id', userId).maybeSingle(),
  ])

  const nativeRijen = native.error ? [] : rijen(native.data)
  const slaapMap = perDag([
    ...nativeRijen.map((r) => ({ datum: r.datum, waarde: getal(r.slaap_minuten) })),
    ...(slaap.error ? [] : rijen(slaap.data)).map((r) => {
      const uren = getal(r.uren_slaap)
      return { datum: r.datum, waarde: uren === null ? null : Math.round(uren * 60) }
    }),
  ])
  const stappenMap = perDag([
    ...nativeRijen.map((r) => ({ datum: r.datum, waarde: getal(r.stappen) })),
    ...(metingen.error ? [] : rijen(metingen.data)).map((r) => ({ datum: r.datum, waarde: getal(r.stappen) })),
  ])

  const herstel = leesHerstel(nativeRijen, vandaag, gisteren)
  const planRijen = plan.error ? [] : rijen(plan.data)
  const vandaagWeekdag = weekdag(vandaag)
  const streef = profiel.error ? null : (profiel.data as Rij | null)?.slaap_streefbedtijd

  return {
    datum: vandaag,
    slaapMinuten: slaapMap.get(vandaag) ?? null,
    slaapHistorie: historie(slaapMap, vandaag),
    stappenGisteren: stappenMap.get(gisteren) ?? null,
    stappenHistorie: historie(stappenMap, gisteren),
    checkin: stemming.error ? null : leesCheckIn(rijen(stemming.data)[0]),
    training: leesPlanDag(planRijen.find((r) => getal(r.weekdag) === vandaagWeekdag)),
    heeftPlan: planRijen.length > 0,
    bedtijdStreef: typeof streef === 'string' ? streef.slice(0, 5) : null,
    // De agenda op het toestel komt met de app (Capacitor); op het web nog niet.
    afspraken: null,
    // Een trainer koppelen komt in een volgende stap.
    grenzen: null,
    herstel,
  }
}
