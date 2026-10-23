// ─── Club, betalen: het slot voor lidgeld (SERVER-ONLY) ─────────────────────
// Plannen en kortingen bestaan alleen als CLUB_LIDGELD_ACTIEF aan staat EN de
// sportschool lidgeld zelf aan heeft gezet (club_betalen_accounts.lidgeld_aan).
// Het master account (Kane) ziet ze ook met alleen de schakelaar in de env, om
// te testen. Daarnaast het recht Lidmaatschappen (nooit voor een clubmanager).
// Alles daarbuiten is een gewone 404.

import { notFound } from 'next/navigation'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubFout, eisOnderdeel, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { lidgeldActief } from '../config'

export const LIDGELD_ONDERDEEL = 'lidmaatschappen'

export interface LidgeldStand {
  lidgeldAan: boolean
  /** Standaard aan: de cyclus maakt dan alleen conceptfacturen, er wordt niets geincasseerd. */
  schaduw: boolean
  incassoAan: boolean
}

export const LIDGELD_UIT: LidgeldStand = { lidgeldAan: false, schaduw: true, incassoAan: false }

/** De lidgeldschakelaars van deze sportschool, of null bij een leesfout. */
export async function haalLidgeldStand(admin: SupabaseClient, userId: string): Promise<LidgeldStand | null> {
  const { data, error } = await admin.from('club_betalen_accounts').select('lidgeld_aan, schaduw, incasso_aan').eq('user_id', userId).maybeSingle()
  if (error) {
    console.error('[club/betalen] lidgeldstand lezen mislukt', error.code ?? '', error.message)
    return null
  }
  if (!data) return LIDGELD_UIT
  return { lidgeldAan: data.lidgeld_aan === true, schaduw: data.schaduw !== false, incassoAan: data.incasso_aan === true }
}

/** Mag deze persoon bij deze sportschool plannen en kortingen zien? */
export async function lidgeldOpen(t: Pick<ClubToegang, 'admin' | 'userId' | 'isPlatformEigenaar' | 'onderdelen'>): Promise<boolean> {
  if (!lidgeldActief() || !magOnderdeel(t.onderdelen, LIDGELD_ONDERDEEL)) return false
  if (t.isPlatformEigenaar) return true
  return (await haalLidgeldStand(t.admin, t.userId))?.lidgeldAan === true
}

/** Voor een pagina: de toegang, of een gewone 404. */
export async function eisLidgeldBeheer(): Promise<ClubToegang> {
  if (!lidgeldActief()) notFound()
  const t = await eisOnderdeel(LIDGELD_ONDERDEEL)
  if (!(await lidgeldOpen(t))) notFound()
  return t
}

const REM_MAX = 60
const REM_VENSTER_MS = 60_000

/** Voor een API-route: schakelaar, toegang (zelfde oorsprong), recht, lidgeld aan en een rem per persoon. */
export async function vereisLidgeldBeheer(req: NextRequest): Promise<ClubToegang | NextResponse> {
  if (!lidgeldActief()) return clubFout('Niet gevonden.', 404)
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!(await lidgeldOpen(t))) return clubFout('Niet gevonden.', 404)
  if (isRateLimited(`club-lidgeld|${t.userId}|${t.persoonId ?? 'kane'}`, REM_MAX, REM_VENSTER_MS)) {
    return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  }
  return t
}
