import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const TOEGESTANE_TYPES = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const admin = createAdminClient()
    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: uploaderProfiel } = await admin
      .from('profiles')
      .select('rol, bedrijf_id')
      .eq('id', user.id)
      .single()
    if (!uploaderProfiel?.bedrijf_id) return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 403 })

    const form = await req.formData()
    const bestand = form.get('bestand') as File | null
    const userId   = form.get('user_id') as string
    const categorie   = (form.get('categorie') as string) || 'overig'
    const beschrijving = (form.get('beschrijving') as string) || ''
    const internRaw = form.get('intern') === 'true'

    if (!bestand || !userId) return NextResponse.json({ error: 'Bestand en user_id verplicht' }, { status: 400 })
    if (bestand.size > MAX_SIZE) return NextResponse.json({ error: 'Bestand te groot (max 10 MB)' }, { status: 400 })
    if (!TOEGESTANE_TYPES.has(bestand.type)) return NextResponse.json({ error: 'Bestandstype niet toegestaan (pdf, afbeelding, Word)' }, { status: 400 })

    // Als voor iemand anders: HR/admin vereist + zelfde bedrijf
    if (userId !== user.id) {
      if (uploaderProfiel.rol !== 'hr' && uploaderProfiel.rol !== 'admin') {
        return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
      }
      const { data: doelProfiel } = await admin.from('profiles').select('bedrijf_id').eq('id', userId).single()
      if (doelProfiel?.bedrijf_id !== uploaderProfiel.bedrijf_id) {
        return NextResponse.json({ error: 'Medewerker behoort niet tot jouw bedrijf' }, { status: 403 })
      }
    }

    const ext = bestand.name.split('.').pop() ?? 'bin'
    const pad = `${uploaderProfiel.bedrijf_id}/${userId}/${crypto.randomUUID()}.${ext}`
    const buffer = await bestand.arrayBuffer()

    const { error: storageErr } = await admin.storage
      .from('documenten')
      .upload(pad, buffer, { contentType: bestand.type, upsert: false })

    if (storageErr) return NextResponse.json({ error: `Opslag mislukt: ${storageErr.message}` }, { status: 500 })

    // Werknemers mogen nooit intern uploaden
    const isIntern = internRaw && (uploaderProfiel.rol === 'hr' || uploaderProfiel.rol === 'admin')

    const { data: doc, error: dbErr } = await admin
      .from('documenten')
      .insert({
        user_id: userId,
        bedrijf_id: uploaderProfiel.bedrijf_id,
        uploader_id: user.id,
        uploader_rol: uploaderProfiel.rol,
        categorie,
        bestandsnaam: bestand.name,
        opslag_pad: pad,
        bestandsgrootte: bestand.size,
        mime_type: bestand.type,
        beschrijving: beschrijving || null,
        intern: isIntern,
      })
      .select('id')
      .single()

    if (dbErr) {
      await admin.storage.from('documenten').remove([pad])
      return NextResponse.json({ error: `Database fout: ${dbErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ id: doc.id })
  } catch (err) {
    console.error('[documenten/upload]', err)
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
  }
}
