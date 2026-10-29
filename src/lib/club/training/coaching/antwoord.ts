// ─── Club, training: coaching van oefeningen als API-antwoord (SERVER-ONLY) ──
// Gedeeld door /api/club/training/coaching (Club en de voorvertoning) en
// /api/club/lid/coaching (de ledenapp). Alleen coaching van de eigen
// sportschool (user_id) of de standaardcoaching; nooit iets van een lid.
//   ?naam=Back%20squat                  { coaching, eigen }
//   ?kern=Back%20squat&kern=Lat%20pulldown  { kernpunten }

import type { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { coachingSleutel, coachingVoor } from './index'
import { coachingUitRij } from './invoer'
import type { Coaching } from './typen'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { standaardCoachingIn } from '@/lib/aiyourgym/taal/woorden/club/coaching'

const MAX_NAAM = 80
const MAX_KERN = 60

interface Bron {
  admin: SupabaseClient
  userId: string
}

/** Eigen coaching van de sportschool, per naam (kleine letters). Een query voor alle gevraagde namen. */
async function eigenCoaching(s: Bron, namen: readonly string[]): Promise<Map<string, Coaching>> {
  const { data, error } = await s.admin.from('club_oefeningen').select('naam, coaching').eq('user_id', s.userId).not('coaching', 'is', null).in('naam', [...namen])
  if (error) console.error('[club/training] eigen coaching lezen mislukt', error.message)
  const uit = new Map<string, Coaching>()
  for (const rij of data ?? []) {
    const c = coachingUitRij(rij.coaching)
    if (c && typeof rij.naam === 'string') uit.set(coachingSleutel(rij.naam), c)
  }
  return uit
}

// De standaardcoaching in de taal van de gebruiker (cookie ayg-taal); eigen coaching van de sportschool blijft zoals hij is geschreven.
export async function coachingAntwoord(s: Bron, zoek: URLSearchParams): Promise<NextResponse> {
  const taal = await getTaal()
  const kern = zoek.getAll('kern').map((n) => n.trim()).filter(Boolean)
  if (kern.length > 0) {
    if (kern.length > MAX_KERN || kern.some((n) => n.length > MAX_NAAM)) return clubFout('Te veel oefeningen.', 400)
    const eigen = await eigenCoaching(s, kern)
    const kernpunten = Object.fromEntries(
      kern.flatMap((naam) => {
        const c = eigen.get(coachingSleutel(naam)) ?? standaardCoachingIn(naam, coachingVoor(naam), taal)
        return c ? [[naam, c.kernpunten.map((k) => k.punt)]] : []
      }),
    )
    return clubJson({ kernpunten })
  }
  const naam = zoek.get('naam')?.trim() ?? ''
  if (!naam || naam.length > MAX_NAAM) return clubFout('Onbekende oefening.', 400)
  const eigen = (await eigenCoaching(s, [naam])).get(coachingSleutel(naam))
  return clubJson({ coaching: eigen ?? standaardCoachingIn(naam, coachingVoor(naam), taal), eigen: eigen !== undefined })
}
