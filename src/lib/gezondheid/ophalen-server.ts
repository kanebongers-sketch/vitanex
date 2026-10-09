// ─── Gezondheidsdata ophalen (SERVER-ONLY) ────────────────────────────────────
// Leest alle bronnen via de RLS-gebonden client van de gebruiker en voegt ze
// samen. De native dagrijen zijn de kern: mislukt dat, dan faalt het geheel.
// Aanvullende bronnen mogen ontbreken (bv. tabel nog niet gemigreerd); dat
// loggen we en we gaan verder met wat er wél is.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getal, voegBronnenSamen } from './samenvoegen'
import type { BronStatus, GezondheidAntwoord } from './types'

type Ruw = Record<string, unknown>

const NATIVE_KOLOMMEN = [
  'datum', 'bron', 'stappen', 'slaap_minuten', 'calorieen', 'rusthartslag', 'hrv_ms', 'vo2max',
  'gewicht_kg', 'actieve_kcal', 'beweegminuten', 'afstand_m', 'verdiepingen',
  'slaap_diep_min', 'slaap_licht_min', 'slaap_rem_min', 'slaap_wakker_min',
  'bedtijd', 'wektijd', 'ademhaling_pm', 'zuurstof_pct',
].join(', ')

export class GezondheidLeesFout extends Error {}

function rijen(data: unknown): Ruw[] {
  return Array.isArray(data) ? data.filter((r): r is Ruw => typeof r === 'object' && r !== null) : []
}

interface Resultaat { data: unknown; error: { message: string } | null }

function aanvullend(naam: string, res: Resultaat): Ruw[] {
  if (res.error) {
    console.error(`[gezondheid] ${naam} lezen mislukt`, res.error.message)
    return []
  }
  return rijen(res.data)
}

function leesBronStatus(data: Ruw[]): BronStatus[] {
  return data
    .filter((r) => typeof r.bron === 'string')
    .map((r) => ({
      bron: r.bron as string,
      laatsteSync: typeof r.laatste_sync === 'string' ? r.laatste_sync : null,
    }))
}

export async function haalGezondheidOp(
  db: SupabaseClient, userId: string, vanaf: string, vandaag: string,
): Promise<GezondheidAntwoord> {
  const [native, slaap, stappen, lichaam, workouts, status] = await Promise.all([
    db.from('health_native_logs').select(NATIVE_KOLOMMEN)
      .eq('user_id', userId).gte('datum', vanaf).lte('datum', vandaag),
    db.from('slaap_logs')
      .select('datum, uren_slaap, bedtijd, wektijd, slaap_diep_min, slaap_licht_min, slaap_rem_min, hrv_ms')
      .eq('user_id', userId).gte('datum', vanaf).lte('datum', vandaag),
    db.from('dagmetingen').select('datum, stappen')
      .eq('user_id', userId).gte('datum', vanaf).lte('datum', vandaag),
    db.from('lichaamsmetingen').select('datum, gewicht_kg')
      .eq('user_id', userId).gte('datum', vanaf).lte('datum', vandaag),
    db.from('health_workouts').select('id, bron, soort, start, eind, kcal, afstand_m, gem_hartslag')
      .eq('user_id', userId).gte('start', `${vanaf}T00:00:00Z`)
      .order('start', { ascending: false }).limit(500),
    db.from('health_sync_status').select('bron, laatste_sync').eq('user_id', userId),
  ])

  if (native.error) throw new GezondheidLeesFout(native.error.message)

  const samengevoegd = voegBronnenSamen({
    native: rijen(native.data),
    slaapLogs: aanvullend('slaap_logs', slaap),
    dagmetingen: aanvullend('dagmetingen', stappen),
    lichaamsmetingen: aanvullend('lichaamsmetingen', lichaam).filter((r) => getal(r.gewicht_kg) !== null),
    workouts: aanvullend('health_workouts', workouts),
  })

  return {
    vandaag,
    dagen: samengevoegd.dagen.filter((d) => d.datum >= vanaf && d.datum <= vandaag),
    workouts: samengevoegd.workouts.filter((w) => w.datum <= vandaag),
    bronnen: leesBronStatus(aanvullend('health_sync_status', status)),
  }
}
