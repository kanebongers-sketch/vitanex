/**
 * API route authentication helpers.
 * Verifies the Supabase JWT from the Authorization header
 * and returns the authenticated user, or null if invalid.
 */
import { createClient, type User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { maakTokenCache } from './token-cache'

/**
 * Extracts the Bearer token from the Authorization header.
 */
function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7).trim()
  return token || null
}

/**
 * Verifieert het token bij Supabase GoTrue. Dit is en blijft de enige plek waar
 * bepaald wordt of een token echt geldig is — de cache eromheen slaat alleen
 * het resultaat op, en beslist nooit zelf.
 * Gebruikt een tijdelijke user-scoped client zodat RLS gerespecteerd wordt.
 */
async function verifieerBijSupabase(token: string): Promise<User | null> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return null
  return user
}

/** Eén cache per serverinstance; zie token-cache.ts voor het veiligheidsmodel. */
const gebruikerCache = maakTokenCache<User>()

/**
 * Verifies the JWT and returns the user, or null on failure.
 *
 * Achter een korte in-memory cache (zie token-cache.ts): zonder die cache kost
 * elke API-route een eigen netwerk-RTT naar GoTrue, en één paginanavigatie
 * raakt er ~7. Een ongeldig of vervalst token wordt onverminderd afgewezen —
 * alleen geslaagde verificaties worden hergebruikt, en nooit voorbij de `exp`
 * van het token.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  const token = extractBearerToken(req)
  if (!token) return null
  return gebruikerCache.haal(token, verifieerBijSupabase)
}

/**
 * Founder-allowlist. Founder-tooling (Content-OS, de outreach-agent) is
 * uitsluitend voor de eigenaar bedoeld — niet voor medewerkers/HR van
 * klantbedrijven. Configureerbaar via FOUNDER_EMAILS (comma-separated); valt
 * terug op de bekende founder zodat bestaande deploys blijven werken.
 */
const FOUNDER_EMAILS: readonly string[] = (process.env.FOUNDER_EMAILS ?? 'kanebongers@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * True als de gebruiker in de founder-allowlist zit. Gebruik dit om
 * founder-only API-routes af te schermen (naast de RLS als defense-in-depth).
 */
export function isFounder(user: { email?: string | null } | null | undefined): boolean {
  const email = user?.email?.toLowerCase()
  return !!email && FOUNDER_EMAILS.includes(email)
}
