import type { SupabaseClient } from '@supabase/supabase-js'
import { haalKomendeAfwijkingen } from '@/lib/club/sluiting/lezen'
import { SluitingMelding } from './SluitingMelding'

// Server Component: haalt de sluitingen van vandaag en de komende 7 dagen op
// en toont SluitingMelding. Alleen in Server Components gebruiken (leest de
// database met de admin-client). Een leesfout toont niets (en wordt gelogd).
//
//   <SluitingenBinnenkort admin={t.admin} userId={t.userId} vestiging={vestiging} />
//   <SluitingenBinnenkort admin={t.admin} userId={t.userId} vestiging={vestiging} variant="app" />

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: string
  variant?: 'club' | 'app'
}

export async function SluitingenBinnenkort({ admin, userId, vestiging, variant = 'club' }: Props) {
  const { vandaag, lijst } = await haalKomendeAfwijkingen(admin, userId, vestiging)
  return <SluitingMelding lijst={lijst} vandaag={vandaag} variant={variant} />
}
