import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { z } from 'zod'

type Persona = 'stoicijn' | 'optimizer' | 'mentor' | 'challenger' | 'wetenschapper'

const updateSchema = z.object({
  persona: z.enum(['stoicijn', 'optimizer', 'mentor', 'challenger', 'wetenschapper']).optional(),
  onboarding_goal: z.string().max(200).optional(),
})

const PERSONA_XP_PER_LEVEL = 500

function levelFromXp(xp: number): number {
  return Math.floor(xp / PERSONA_XP_PER_LEVEL) + 1
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: companion, error } = await admin
    .from('vita_companions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Database fout.' }, { status: 500 })
  }

  if (!companion) {
    const { data: created, error: insertError } = await admin
      .from('vita_companions')
      .insert({ user_id: user.id, persona: 'mentor', level: 1, xp_total: 0 })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Kon companion niet aanmaken.' }, { status: 500 })
    }

    return NextResponse.json(created, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    })
  }

  const level = levelFromXp(companion.xp_total)
  if (level !== companion.level) {
    await admin.from('vita_companions').update({ level }).eq('id', companion.id)
    companion.level = level
  }

  return NextResponse.json(companion, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige invoer.', details: parsed.error.flatten() }, { status: 422 })
  }

  const admin = createAdminClient()
  const updates: Partial<{ persona: Persona; onboarding_goal: string }> = {}

  if (parsed.data.persona) updates.persona = parsed.data.persona
  if (parsed.data.onboarding_goal !== undefined) updates.onboarding_goal = parsed.data.onboarding_goal

  const { data, error } = await admin
    .from('vita_companions')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Update mislukt.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
