import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBriefingPDF } from '@/lib/pdf-briefing'
import { uploadToDrive } from '@/lib/google-drive'

// Called daily at 20:00 (NL time) by cron-job.org
// Protected by CRON_SECRET env var (optional — if not set, any request passes)
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? ''
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const vandaag = new Date().toISOString().split('T')[0]

  // 1. Genereer briefing (of gebruik bestaande)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mentaforce.nl'
  const briefingRes = await fetch(`${baseUrl}/api/content/briefing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cronSecret ? { 'x-cron-secret': cronSecret } : {}),
    },
    body: JSON.stringify({ forceer: false }),
  })

  if (!briefingRes.ok) {
    console.error('Briefing generatie mislukt:', await briefingRes.text())
    return NextResponse.json({ error: 'Briefing generatie mislukt' }, { status: 500 })
  }

  // 2. Haal briefing op uit DB
  const { data: briefing } = await db
    .from('content_briefings')
    .select('*')
    .eq('datum', vandaag)
    .single()

  if (!briefing) {
    return NextResponse.json({ error: 'Geen briefing gevonden na generatie' }, { status: 500 })
  }

  // 3. Haal kalender op voor vandaag + morgen
  const morgen = (() => { const d = new Date(vandaag); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  function getDagVanWeek(datum: string) {
    const d = new Date(datum)
    return d.getDay() === 0 ? 7 : d.getDay()
  }

  function kalenderVoorDatum(kalData: Record<string, { dag: number; items: unknown[] }[]> | null, datum: string): import('@/lib/pdf-briefing').KalenderDag[] {
    if (!kalData) return []
    const dag = getDagVanWeek(datum)
    return (['instagram', 'facebook', 'linkedin'] as const)
      .map(platform => ({
        platform,
        items: ((kalData[platform] ?? []).find((d) => d.dag === dag)?.items ?? []) as import('@/lib/pdf-briefing').KalenderItem[],
      }))
      .filter(p => p.items.length > 0)
  }

  const maandag = (() => {
    const d = new Date(vandaag)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  })()

  const { data: kalender } = await db
    .from('content_kalender')
    .select('instagram, facebook, linkedin')
    .eq('week_start', maandag)
    .single()

  const kalenderVandaag = kalenderVoorDatum(kalender as Record<string, { dag: number; items: unknown[] }[]> | null, vandaag)
  const kalenderMorgen = kalenderVoorDatum(kalender as Record<string, { dag: number; items: unknown[] }[]> | null, morgen)

  // 4. Upload naar Drive (optioneel — alleen als geconfigureerd)
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  const driveDebug = { folderId: !!folderId, serviceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON }
  console.log('[CRON] Drive env check', driveDebug)
  if (folderId && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const pdfBuffer = await generateBriefingPDF({
        datum: briefing.datum,
        post_datum: briefing.post_datum,
        videos: briefing.videos ?? [],
        totale_opnametijd_sec: briefing.totale_opnametijd_sec,
        meta: briefing.meta,
        kalender_vandaag: kalenderVandaag,
        kalender_morgen: kalenderMorgen,
      })

      const postDatumRaw = briefing.post_datum ?? (() => {
        const d = new Date(vandaag); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
      })()
      const postDatumNL = new Date(postDatumRaw).toLocaleDateString('nl-NL', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const bestandsnaam = `Content Briefing — Post ${postDatumNL.charAt(0).toUpperCase() + postDatumNL.slice(1)}.pdf`

      const driveLink = await uploadToDrive(pdfBuffer, bestandsnaam, folderId)
      await db.from('content_briefings').update({ drive_link: driveLink }).eq('datum', vandaag)

      console.log(`[CRON] Briefing ${vandaag} → Drive: ${driveLink}`)
      return NextResponse.json({ ok: true, datum: vandaag, post_datum: postDatumRaw, drive_link: driveLink })
    } catch (err) {
      console.error('[CRON] PDF/Drive mislukt:', err)
      return NextResponse.json({ ok: true, datum: vandaag, drive_link: null, warning: 'PDF/Drive mislukt' })
    }
  }

  console.log(`[CRON] Briefing ${vandaag} gegenereerd (Drive niet geconfigureerd)`)
  return NextResponse.json({ ok: true, datum: vandaag, drive_link: null, _debug: driveDebug })
}
