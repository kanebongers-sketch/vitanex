import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import { wijzigContent, verwijderContent, type ContentPatchInput } from '@/lib/coaching/content-server'

// PATCH  /api/coaching/content/[id]  → coach wijzigt/publiceert eigen content
// DELETE /api/coaching/content/[id]  → coach verwijdert eigen content
// Eigenaarschap (coach_id = ingelogde coach) wordt in de query afgedwongen.

export async function PATCH(
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

  let body: ContentPatchInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const resultaat = await wijzigContent(admin, user.id, id, body)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ content: resultaat.content })
}

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
  const resultaat = await verwijderContent(admin, user.id, id)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ succes: true })
}
