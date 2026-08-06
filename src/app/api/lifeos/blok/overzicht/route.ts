// GET /api/lifeos/blok/overzicht — hoe ver ben je in het 4-weken blok: per week
// welke sessies afgerond zijn, en het totaal over de vier weken.
//
// De client stuurt zijn eigen `datum` mee (tijdzone), net als /vandaag. Het
// venster is de 28 dagen vanaf de blokstart; buiten die 28 dagen bestaat er geen
// blok-sessie.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { haalOfStartBlok } from '@/lib/lifeos/blok/instellingen'
import { haalVoltooideSessies } from '@/lib/lifeos/blok/opslag'
import { bouwOverzicht } from '@/lib/lifeos/blok/overzicht'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/

/** `YYYY-MM-DD` + n dagen, tijdzone-veilig via UTC-middernacht. */
function plusDagen(datum: string, dagen: number): string {
  const d = new Date(`${datum}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dagen)
  return datumSleutel(d)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const param = req.nextUrl.searchParams.get('datum')
  const datum = param !== null && DATUM_PATROON.test(param) ? param : datumSleutel(new Date())

  const start = await haalOfStartBlok(toegang.admin, toegang.userId, datum)
  if (!start.ok) return NextResponse.json({ fout: 'Kon je blok niet laden.' }, { status: 502 })

  const sessies = await haalVoltooideSessies(toegang.admin, toegang.userId, start.waarde, plusDagen(start.waarde, 27))
  if (!sessies.ok) return NextResponse.json({ fout: 'Kon je sessies niet laden.' }, { status: 502 })

  const overzicht = bouwOverzicht(start.waarde, datum, sessies.waarde)
  return NextResponse.json({ startDatum: start.waarde, ...overzicht })
}
