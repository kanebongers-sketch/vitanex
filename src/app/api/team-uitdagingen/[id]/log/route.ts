import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { id: uitdagingId } = await params
  const { waarde, notitie }: { waarde?: number; notitie?: string } = await req.json()

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('team_uitdaging_logs')
    .insert({
      uitdaging_id: uitdagingId,
      user_id: user.id,
      datum: new Date().toISOString().split('T')[0],
      waarde: waarde ?? null,
      notitie: notitie?.trim() ?? null,
    })
    .select('id, datum, waarde')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
