import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import { trekUitnodigingIn } from '@/lib/coaching/uitnodiging-server'

// DELETE /api/coaching/uitnodigingen/[id] → coach trekt een openstaande uitnodiging in

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Ongeldige uitnodiging.' }, { status: 400 })

  const resultaat = await trekUitnodigingIn(admin, user.id, id)
  if (!resultaat.ok) {
    return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  }
  return NextResponse.json({ succes: true })
}
