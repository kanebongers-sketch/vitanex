import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBriefingPDF } from '@/lib/pdf-briefing'
import { uploadBriefingPDF } from '@/lib/briefing-storage'
import { stuurTelegram } from '@/lib/telegram'

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

  // 4. Genereer PDF en sla op in Supabase Storage
  try {
    const pdfBuffer = await generateBriefingPDF({
      datum: briefing.datum,
      post_datum: briefing.post_datum,
      videos: briefing.videos ?? [],
      stories: briefing.stories ?? [],
      totale_opnametijd_sec: briefing.totale_opnametijd_sec,
      meta: briefing.meta,
      kalender_vandaag: kalenderVandaag,
      kalender_morgen: kalenderMorgen,
    })

    const pdfUrl = await uploadBriefingPDF(pdfBuffer, vandaag)
    await db.from('content_briefings').update({ drive_link: pdfUrl }).eq('datum', vandaag)

    const postDatumRaw = briefing.post_datum ?? (() => {
      const d = new Date(vandaag); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
    })()

    const postDatumNL = new Date(postDatumRaw).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    const videos: Array<{ titel?: string; hook?: string; locatie?: string }> = briefing.videos ?? []
    const videoRegels = videos.map((v, i) =>
      `${i + 1}. <b>${v.titel ?? ''}</b> (${v.locatie ?? ''})\n   <i>"${v.hook ?? ''}"</i>`
    ).join('\n\n')

    await stuurTelegram(
      `💪 <b>Fitness Briefing klaar!</b>\n` +
      `📅 Post ${postDatumNL.charAt(0).toUpperCase() + postDatumNL.slice(1)}\n` +
      `⏱ ~${Math.round((briefing.totale_opnametijd_sec ?? 0) / 60)} min opnemen\n\n` +
      `${videoRegels}\n\n` +
      `<a href="${pdfUrl}">📄 Open volledige briefing PDF</a>`
    )

    console.log(`[CRON] Briefing ${vandaag} → Storage: ${pdfUrl}`)

    // Op maandag ook de weekplanning genereren
    let weekplanningUrl: string | null = null
    if (new Date().getDay() === 1) {
      try {
        const wpRes = await fetch(`${baseUrl}/api/content/weekplanning`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cronSecret ? { 'x-cron-secret': cronSecret } : {}),
          },
          body: JSON.stringify({ forceer: false }),
        })
        const wpData = await wpRes.json()
        weekplanningUrl = wpData.pdf_url ?? null
        const wp = wpData.weekplanning
        if (wp) {
          const dagEmoji: Record<string, string> = {
            reel: '🎬', carousel: '🖼', rustdag: '😴',
          }
          const dagRegels = (wp.dagen ?? [])
            .map((d: { strategie: { dag_naam: string; format: string; topic: string; beste_posttijd: string } }) => {
              const fmt = d.strategie.format
              const emoji = dagEmoji[fmt] ?? '📌'
              return `${emoji} <b>${d.strategie.dag_naam}</b> ${d.strategie.beste_posttijd} — ${d.strategie.topic}`
            })
            .join('\n')

          const trendsSamenvatting = wp.trends?.samenvatting
            ? `\n\n🔥 <b>Trending:</b> ${wp.trends.samenvatting.slice(0, 180)}…`
            : ''

          await stuurTelegram(
            `📅 <b>Weekplanning week ${wp.week_start}</b>${trendsSamenvatting}\n\n` +
            `${dagRegels}\n\n` +
            (weekplanningUrl ? `<a href="${weekplanningUrl}">📋 Open volledige weekplanning PDF</a>` : '')
          )
        }
        console.log(`[CRON] Weekplanning gegenereerd → ${weekplanningUrl}`)
      } catch (wpErr) {
        console.error('[CRON] Weekplanning mislukt:', wpErr)
      }
    }

    return NextResponse.json({ ok: true, datum: vandaag, post_datum: postDatumRaw, pdf_url: pdfUrl, weekplanning_url: weekplanningUrl })
  } catch (err) {
    console.error('[CRON] PDF/Storage mislukt:', err)
    return NextResponse.json({ ok: true, datum: vandaag, pdf_url: null, warning: 'PDF generatie mislukt', error: String(err) })
  }
}
