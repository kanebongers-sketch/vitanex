import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

type Rij = {
  vraag_code: string
  categorie: string | null
  waarde_schaal: number | null
  waarde_tekst: string | null
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, bedrijf_id, week_start, rijen } = await req.json() as {
      user_id: string
      bedrijf_id: string | null
      week_start: string
      rijen: Rij[]
    }

    if (!user_id || !week_start) {
      return NextResponse.json({ error: 'user_id en week_start verplicht' }, { status: 400 })
    }

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
    if (rijen.length > 0) {
      const { error: antwoordErr } = await admin
        .from('checkin_antwoorden')
        .insert(rijen.map(r => ({ ...r, sessie_id: sessie.id })))

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
