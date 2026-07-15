import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser, isFounder } from '@/lib/auth/api-auth'

// POST /api/admin/testrol
// Laat UITSLUITEND de founder tussen rollen wisselen om de app als
// medewerker/hr/coach te testen. De schrijfactie loopt via de service-role,
// omdat de guard-trigger op `profiles` client-side rol-escalatie blokkeert
// (migratie 044). Zo blijft testen mogelijk zonder het privilege-gat.
//
// Body: { rol: 'admin'|'hr'|'medewerker'|'coach', bedrijf_id?: string | null }
// Headers: Authorization: Bearer <supabase-jwt>

const GELDIGE_ROLLEN = new Set(['admin', 'hr', 'medewerker', 'coach'])

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!isFounder(user)) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  let body: { rol?: string; bedrijf_id?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige body.' }, { status: 400 })
  }

  const rol = body.rol
  if (!rol || !GELDIGE_ROLLEN.has(rol)) {
    return NextResponse.json({ error: 'Ongeldige rol.' }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Serverconfiguratie ontbreekt.' }, { status: 500 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const update: Record<string, unknown> = { rol }
  if (body.bedrijf_id !== undefined) update.bedrijf_id = body.bedrijf_id

  const { error } = await admin.from('profiles').update(update).eq('id', user.id)
  if (error) {
    return NextResponse.json({ error: 'Wisselen mislukt.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rol })
}
