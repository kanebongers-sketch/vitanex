// ─── Club, voortgang: lezen en schrijven (SERVER-ONLY) ──────────────────────
// Elke query filtert op user_id (de sportschool). Een leesfout wordt gelogd en
// komt als melding in `fouten`, zodat het scherm de rest nog kan tonen.

import type { SupabaseClient } from '@supabase/supabase-js'
import { INTAKE_KOLOMMEN, intakeUitRij, type Intake } from '@/lib/club/training/intake-rij'
import { isUuid } from '@/lib/club/training/typen'
import { METING_KOLOMMEN, metingKolommen, metingUitRij, type Meting, type MetingInvoer, type MetingVelden } from './meting'
import type { VoortgangData } from './model'
import { puntUitIntake, puntUitMeting } from './tijdlijn'

const WEKEN_TERUG = 26

function meld(wat: string, fout: { message: string }): void {
  console.error(`[club/voortgang] ${wat} mislukt`, fout.message)
}

async function leesMetingen(admin: SupabaseClient, userId: string, lidId: string): Promise<Meting[] | null> {
  const { data, error } = await admin
    .from('club_metingen')
    .select(METING_KOLOMMEN)
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .order('datum', { ascending: false })
    .order('aangemaakt_op', { ascending: false })
    .limit(300)
  if (error) {
    meld('metingen lezen', error)
    return null
  }
  return (data ?? []).map(metingUitRij).filter((m): m is Meting => m !== null)
}

async function leesIntakes(admin: SupabaseClient, userId: string, lidId: string): Promise<Intake[] | null> {
  const { data, error } = await admin.from('club_intakes').select(INTAKE_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).order('datum').limit(50)
  if (error) {
    meld('intakes lezen', error)
    return null
  }
  return (data ?? []).map(intakeUitRij).filter((i): i is Intake => i !== null)
}

async function leesTrainingen(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<{ ops: string[]; totaal: number } | null> {
  const vanaf = new Date(nu.getTime() - WEKEN_TERUG * 7 * 86_400_000).toISOString()
  const [recent, alles] = await Promise.all([
    admin.from('club_trainingslog').select('op').eq('user_id', userId).eq('lid_id', lidId).gte('op', vanaf).order('op', { ascending: false }).limit(500),
    admin.from('club_trainingslog').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lid_id', lidId),
  ])
  const fout = recent.error ?? alles.error
  if (fout) {
    meld('trainingen lezen', fout)
    return null
  }
  const ops = (recent.data ?? []).map((r: { op: unknown }) => r.op).filter((op): op is string => typeof op === 'string')
  return { ops, totaal: alles.count ?? ops.length }
}

/** Alles voor de voortgang van een lid. Het lid moet al gecontroleerd zijn (hoort bij userId). */
export async function haalVoortgang(admin: SupabaseClient, userId: string, lidId: string, nu = new Date()): Promise<VoortgangData> {
  const [metingen, intakes, trainingen] = await Promise.all([
    leesMetingen(admin, userId, lidId),
    leesIntakes(admin, userId, lidId),
    leesTrainingen(admin, userId, lidId, nu),
  ])
  const fouten = [
    ...(metingen === null ? ['metingen'] : []),
    ...(intakes === null ? ['intakes'] : []),
    ...(trainingen === null ? ['trainingen'] : []),
  ]
  return {
    lidId,
    punten: [...(intakes ?? []).map(puntUitIntake), ...(metingen ?? []).map(puntUitMeting)],
    metingen: metingen ?? [],
    trainingen: trainingen?.ops ?? [],
    totaalTrainingen: trainingen?.totaal ?? 0,
    fouten,
  }
}

/** Een losse meting van deze sportschool, of null. */
export async function haalMeting(admin: SupabaseClient, userId: string, id: string): Promise<Meting | null> {
  if (!isUuid(id)) return null
  const { data, error } = await admin.from('club_metingen').select(METING_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) meld('meting lezen', error)
  return error ? null : metingUitRij(data)
}

/** Een nieuwe meting. `wie` vroeg de toestemming van het lid: dat leggen we met het tijdstip vast (AVG). */
export async function voegMetingToe(admin: SupabaseClient, userId: string, m: MetingInvoer, wie: string): Promise<boolean> {
  const { error } = await admin.from('club_metingen').insert({
    ...metingKolommen(m),
    user_id: userId,
    lid_id: m.lidId,
    toestemming_op: new Date().toISOString(),
    toestemming_door: wie.slice(0, 80),
  })
  if (error) meld('meting opslaan', error)
  return !error
}

export async function werkMetingBij(admin: SupabaseClient, userId: string, id: string, v: MetingVelden): Promise<boolean> {
  const { error } = await admin
    .from('club_metingen')
    .update({ ...metingKolommen(v), bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
  if (error) meld('meting wijzigen', error)
  return !error
}

export async function verwijderMeting(admin: SupabaseClient, userId: string, id: string): Promise<boolean> {
  const { error } = await admin.from('club_metingen').delete().eq('user_id', userId).eq('id', id)
  if (error) meld('meting verwijderen', error)
  return !error
}
