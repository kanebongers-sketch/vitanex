import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/hr-code/koppel
// Body: { code: "FIT-X2K" }
// Headers: Authorization: Bearer <supabase-jwt>
//
// Koppelt de ingelogde user aan het bedrijf dat bij de code hoort.
// Werkt ook tijdens registratie als de JWT al beschikbaar is na signUp.

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  // Client met de user-JWT zodat RLS van toepassing is
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ fout: 'Ongeldige sessie.' }, { status: 401 })
  }

  // ── 2. Body valideren ────────────────────────────────────────────────────
  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ fout: 'Ongeldige JSON body.' }, { status: 400 })
  }

  const code = body.code?.toUpperCase().trim()
  if (!code || !/^[A-Z]{3}-[0-9][A-Z][0-9]$/.test(code)) {
    return NextResponse.json(
      { fout: 'Ongeldige code-opmaak. Gebruik formaat AAA-9A9 (bijv. FIT-X2K).' },
      { status: 400 }
    )
  }

  // ── 3. Bedrijf ophalen via service role (omzeilt RLS read-beperking) ──────
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: bedrijf, error: bedrijfError } = await supabaseService
    .from('bedrijven')
    .select('id, naam, hr_code_actief')
    .eq('hr_code', code)
    .single()

  if (bedrijfError || !bedrijf) {
    return NextResponse.json({ fout: 'Onbekende HR code.' }, { status: 404 })
  }

  if (!bedrijf.hr_code_actief) {
    return NextResponse.json(
      { fout: 'Deze HR code is gedeactiveerd. Neem contact op met je HR-afdeling.' },
      { status: 410 }
    )
  }

  // ── 4. Controleer of de user al aan een bedrijf gekoppeld is ─────────────
  const { data: profiel } = await supabaseService
    .from('profiles')
    .select('bedrijf_id, rol')
    .eq('id', user.id)
    .single()

  if (profiel?.bedrijf_id) {
    return NextResponse.json(
      { fout: 'Je bent al gekoppeld aan een bedrijf. Ontkoppel eerst via Instellingen.' },
      { status: 409 }
    )
  }

  // HR-gebruikers koppelen zichzelf niet via een werknemers-code
  if (profiel?.rol === 'hr') {
    return NextResponse.json(
      { fout: 'HR-gebruikers worden niet via een code gekoppeld.' },
      { status: 403 }
    )
  }

  // ── 5. Koppeling uitvoeren: profiles.bedrijf_id bijwerken ─────────────────
  const { error: updateError } = await supabaseService
    .from('profiles')
    .update({ bedrijf_id: bedrijf.id })
    .eq('id', user.id)

  if (updateError) {
    console.error('[hr-code/koppel] profiles update fout:', updateError)
    return NextResponse.json({ fout: 'Koppeling mislukt. Probeer opnieuw.' }, { status: 500 })
  }

  // ── 6. Auditlog ──────────────────────────────────────────────────────────
  // upsert zodat dubbele aanroepen geen fout geven
  await supabaseService
    .from('hr_code_logs')
    .upsert({ bedrijf_id: bedrijf.id, user_id: user.id }, { onConflict: 'user_id' })

  return NextResponse.json({
    succes: true,
    bedrijf_id: bedrijf.id,
    bedrijfsnaam: bedrijf.naam,
  })
}
