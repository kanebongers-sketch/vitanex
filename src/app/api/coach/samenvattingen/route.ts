import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data } = await admin
    .from('coach_samenvattingen')
    .select('id, week_start, samenvatting, aangemaakt_op')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(12)

  return NextResponse.json({ samenvattingen: data ?? [] })
}
