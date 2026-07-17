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
// ─── VERTROUWEN GAAT MEE, EN DAT IS GEEN DETAIL ─────────────────────────────
//   Het model levert een `vertrouwen` (0-1) en `intentie.ts` heeft er al een
//   drempel voor (`VERTROUWEN_DREMPEL`, `vraagtOmBevestiging`). Die werd hier
//   weggegooid: elke suggestie kwam er even stellig uit, of het model nou 0.95
//   of 0.20 zeker was. De UI paste 'm dan gewoon toe.
//
//   Dat is precies de valse stelligheid die CLAUDE.md verbiedt. Een gok van 0.20
//   is geen antwoord maar een vraag, en die hoort als vraag op het scherm te
//   komen ("Vita denkt: Idee — toepassen?"). Nu gaat `vertrouwen` en `zeker` mee,
//   zodat de UI dat onderscheid kán maken.
//
// Founder-only: net als elke LifeOS-route staat hier de `vereisLifeosToegang`-
// gate ervoor. Deze route raakt geen DB, maar hij mag alleen door de founder
// aangeroepen worden — de gate is de lock, niet een losse getAuthenticatedUser.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { bepaalIntentie, vraagtOmBevestiging, type Intentie } from '@/lib/lifeos/intentie/intentie'
import { maakAnthropicModel } from '@/lib/lifeos/intentie/intentie-model'
import { leesTekst } from '@/lib/lifeos/notities/notities'

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

  let intentie: Intentie
  try {
    intentie = await bepaalIntentie(tekst.waarde, maakAnthropicModel())
  } catch (fout) {
    console.error('[notities/categoriseer] intentie mislukt', fout)
    // Fout≠stil: een modelstoring geeft geen verzonnen categorie, maar een nette
    // 502 zodat de UI "even niet gelukt" kan tonen i.p.v. iets in te delen.
    return NextResponse.json({ fout: 'Categoriseren lukte even niet.' }, { status: 502 })
  }

  return NextResponse.json(
    {
      // De intent-categorie is al 'Werk'|…|'onbekend' — precies onze suggestievorm.
      categorie: intentie.categorie,
      vertrouwen: intentie.vertrouwen,
      // De drempel woont in `intentie.ts`, niet in de UI: één plek die bepaalt
      // wanneer een gok een vraag wordt. `zeker: false` = tonen als suggestie,
      // nooit stil toepassen.
      zeker: !vraagtOmBevestiging(intentie),
    },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } },
  )
}
