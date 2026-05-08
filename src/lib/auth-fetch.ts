/**
 * Authenticated fetch utility.
 * Automatically attaches the Supabase access token as a Bearer header
 * so API routes can verify the caller's identity.
 */
import { supabase } from '@/lib/supabase'

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = new Headers(init.headers)
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(input, { ...init, headers })
}
