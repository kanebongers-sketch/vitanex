import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stuurTelegram } from '@/lib/telegram'

// Eenmalige trigger — stuurt de huidige weekplanning via Telegram
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

  // Haal meest recente weekplanning op
  const { data: wp } = await db
    .from('content_weekplanningen')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  if (!wp) return NextResponse.json({ error: 'Geen weekplanning gevonden' }, { status: 404 })

  const dagRegels = (wp.dagen ?? [])
    .map((d: { dag_naam: string; datum: string; reels: Array<{ strategie: { topic: string; posttijd: string } }> }) => {
      if (!d.reels?.length) return `😴 <b>${d.dag_naam}</b> — Rustdag`
      const eersteReel = d.reels[0]?.strategie
      return `🎬 <b>${d.dag_naam}</b> — ${d.reels.length}× reel · ${eersteReel?.topic ?? ''}`
    })
    .join('\n')

  const trendsSamenvatting = wp.trends?.samenvatting
    ? `\n\n🔥 <b>Trending:</b> ${wp.trends.samenvatting.slice(0, 180)}…`
    : ''

  const bericht =
    `📅 <b>Weekplanning week ${wp.week_start}</b>${trendsSamenvatting}\n\n` +
    `${dagRegels}\n\n` +
    (wp.pdf_url ? `<a href="${wp.pdf_url}">📋 Open volledige weekplanning PDF</a>` : '')

  await stuurTelegram(bericht)

  return NextResponse.json({ ok: true, week_start: wp.week_start })
}
