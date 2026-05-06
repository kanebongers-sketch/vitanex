import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

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

    const docId = req.nextUrl.searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'id verplicht' }, { status: 400 })

    const { data: doc } = await admin
      .from('documenten')
      .select('user_id, bedrijf_id, opslag_pad, intern')
      .eq('id', docId)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document niet gevonden' }, { status: 404 })

    const isHR = mijnProfiel.rol === 'hr' || mijnProfiel.rol === 'admin'
    const isEigenDoc = doc.user_id === user.id
    const zelfdeBedrjf = doc.bedrijf_id === mijnProfiel.bedrijf_id

    // Toegangscheck: eigen doc of HR van zelfde bedrijf
    if (!isEigenDoc && !isHR) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    if (!isEigenDoc && isHR && !zelfdeBedrjf) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    // Intern document: alleen HR
    if (doc.intern && !isHR) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

    const { data: signedUrl, error: urlErr } = await admin.storage
      .from('documenten')
      .createSignedUrl(doc.opslag_pad, 3600) // 1 uur geldig

    if (urlErr || !signedUrl) {
      return NextResponse.json({ error: 'URL genereren mislukt' }, { status: 500 })
    }

    return NextResponse.json({ url: signedUrl.signedUrl })
  } catch (err) {
    console.error('[documenten/download]', err)
    return NextResponse.json({ error: 'Download mislukt' }, { status: 500 })
  }
}
