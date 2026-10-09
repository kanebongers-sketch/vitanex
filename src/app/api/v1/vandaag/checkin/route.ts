// POST /api/v1/vandaag/checkin — de ochtend-check-in (stemming, energie, stress,
// elk 1–5). Komt in de bestaande stemming_logs, zodat de rest van de app hem ook
// ziet. Geeft meteen de bijgewerkte kaart terug.

import { NextResponse, type NextRequest } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { leesCheckIn } from '@/lib/vandaag/invoer'
import { haalFeiten } from '@/lib/vandaag/ophalen'
import { maakKaart } from '@/lib/vandaag/regels'
import { huidigeTaalset } from '@/lib/i18n/server'
import { dagVan } from '@/lib/lifeos/blokken/tijd'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  if (isRateLimited(`v1-checkin:${sessie.user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ fout: 'Even te vaak ingecheckt. Probeer het zo opnieuw.' }, { status: 429 })
  }

  const invoer = leesCheckIn(await req.json().catch(() => null))
  if (!invoer.ok) return NextResponse.json({ fout: invoer.fout }, { status: 400 })

  const { error } = await sessie.db.from('stemming_logs').insert({ user_id: sessie.user.id, datum: dagVan(new Date()), ...invoer.waarde })
  if (error) {
    console.error('[v1/vandaag/checkin] opslaan mislukt', error)
    return NextResponse.json({ fout: 'Je check-in kon niet worden opgeslagen.' }, { status: 502 })
  }

  try {
    const [feiten, ts] = await Promise.all([haalFeiten(sessie.db, sessie.user.id), huidigeTaalset()])
    const kaart = maakKaart(feiten, ts)
    return NextResponse.json({ kaart }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (fout) {
    console.error('[v1/vandaag/checkin] kaart maken mislukt', fout)
    return NextResponse.json({ kaart: null }, { status: 200 })
  }
}
