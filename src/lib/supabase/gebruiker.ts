// ─── Supabase met de sessie van de gebruiker (SERVER-ONLY) ──────────────────
// Voor de /1-API's: elke query loopt via de sessie van de ingelogde gebruiker,
// zodat de RLS-policies van de database gelden. Nooit de service-role: een fout
// in een route kan dan hooguit je eigen rijen raken, niet die van een ander.

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'

export interface GebruikerSessie {
  user: User
  db: SupabaseClient
}

/** De gebruiker + een RLS-gebonden client, of null als het token ontbreekt of ongeldig is. */
export async function gebruikerSessie(req: NextRequest): Promise<GebruikerSessie | null> {
  const user = await getAuthenticatedUser(req)
  if (!user) return null
  const token = req.headers.get('authorization')?.slice(7).trim()
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL of NEXT_PUBLIC_SUPABASE_ANON_KEY ontbreekt')

  const db = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return { user, db }
}
