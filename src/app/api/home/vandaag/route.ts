// GET /api/home/vandaag — wat heb je vandaag al gelogd?
//
// Voedt de "Te doen vandaag"-sectie op de home: per leefgebied of er vandaag
// (NL-tijd) al een log is. Eerlijk en concreet — het dashboard weet zo wat je nog
// kunt doen i.p.v. alleen een score te tonen. Puur lezen; geen zij-effecten.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { vandaagNL, dagstartUtcNL } from '@/lib/utils/date-nl'
import { effectieveDoelen } from '@/lib/health/gezondheid-berekeningen'

export const dynamic = 'force-dynamic'

/** True als de (al gefilterde) count-query ≥1 rij oplevert. */
async function heeftRij(query: PromiseLike<{ count: number | null }>): Promise<boolean> {
  const { count } = await query
  return (count ?? 0) > 0
}

export interface VandaagStatus {
  /** Stemming + energie samen ("hoe voel je je?"). */
  gevoel: boolean
  stress: boolean
  slaap: boolean
  voeding: boolean
  /** Stappen vandaag t.o.v. het persoonlijke dagdoel. */
  stappen: { waarde: number; doel: number }
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const db = createAdminClient()
  const vandaag = vandaagNL()
  const dagstart = dagstartUtcNL()
  const uid = user.id

  /** Bestaat er vandaag (op `datum`) een rij in deze tabel? */
  const opDatum = (tabel: string) =>
    heeftRij(db.from(tabel).select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('datum', vandaag))

  /** Stappen vandaag uit één tabel (dagmetingen of native), of 0. */
  const stappenVan = (tabel: string) =>
    db.from(tabel).select('stappen').eq('user_id', uid).eq('datum', vandaag).maybeSingle()
      .then(({ data }) => (data && typeof data.stappen === 'number' ? data.stappen : 0))

  const [gevoel, stress, slaap, voeding, water, stapDag, stapNative, profielRes] = await Promise.all([
    opDatum('stemming_logs'),
    heeftRij(db.from('stress_logs').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('aangemaakt_op', dagstart)),
    opDatum('slaap_logs'),
    opDatum('voeding_logs'),
    opDatum('water_logs'),
    stappenVan('dagmetingen'),
    stappenVan('health_native_logs'),
    db.from('profiles').select('gewicht_kg, lengte_cm, geboortedatum, geslacht, activiteitsniveau, fitness_doel, stappen_doel').eq('id', uid).maybeSingle(),
  ])

  const p = profielRes.data
  const doel = effectieveDoelen({
    gewicht_kg: p?.gewicht_kg ?? null, lengte_cm: p?.lengte_cm ?? null, geboortedatum: p?.geboortedatum ?? null,
    geslacht: p?.geslacht ?? null, activiteitsniveau: p?.activiteitsniveau ?? null, fitness_doel: p?.fitness_doel ?? null,
    stappen_doel: p?.stappen_doel ?? null,
  })

  const status: VandaagStatus = {
    gevoel,
    stress,
    slaap,
    voeding: voeding || water,
    stappen: { waarde: Math.max(stapDag, stapNative), doel: doel.stappen_doel },
  }
  return NextResponse.json(status, { headers: { 'Cache-Control': 'private, no-store' } })
}
