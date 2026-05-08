/**
 * API route authentication helpers.
 * Verifies the Supabase JWT from the Authorization header
 * and returns the authenticated user, or null if invalid.
 */
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

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
 * Verifies the JWT and returns the user, or null on failure.
 * Uses a temporary user-scoped client so RLS is respected.
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const token = extractBearerToken(req)
  if (!token) return null

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
