import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function isValidUrl(v: string | undefined): v is string {
  return !!v && v !== 'undefined' && v.startsWith('http')
}

function getClient(): SupabaseClient {
  if (!_client) {
    const url = isValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? process.env.NEXT_PUBLIC_SUPABASE_URL!
      : 'https://placeholder.supabase.co'
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined')
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : 'placeholder-anon-key'
    _client = createClient(url, key)
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_: SupabaseClient, prop: string | symbol) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
