// ─── MentaForce — pijler-week (server) ──────────────────────────────────────
// Beantwoordt één vraag per dag: VOOR WELKE PIJLERS IS ER DATA GELOGD?
// Dit is bewust geen score (dat doet `pijlers-server.ts`) maar een aanwezigheids-
// vlag — de 7-daagse strip in de navigatie toont logging-gedrag, geen oordeel.
//
// De tabel-/kolom-mapping is IDENTIEK aan `pijlers-server.ts`, dat geverifieerd
// is tegen de live database. Wijkt die af, dan zou de sidebar iets anders
// beweren dan Home — precies de incoherentie die we opruimen.
//
// Eerlijkheid: een bron die faalt is NOOIT "niet gelogd". Bij een fout gooien we,
// zodat de route 500't en de widget niets toont in plaats van een verkeerd beeld.

import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { PijlerKey } from './pijlers'
import { PIJLER_KEYS } from './pijlers'
import { amsterdamDatum, dagenGeleden, weekDatums, WEEK_DAGEN, type PijlerWeekDag } from './week'

// ── Interne rij-types (alleen de kolommen die we selecteren) ────────────────
interface DatumRow { datum: string | null }
interface StressRow { aangemaakt_op: string | null }
interface StemmingRow extends DatumRow { stemming: number | null; energie: number | null }
interface StappenRow extends DatumRow { stappen: number | null }
interface NativeRow extends StappenRow { slaap_minuten: number | null }

interface BronResultaat {
  data: unknown[] | null
  error: PostgrestError | null
}

/** Rijen van een bron, of een harde fout als die bron niet gelezen kon worden. */
function rijen<T>(res: BronResultaat, bron: string): T[] {
  if (res.error) {
    // Stil doorgaan zou de dag als "niets gelogd" tekenen terwijl er wél data is.
    throw new Error(`Pijler-week: bron '${bron}' mislukt — ${res.error.message}`)
  }
  return (res.data ?? []) as T[]
}

/**
 * Voor elke dag van de afgelopen week: welke van de 6 canonieke pijlers hebben
 * die dag data. Gooit als een bron onleesbaar is (zie module-comment).
 */
export async function haalPijlerWeek(
  admin: SupabaseClient,
  userId: string,
): Promise<PijlerWeekDag[]> {
  const datums = weekDatums()
  const vanaf = datums[0] ?? dagenGeleden(WEEK_DAGEN - 1)
  const tot = datums[datums.length - 1] ?? dagenGeleden(0)

  // stress_logs heeft geen `datum`-kolom, alleen `aangemaakt_op` (migratie 015).
  // UTC-middernacht ligt vóór de Amsterdamse: het venster is dus eerder te ruim
  // dan te krap. Te ruim is veilig (die rijen vallen buiten de dagmap), te krap
  // zou echte logs als "niet gelogd" tonen.
  const vanafTs = `${vanaf}T00:00:00.000Z`

  const [
    slaapRes, stressRes, stemmingRes, dagmetingenRes,
    nativeRes, trainingRes, waterRes, voedingRes,
  ] = await Promise.all([
    admin.from('slaap_logs').select('datum').eq('user_id', userId).gte('datum', vanaf).lte('datum', tot),
    admin.from('stress_logs').select('aangemaakt_op').eq('user_id', userId).gte('aangemaakt_op', vanafTs),
    // Filteren op `aangemaakt_op` (daar ligt de index, migratie 015), bucketen op
    // `datum` — de dag die de gebruiker zelf bedoelde. Identiek aan pijlers-server.
    admin.from('stemming_logs').select('datum, stemming, energie').eq('user_id', userId).gte('aangemaakt_op', vanafTs),
    admin.from('dagmetingen').select('datum, stappen').eq('user_id', userId).gte('datum', vanaf).lte('datum', tot),
    admin.from('health_native_logs').select('datum, stappen, slaap_minuten').eq('user_id', userId).gte('datum', vanaf).lte('datum', tot),
    admin.from('training_logs').select('datum').eq('user_id', userId).gte('datum', vanaf).lte('datum', tot),
    admin.from('water_logs').select('datum').eq('user_id', userId).gte('datum', vanaf).lte('datum', tot),
    admin.from('voeding_logs').select('datum').eq('user_id', userId).gte('datum', vanaf).lte('datum', tot),
  ])

  const gelogd = new Map<string, Set<PijlerKey>>(datums.map((d) => [d, new Set<PijlerKey>()]))

  // Onbekende of lege datums vallen er hier stil uit: die horen niet in de strip.
  const markeer = (datum: string | null, key: PijlerKey): void => {
    if (!datum) return
    gelogd.get(datum)?.add(key)
  }

  // Slaap — eigen log, aangevuld met wearable-slaap (pijlers-server doet hetzelfde).
  for (const r of rijen<DatumRow>(slaapRes, 'slaap_logs')) markeer(r.datum, 'slaap')

  // Stress — enige bron met een tijdstempel i.p.v. een dag.
  for (const r of rijen<StressRow>(stressRes, 'stress_logs')) {
    if (r.aangemaakt_op) markeer(amsterdamDatum(new Date(r.aangemaakt_op)), 'stress')
  }

  // Stemming + energie — beide uit stemming_logs, elk met een eigen kolom.
  // Alleen een ingevulde kolom telt: `energie` is optioneel (migratie 015).
  for (const r of rijen<StemmingRow>(stemmingRes, 'stemming_logs')) {
    if (r.stemming !== null) markeer(r.datum, 'stemming')
    if (r.energie !== null) markeer(r.datum, 'energie')
  }

  // Beweging — handmatige stappen, wearable-stappen of een training.
  for (const r of rijen<StappenRow>(dagmetingenRes, 'dagmetingen')) {
    if (r.stappen !== null) markeer(r.datum, 'beweging')
  }
  for (const r of rijen<NativeRow>(nativeRes, 'health_native_logs')) {
    if (r.stappen !== null) markeer(r.datum, 'beweging')
    if (r.slaap_minuten !== null) markeer(r.datum, 'slaap')
  }
  for (const r of rijen<DatumRow>(trainingRes, 'training_logs')) markeer(r.datum, 'beweging')

  // Voeding — hydratatie én maaltijden voeden dezelfde pijler.
  for (const r of rijen<DatumRow>(waterRes, 'water_logs')) markeer(r.datum, 'voeding')
  for (const r of rijen<DatumRow>(voedingRes, 'voeding_logs')) markeer(r.datum, 'voeding')

  return datums.map((datum) => ({
    datum,
    // Canonieke volgorde vasthouden: de POSITIE van een segment identificeert de
    // pijler (er is geen kleurcodering), dus die mag nooit van de data afhangen.
    gelogd: PIJLER_KEYS.filter((k) => gelogd.get(datum)?.has(k) ?? false),
  }))
}
