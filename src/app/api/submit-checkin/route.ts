import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/api-auth'

type Rij = {
  vraag_code: string
  categorie: string | null
  waarde_schaal: number | null
  waarde_tekst: string | null
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: verify JWT ──────────────────────────────────────────────────────
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const { bedrijf_id, week_start, rijen } = await req.json() as {
      bedrijf_id: string | null
      week_start: string
      rijen: Rij[]
    }

    // Always use the authenticated user's ID — never trust client-supplied user_id
    const user_id = user.id

    if (!week_start) {
      return NextResponse.json({ error: 'week_start verplicht' }, { status: 400 })
    }

    // Validate week_start is a valid date in YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
      return NextResponse.json({ error: 'Ongeldig datumformaat voor week_start.' }, { status: 400 })
    }

    // Limit rijen to prevent abuse
    if (!Array.isArray(rijen) || rijen.length > 200) {
      return NextResponse.json({ error: 'Ongeldige rijen.' }, { status: 400 })
    }

    // Sanitize rijen: only allow allowed fields, clamp schaal values
    const gesaneerdeRijen = rijen
      .filter(r => r.vraag_code && typeof r.vraag_code === 'string' && r.vraag_code.length < 100)
      .map(r => ({
        vraag_code:    String(r.vraag_code).slice(0, 100),
        categorie:     r.categorie ? String(r.categorie).slice(0, 50) : null,
        waarde_schaal: typeof r.waarde_schaal === 'number'
          ? Math.min(5, Math.max(1, Math.round(r.waarde_schaal)))
          : null,
        waarde_tekst:  typeof r.waarde_tekst === 'string' && r.waarde_tekst.trim()
          ? r.waarde_tekst.trim().slice(0, 2000)
          : null,
      }))

    const admin = createAdminClient()

    // Verwijder bestaande sessie voor deze week (cascade verwijdert antwoorden mee)
    const { data: bestaand } = await admin
      .from('checkin_sessies')
      .select('id')
      .eq('user_id', user_id)
      .eq('week_start', week_start)
      .maybeSingle()

    if (bestaand?.id) {
      await admin.from('checkin_sessies').delete().eq('id', bestaand.id)
    }

    // Nieuwe sessie aanmaken
    const { data: sessie, error: sessieErr } = await admin
      .from('checkin_sessies')
      .insert({ user_id, bedrijf_id: bedrijf_id ?? null, week_start })
      .select('id')
      .single()

    if (sessieErr || !sessie) {
      return NextResponse.json(
        { error: `Sessie aanmaken mislukt: ${sessieErr?.message}` },
        { status: 500 }
      )
    }

    // Antwoorden opslaan
    if (gesaneerdeRijen.length > 0) {
      const { error: antwoordErr } = await admin
        .from('checkin_antwoorden')
        .insert(gesaneerdeRijen.map(r => ({ ...r, sessie_id: sessie.id })))

      if (antwoordErr) {
        return NextResponse.json(
          { error: `Antwoorden opslaan mislukt: ${antwoordErr.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ sessie_id: sessie.id })
  } catch (err) {
    console.error('[submit-checkin]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
