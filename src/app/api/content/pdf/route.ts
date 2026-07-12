import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { generateBriefingPDF } from '@/lib/pdf/pdf-briefing'
import { uploadToDrive } from '@/lib/integraties/google-drive'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// POST /api/content/pdf — generate PDF for today's briefing and save to Drive
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const db = getServiceClient()
  const vandaag = new Date().toISOString().split('T')[0]

  const { data: briefing } = await db
    .from('content_briefings')
    .select('*')
    .eq('datum', vandaag)
    .single()

  if (!briefing) {
    return NextResponse.json({ error: 'Geen briefing gevonden voor vandaag. Genereer eerst een briefing.' }, { status: 404 })
  }

  const pdfBuffer = await generateBriefingPDF({
    datum: briefing.datum,
    post_datum: briefing.post_datum,
    videos: briefing.videos ?? [],
    stories: briefing.stories ?? [],
    totale_opnametijd_sec: briefing.totale_opnametijd_sec,
    meta: briefing.meta,
  })

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // Drive not configured — return PDF directly as download
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="briefing-${vandaag}.pdf"`,
      },
    })
  }

  const datumNL = new Date(vandaag).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const bestandsnaam = `Content Briefing ${datumNL.charAt(0).toUpperCase() + datumNL.slice(1)}.pdf`

  const driveLink = await uploadToDrive(pdfBuffer, bestandsnaam, folderId)

  // Store drive link in briefing row
  await db.from('content_briefings')
    .update({ drive_link: driveLink })
    .eq('datum', vandaag)

  return NextResponse.json({ ok: true, link: driveLink, bestandsnaam })
}

// GET — download PDF directly (no Drive needed)
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const db = getServiceClient()
  const url = new URL(req.url)
  const datum = url.searchParams.get('datum') ?? new Date().toISOString().split('T')[0]

  const { data: briefing } = await db
    .from('content_briefings')
    .select('*')
    .eq('datum', datum)
    .single()

  if (!briefing) {
    return NextResponse.json({ error: 'Geen briefing gevonden' }, { status: 404 })
  }

  const pdfBuffer = await generateBriefingPDF({
    datum: briefing.datum,
    post_datum: briefing.post_datum,
    videos: briefing.videos ?? [],
    stories: briefing.stories ?? [],
    totale_opnametijd_sec: briefing.totale_opnametijd_sec,
    meta: briefing.meta,
  })

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="briefing-${datum}.pdf"`,
    },
  })
}
