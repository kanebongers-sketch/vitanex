import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || url === 'undefined') throw new Error('NEXT_PUBLIC_SUPABASE_URL is niet geconfigureerd.')
  if (!serviceKey || serviceKey === 'undefined') throw new Error('SUPABASE_SERVICE_ROLE_KEY is niet geconfigureerd.')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
