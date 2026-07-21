// GET /api/lifeos/finance/overzicht?maand=YYYY-MM
//   → het finance-overzicht: omzet/kosten/winst deze maand, openstaand,
//     verlopen-telling, 6-maands-trend, aantal transacties. Geen maand → deze maand.
//
// EERLIJK: een lege maand geeft echte nullen, nooit een verzonnen cijfer. De route
// haalt álle transacties + facturen op en laat de PURE `bouwOverzicht` het beeld
// afleiden (maand-aggregatie + trend) — de aggregatie is zo testbaar zonder DB.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { bouwOverzicht, isMaand } from '@/lib/lifeos/finance/finance'
import { haalFacturen, haalTransacties, type Reden } from '@/lib/lifeos/finance/opslag'
import { datumSleutel } from '@/lib/lifeos/datum/datum'

export const runtime = 'nodejs'

// Geen max-age: je cijfers veranderen terwijl je kijkt. `Vary` staat er alsnog —
// het antwoord van de ene sessie mag nooit bij een andere terechtkomen.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

function foutAntwoord(reden: Reden) {
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  return NextResponse.json({ fout: 'Kon je cijfers niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const vandaag = datumSleutel(new Date())
  const gevraagd = req.nextUrl.searchParams.get('maand')
  if (gevraagd !== null && !isMaand(gevraagd)) {
    return NextResponse.json({ fout: 'Ongeldige maand; gebruik YYYY-MM.' }, { status: 400 })
  }
  const maand = gevraagd ?? vandaag.slice(0, 7)

  // Álles ophalen (single-tenant, bescheiden volume): de trend beslaat ~6 maanden en
  // openstaand telt over alle facturen, dus filteren op één maand zou te weinig zijn.
  const transacties = await haalTransacties(toegang.admin, toegang.userId, {})
  if (!transacties.ok) return foutAntwoord(transacties.reden)
  const facturen = await haalFacturen(toegang.admin, toegang.userId)
  if (!facturen.ok) return foutAntwoord(facturen.reden)

  const overzicht = bouwOverzicht(transacties.waarde, facturen.waarde, maand, vandaag)
  return NextResponse.json(overzicht, { headers: CACHE_HEADERS })
}
