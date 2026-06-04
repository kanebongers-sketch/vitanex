import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ──────────────────────────────────────────────────────────────────────────
// GET /api/hr-code?code=FIT-X2K
// Publiek – geen auth vereist.
// Retourneert { ok: true, bedrijf_naam, bedrijf_id } of { ok: false, fout }
// ──────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim()

  if (!code || !/^[A-Z]{3}-[0-9][A-Z][0-9]$/.test(code)) {
    return NextResponse.json(
      { ok: false, fout: 'Ongeldige code-opmaak. Gebruik formaat AAA-9A9 (bijv. FIT-X2K).' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('bedrijven')
    .select('id, naam, hr_code_actief')
    .eq('hr_code', code)
    .single()

  if (error || !data) {
    return NextResponse.json({ ok: false, fout: 'Onbekende HR code.' }, { status: 404 })
  }

  if (!data.hr_code_actief) {
    return NextResponse.json(
      { ok: false, fout: 'Deze HR code is gedeactiveerd. Neem contact op met je HR-afdeling.' },
      { status: 410 }
    )
  }

  return NextResponse.json({ ok: true, bedrijf_id: data.id, bedrijf_naam: data.naam })
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/hr-code
// Body: { code: "FIT-X2K", user_id?: string }
// Headers: Authorization: Bearer <supabase-jwt>
//
// Koppelt de ingelogde user (of opgegeven user_id) aan het bedrijf.
// ──────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, fout: 'Niet ingelogd.' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ ok: false, fout: 'Ongeldige sessie.' }, { status: 401 })
  }

  // ── 2. Body valideren ────────────────────────────────────────────────────
  let body: { code?: string; user_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, fout: 'Ongeldige JSON body.' }, { status: 400 })
  }

  const code = body.code?.toUpperCase().trim()
  if (!code || !/^[A-Z]{3}-[0-9][A-Z][0-9]$/.test(code)) {
    return NextResponse.json(
      { ok: false, fout: 'Ongeldige code-opmaak. Gebruik formaat AAA-9A9 (bijv. FIT-X2K).' },
      { status: 400 }
    )
  }

  // Gebruik altijd de ingelogde user — accepteer geen afwijkende user_id van de client
  const targetUserId = user.id

  // ── 3. Service role client ────────────────────────────────────────────────
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── 4. Bedrijf ophalen ────────────────────────────────────────────────────
  const { data: bedrijf, error: bedrijfError } = await supabaseService
    .from('bedrijven')
    .select('id, naam, hr_code_actief')
    .eq('hr_code', code)
    .single()

  if (bedrijfError || !bedrijf) {
    return NextResponse.json({ ok: false, fout: 'Onbekende HR code.' }, { status: 404 })
  }

  if (!bedrijf.hr_code_actief) {
    return NextResponse.json(
      { ok: false, fout: 'Deze HR code is gedeactiveerd. Neem contact op met je HR-afdeling.' },
      { status: 410 }
    )
  }

  // ── 5. Controleer profiel ─────────────────────────────────────────────────
  const { data: profiel } = await supabaseService
    .from('profiles')
    .select('bedrijf_id, rol')
    .eq('id', targetUserId)
    .single()

  if (profiel?.bedrijf_id) {
    return NextResponse.json(
      { ok: false, fout: 'Je bent al gekoppeld aan een bedrijf. Ontkoppel eerst via Instellingen.' },
      { status: 409 }
    )
  }

  if (profiel?.rol === 'hr') {
    return NextResponse.json(
      { ok: false, fout: 'HR-gebruikers worden niet via een code gekoppeld.' },
      { status: 403 }
    )
  }

  // ── 6. Koppeling uitvoeren ────────────────────────────────────────────────
  const { error: updateError } = await supabaseService
    .from('profiles')
    .update({ bedrijf_id: bedrijf.id })
    .eq('id', targetUserId)

  if (updateError) {
    console.error('[hr-code] profiles update fout:', updateError)
    return NextResponse.json({ ok: false, fout: 'Koppeling mislukt. Probeer opnieuw.' }, { status: 500 })
  }

  // ── 7. Auditlog ───────────────────────────────────────────────────────────
  await supabaseService
    .from('hr_code_logs')
    .upsert({ bedrijf_id: bedrijf.id, user_id: targetUserId }, { onConflict: 'user_id' })

  return NextResponse.json({
    ok: true,
    bedrijf_id: bedrijf.id,
    bedrijf_naam: bedrijf.naam,
  })
}
