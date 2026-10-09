// POST /api/v1/vandaag/actie — wat je met een actie op de kaart deed (oké,
// later, nee). Eén keuze per actie per dag; een nieuwe keuze vervangt de oude.
// Dit is de meting die de pilot nodig heeft: veranderde de kaart je dag?

import { NextResponse, type NextRequest } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { leesActie } from '@/lib/vandaag/invoer'
import { dagVan } from '@/lib/lifeos/blokken/tijd'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  if (isRateLimited(`v1-actie:${sessie.user.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ fout: 'Even te veel tegelijk. Probeer het zo opnieuw.' }, { status: 429 })
  }

  const invoer = leesActie(await req.json().catch(() => null))
  if (!invoer.ok) return NextResponse.json({ fout: invoer.fout }, { status: 400 })

  const { error } = await sessie.db.from('vandaag_acties').upsert(
    {
      user_id: sessie.user.id,
      datum: dagVan(new Date()),
      actie: invoer.waarde.actie,
      keuze: invoer.waarde.keuze,
      toon: invoer.waarde.toon,
      aangemaakt_op: new Date().toISOString(),
    },
    { onConflict: 'user_id,datum,actie' },
  )
  if (error) {
    console.error('[v1/vandaag/actie] opslaan mislukt', error)
    return NextResponse.json({ fout: 'Opslaan lukte niet.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
