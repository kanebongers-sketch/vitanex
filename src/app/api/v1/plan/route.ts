// GET /api/v1/plan — je weekplan (welke dag train je wat).
// PUT /api/v1/plan — het hele weekplan in één keer vervangen. Een dag die niet
// in de lijst staat, is een rustdag.

import { NextResponse, type NextRequest } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { leesPlan } from '@/lib/vandaag/invoer'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } as const

export async function GET(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  const { data, error } = await sessie.db
    .from('vandaag_plan')
    .select('weekdag, soort, intensiteit, tijd')
    .eq('user_id', sessie.user.id)
    .order('weekdag')
  if (error) return NextResponse.json({ fout: 'Je plan kon niet worden geladen.' }, { status: 502 })
  const dagen = (Array.isArray(data) ? data : []).map((r: { weekdag: number; soort: string; intensiteit: string; tijd: string | null }) => ({
    ...r,
    tijd: r.tijd ? r.tijd.slice(0, 5) : null,
  }))
  return NextResponse.json({ dagen }, { headers: GEEN_CACHE })
}

export async function PUT(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  if (isRateLimited(`v1-plan:${sessie.user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ fout: 'Even te vaak opgeslagen. Probeer het zo opnieuw.' }, { status: 429 })
  }

  const invoer = leesPlan(await req.json().catch(() => null))
  if (!invoer.ok) return NextResponse.json({ fout: invoer.fout }, { status: 400 })

  const userId = sessie.user.id
  const houden = invoer.waarde.map((d) => d.weekdag)

  // Eerst de nieuwe dagen erin, dan pas de weggehaalde dagen eruit: mislukt het
  // opslaan halverwege, dan ben je nooit je hele plan kwijt.
  if (invoer.waarde.length > 0) {
    const { error } = await sessie.db.from('vandaag_plan').upsert(
      invoer.waarde.map((d) => ({ user_id: userId, ...d, bijgewerkt_op: new Date().toISOString() })),
      { onConflict: 'user_id,weekdag' },
    )
    if (error) {
      console.error('[v1/plan] opslaan mislukt', error)
      return NextResponse.json({ fout: 'Je plan kon niet worden opgeslagen.' }, { status: 502 })
    }
  }
  let weg = sessie.db.from('vandaag_plan').delete().eq('user_id', userId)
  if (houden.length > 0) weg = weg.not('weekdag', 'in', `(${houden.join(',')})`)
  const { error: wegFout } = await weg
  if (wegFout) {
    console.error('[v1/plan] rustdagen bijwerken mislukt', wegFout)
    return NextResponse.json({ fout: 'Je plan is deels opgeslagen. Probeer het opnieuw.' }, { status: 502 })
  }
  return NextResponse.json({ dagen: invoer.waarde })
}
