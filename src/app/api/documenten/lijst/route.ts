import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const admin = createAdminClient()
    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: mijnProfiel } = await admin
      .from('profiles')
      .select('rol, bedrijf_id')
      .eq('id', user.id)
      .single()
    if (!mijnProfiel) return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 403 })

    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId verplicht' }, { status: 400 })

    const isHR = mijnProfiel.rol === 'hr' || mijnProfiel.rol === 'admin'
    const isEigenProfiel = userId === user.id

    if (!isEigenProfiel && !isHR) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // HR: verifieer zelfde bedrijf
    if (isHR && !isEigenProfiel) {
      const { data: doelProfiel } = await admin.from('profiles').select('bedrijf_id').eq('id', userId).single()
      if (doelProfiel?.bedrijf_id !== mijnProfiel.bedrijf_id) {
        return NextResponse.json({ error: 'Geen toegang tot dit profiel' }, { status: 403 })
      }
    }

    let query = admin
      .from('documenten')
      .select('id, categorie, bestandsnaam, bestandsgrootte, mime_type, beschrijving, intern, aangemaakt_op, uploader_rol')
      .eq('user_id', userId)
      .order('aangemaakt_op', { ascending: false })

    // Werknemers zien alleen niet-interne documenten
    if (!isHR) query = query.eq('intern', false)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ documenten: data ?? [] })
  } catch (err) {
    console.error('[documenten/lijst]', err)
    return NextResponse.json({ error: 'Ophalen mislukt' }, { status: 500 })
  }
}
