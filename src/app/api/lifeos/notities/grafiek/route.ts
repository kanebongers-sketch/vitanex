// GET /api/lifeos/notities/grafiek — de kennisgrafiek: knopen en kanten.
//
// Bevat alleen notities die aan een verwijzing meedoen. Een notitie zonder
// verbanden is in een KENNISgrafiek een losse stip die de rest onleesbaar maakt.
// De prijs is echt (je ziet hier niet al je notities) en de UI zegt het erbij.
//
// `afgekapt: true` betekent: dit is niet alles. Dat gaat expliciet mee in het
// antwoord in plaats van stil te gebeuren — een grafiek die doet alsof hij
// compleet is terwijl hij dat niet is, is precies het soort verzonnen beeld dat
// dit project niet maakt.
//
// LET OP — dit pad ligt naast `/api/lifeos/notities/[id]`. Next kiest het
// statische segment (`grafiek`) boven het dynamische (`[id]`), dus een notitie
// met id "grafiek" kan niet bestaan (het zijn uuid's). Zie
// node_modules/next/dist/docs → 01-app/.../route.md.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalGrafiek } from '@/lib/lifeos/notities/kennis'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const uitkomst = await haalGrafiek(toegang.admin, toegang.userId)

  if (!uitkomst.ok) {
    // Een lege grafiek ("je hebt nog niets verbonden") is een geldig antwoord en
    // komt hieronder met lege lijsten. Dít is een storing — en die mag nooit als
    // "je hebt geen kennis" op het scherm belanden.
    return NextResponse.json({ fout: 'Kon de kennisgrafiek niet ophalen.' }, { status: 502 })
  }

  return NextResponse.json(uitkomst.waarde, { headers: CACHE_HEADERS })
}
