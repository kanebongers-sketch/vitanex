import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { ICOON_MATEN, RESERVE_PAD, eersteLetter, leesIcoonSoort, merkKleuren } from '@/lib/club/ledenapp-pwa/manifest'
import { icoonLogoDataUrl, ledenappMerkVoorVerzoek } from '@/lib/club/ledenapp-pwa/merk-server'
import { icoonBeeld } from '@/lib/club/ledenapp-pwa/icoon-beeld'

// GET /api/club/ledenapp/icoon?soort=192|512|maskable|apple&v=<versie>
//
// Het app-icoon van de sportschool als PNG: het logo (PNG of JPG) of anders de
// eerste letter van de naam op het accent. De v= is alleen om de cache te
// breken bij een nieuwe huisstijl; welke sportschool het is bepalen we hier zelf.
// Lukt het maken niet, dan het vaste reserve-icoon uit public/club-app/.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const soort = leesIcoonSoort(req.nextUrl.searchParams.get('soort'))
  if (!soort) return new Response('Niet gevonden.', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  const maat = ICOON_MATEN[soort]
  // Relatieve Location: achter Render is req.url niet altijd het publieke adres.
  const reserve = () => new Response(null, { status: 307, headers: { Location: `${RESERVE_PAD}/${maat.reserveBestand}`, 'Cache-Control': 'no-store' } })

  // Een ingelogd lid: de sportschool uit de eigen sessie (nooit uit de vraag).
  const uitslag = await ledenappMerkVoorVerzoek({ lidOrganisatieId: (await lidToegang(null))?.userId ?? null })
  if (uitslag.soort === 'verborgen') return new Response('Niet gevonden.', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  if (uitslag.soort === 'neutraal') return reserve()

  try {
    const { merk, icoonLogoPad } = uitslag.bron
    const element = icoonBeeld({
      px: maat.px,
      maskable: maat.maskable,
      letter: eersteLetter(merk.naam),
      kleuren: merkKleuren(merk),
      logoDataUrl: await icoonLogoDataUrl(icoonLogoPad),
    })
    return new ImageResponse(element, {
      width: maat.px,
      height: maat.px,
      headers: {
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (fout) {
    console.error('[club-app] icoon maken mislukt', fout instanceof Error ? fout.message : fout)
    return reserve()
  }
}
