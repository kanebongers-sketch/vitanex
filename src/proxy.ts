import { NextResponse, type NextRequest } from 'next/server'
import { PAD_HEADER, beslis, leesRoutes } from '@/lib/fit-factory/domein'
import { MENTAFORCE_OFFLINE } from '@/lib/site-modus'
import { releaseVProxy } from '@/releasev/lib/proxy-releasev'

// Het eigen domein van de Fit Factory PT-app (fitfactorypt.nl). De beslissing
// zelf staat — getest — in `src/lib/fit-factory/domein.ts`; hier alleen de
// uitvoering. Daarnaast geeft de proxy het oorspronkelijke pad mee als header,
// zodat de PT-layout een oude mentaforce.nl/<naam>/…-link met pad en al kan
// doorsturen (een layout kent zelf alleen zijn eigen segment).
//
// RELEASE V (releasev.nl) draait in dezelfde app. Die stap komt eerst en geeft
// null terug voor alles wat niet van de webshop is (zie src/releasev/lib/host-routing.ts).

/** De MentaForce-routes, tijdens de build uit src/app afgeleid (next.config). */
const MENTAFORCE_ROUTES = leesRoutes(process.env.MENTAFORCE_ROUTES)

export function proxy(request: NextRequest) {
  const releaseV = releaseVProxy(request)
  if (releaseV) return releaseV

  const { pathname, search } = request.nextUrl
  // API's hebben geen Fit Factory-domeinlogica nodig (ze lopen alleen door de
  // proxy vanwege RELEASE V, zie de matcher hieronder).
  if (pathname.startsWith('/api/')) return NextResponse.next()

  const host = request.headers.get('host')
  const actief = process.env.FIT_FACTORY_DOMEIN_ACTIEF === '1'

  const besluit = beslis(host, pathname, search, actief, MENTAFORCE_ROUTES, MENTAFORCE_OFFLINE)
  if (besluit.soort === 'omleiden') return NextResponse.redirect(besluit.url, 308)

  const headers = new Headers(request.headers)
  headers.set(PAD_HEADER, `${pathname}${search}`)

  if (besluit.soort === 'herschrijven') {
    const doel = request.nextUrl.clone()
    doel.pathname = besluit.pad
    return NextResponse.rewrite(doel, { request: { headers } })
  }
  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Niet voor statische bestanden: die hebben geen domeinlogica nodig.
  // favicon.ico wél: op fitfactorypt.nl wordt dat het Fit Factory-icoon.
  // API's, robots.txt en sitemap.xml lopen mee voor RELEASE V (releasev.nl/api/…
  // moet naar de webshop-API's); voor de Fit Factory-app verandert er niets.
  matcher: [
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/api/:path*',
    '/((?!api/|_next/static|_next/image|favicon.ico|icons/|fonts/|models/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2|glb|txt|xml)$).*)',
  ],
}
