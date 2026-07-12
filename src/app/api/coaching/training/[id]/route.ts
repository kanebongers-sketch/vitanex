import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import { deactiveerSchema } from '@/lib/coaching/training-server'

// DELETE /api/coaching/training/[id]  → coach deactiveert een door hem toegewezen schema
// Eigenaarschap (toegewezen_door = ingelogde coach) wordt in de query afgedwongen.
// We deactiveren i.p.v. hard-deleten zodat gelinkte training_logs behouden blijven.

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const { id } = await params
  const resultaat = await deactiveerSchema(admin, user.id, id)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ succes: true })
}
