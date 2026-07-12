import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function DELETE(req: NextRequest) {
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

    const docId = req.nextUrl.searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'id verplicht' }, { status: 400 })

    const { data: doc } = await admin
      .from('documenten')
      .select('user_id, bedrijf_id, opslag_pad, uploader_id')
      .eq('id', docId)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document niet gevonden' }, { status: 404 })

    const isHR = mijnProfiel.rol === 'hr' || mijnProfiel.rol === 'admin'
    const isEigenUpload = doc.uploader_id === user.id
    const zelfdeBedrjf = doc.bedrijf_id === mijnProfiel.bedrijf_id

    // Werknemer mag alleen eigen uploads verwijderen
    // HR mag alle docs van eigen bedrijf verwijderen
    if (!isEigenUpload && !isHR) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    if (isHR && !zelfdeBedrjf) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

    // Verwijder uit storage
    await admin.storage.from('documenten').remove([doc.opslag_pad])

    // Verwijder metadata
    const { error: dbErr } = await admin.from('documenten').delete().eq('id', docId)
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[documenten/verwijder]', err)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}
