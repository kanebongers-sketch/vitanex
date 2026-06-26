import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ ok: false, error: 'Niet ingelogd' }, { status: 401 })

  const missing: string[] = []
  if (!process.env.ANTHROPIC_API_KEY)                                               missing.push('ANTHROPIC_API_KEY')
  if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL)           missing.push('SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY)  missing.push('SUPABASE_SERVICE_KEY')

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: `Omgevingsvariabelen ontbreken: ${missing.join(', ')}` }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
