// GET /api/lifeos/herstel/[dienst]/koppel — start de OAuth-flow.
// Slaat zelf niets op: pas de callback maakt de koppeling.
//
// ── Twee antwoordvormen, en waarom ─────────────────────────────────────────
// De opdracht vraagt een redirect naar de provider, en dat is wat je krijgt.
// Maar de founder-gate (`vereisLifeosToegang`) is Bearer-only, en een browser die
// naar een link navigeert stuurt géén Authorization-header — een kale <a href>
// hierheen komt dus altijd op 401/403 uit.
//
// Daarom onderhandelt deze route over het antwoord:
//   Accept: application/json  → { url } zodat de client (die het token wél
//                               heeft, via authFetch) zelf kan navigeren.
//   anders                    → 302 naar de provider.
//
// Het token blijft zo waar het hoort: in een header, nooit in een query-string.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { dienstConfig, dienstLabel, isKoppelbareDienst } from '@/lib/lifeos/herstel/diensten'
import { maakKoppelState } from '@/lib/lifeos/herstel/state'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dienst: string }> },
) {
  const { dienst } = await params

  // `[dienst]` komt uit de URL en is dus gebruikersinvoer. Whitelist, geen
  // interpolatie: zonder deze check zou een onbekende waarde verderop in een
  // config-lookup of een redirect belanden.
  if (!isKoppelbareDienst(dienst)) {
    return NextResponse.json({ fout: 'onbekende dienst' }, { status: 404 })
  }

  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  const config = dienstConfig(dienst)
  if (config === null) {
    // Geen crash en geen 500: de koppeling staat gewoon uit omdat de sleutels
    // niet ingevuld zijn. Dat is een configuratiestand, geen storing.
    return NextResponse.json(
      { fout: `${dienstLabel(dienst)} is niet geconfigureerd op deze server` },
      { status: 503 },
    )
  }

  let state: string
  try {
    state = maakKoppelState(dienst)
  } catch (fout) {
    // Bv. een ontbrekende OAUTH_STATE_SECRET. Server-side loggen met detail,
    // naar buiten alleen dat het niet lukte.
    console.error('[herstel] state maken mislukt', fout)
    return NextResponse.json({ fout: 'koppelen kon niet worden gestart' }, { status: 500 })
  }

  const url = new URL(config.autoriseerUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('scope', config.bereik.join(' '))
  url.searchParams.set('state', state)

  const wilJson = request.headers.get('accept')?.includes('application/json') === true
  if (wilJson) {
    return NextResponse.json({ url: url.toString() }, { headers: { 'cache-control': 'no-store' } })
  }

  return NextResponse.redirect(url.toString())
}
