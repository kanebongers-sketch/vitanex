import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { ledenappManifest } from '@/lib/club/ledenapp-pwa/manifest'
import { ledenappMerkVoorVerzoek } from '@/lib/club/ledenapp-pwa/merk-server'

// GET /api/club/ledenapp/manifest  het web-app-manifest van /mijn
//
// Per sportschool (naam, kleuren, iconen), zie merk-server.ts voor hoe we de
// sportschool kiezen. Onder /api in plaats van src/app/(hoofd)/mijn/manifest.webmanifest:
// een manifest-bestand is in deze Next alleen in de root van app een speciaal
// bestand, en op een subdomein herschrijft de proxy alles buiten /api naar
// /clubkane. De ledenapp nog dicht en geen Kane: een gewone 404.

export const dynamic = 'force-dynamic'

export async function GET() {
  // Een ingelogd lid: de sportschool uit de eigen sessie (nooit uit de vraag).
  const uitslag = await ledenappMerkVoorVerzoek({ lidOrganisatieId: (await lidToegang(null))?.userId ?? null })
  if (uitslag.soort === 'verborgen') return new Response('Niet gevonden.', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  const manifest = ledenappManifest(uitslag.soort === 'merk' ? uitslag.bron.merk : null)
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      // Per persoon en per adres verschillend: nooit in een gedeelde cache.
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  })
}
