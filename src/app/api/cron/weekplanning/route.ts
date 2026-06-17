import { NextRequest, NextResponse } from 'next/server'

// GET /api/cron/weekplanning — triggered manually or by cron (e.g. every Monday 18:00)
// Protected by CRON_SECRET env var (optional)
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? ''
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mentaforce.nl'

  const res = await fetch(`${baseUrl}/api/content/weekplanning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cronSecret ? { 'x-cron-secret': cronSecret } : {}),
    },
    body: JSON.stringify({ forceer: false }),
  })

  if (!res.ok) {
    const tekst = await res.text()
    console.error('[CRON WEEKPLANNING] Mislukt:', tekst)
    return NextResponse.json({ error: 'Weekplanning generatie mislukt', detail: tekst }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({
    ok: true,
    week_start: data.weekplanning?.week_start,
    pdf_url: data.pdf_url,
    cached: data.cached,
  })
}
