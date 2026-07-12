import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function isValidUrl(v: string | undefined): v is string {
  return !!v && v !== 'undefined' && v.startsWith('http')
}

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!isValidUrl(url)) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is niet geconfigureerd of ongeldig.')
    }
    if (!key || key === 'undefined') {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is niet geconfigureerd.')
    }
    _client = createClient(url, key)
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_: SupabaseClient, prop: string | symbol) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
