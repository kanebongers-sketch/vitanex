// POST /api/lifeos/notities/categoriseer — { tekst } → een categorie-suggestie.
//
// Leunt op het intentiebrein (src/lib/lifeos/intentie): dat leest een stuk tekst
// en kiest o.a. een categorie. We geven ALLEEN de suggestie terug — het opslaan
// doet de gebruiker met een klik. Het model kan ernaast zitten, en een notitie
// stil in de verkeerde bak schuiven is erger dan een suggestie die je negeert.
//
// Verzint niets: kan het model niet kiezen, dan komt er 'onbekend' terug, en dat
// vertaalt de UI naar "geen suggestie" — nooit een gegokte categorie.
//
// Founder-only: net als elke LifeOS-route staat hier de `vereisLifeosToegang`-
// gate ervoor. Deze route raakt geen DB, maar hij mag alleen door de founder
// aangeroepen worden — de gate is de lock, niet een losse getAuthenticatedUser.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { bepaalIntentie } from '@/lib/lifeos/intentie/intentie'
import { maakAnthropicModel } from '@/lib/lifeos/intentie/intentie-model'
import { leesTekst, type CategorieSuggestie } from '@/lib/lifeos/notities/notities'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const tekst = leesTekst((body as { tekst?: unknown } | null)?.tekst)
  if (!tekst.ok) {
    return NextResponse.json({ fout: tekst.fout }, { status: 400 })
  }

  let suggestie: CategorieSuggestie
  try {
    const intentie = await bepaalIntentie(tekst.waarde, maakAnthropicModel())
    // De intent-categorie is al 'Werk'|…|'onbekend' — precies onze suggestievorm.
    suggestie = intentie.categorie
  } catch (fout) {
    console.error('[notities/categoriseer] intentie mislukt', fout)
    // Fout≠stil: een modelstoring geeft geen verzonnen categorie, maar een nette
    // 502 zodat de UI "even niet gelukt" kan tonen i.p.v. iets in te delen.
    return NextResponse.json({ fout: 'Categoriseren lukte even niet.' }, { status: 502 })
  }

  return NextResponse.json(
    { categorie: suggestie },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } },
  )
}
