import { NextResponse, type NextRequest } from 'next/server'
import { PAD_HEADER, beslis } from '@/lib/fit-factory/domein'

// Het eigen domein van de Fit Factory PT-app (fitfactorypt.nl). De beslissing
// zelf staat — getest — in `src/lib/fit-factory/domein.ts`; hier alleen de
// uitvoering. Daarnaast geeft de proxy het oorspronkelijke pad mee als header,
// zodat de PT-layout een oude mentaforce.nl/<naam>/…-link met pad en al kan
// doorsturen (een layout kent zelf alleen zijn eigen segment).

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host')
  const actief = process.env.FIT_FACTORY_DOMEIN_ACTIEF === '1'

  const besluit = beslis(host, pathname, search, actief)
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
  // Niet voor statische bestanden en API's: die hebben geen domeinlogica nodig.
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|icons/|fonts/|models/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2|glb|txt|xml)$).*)'],
}
