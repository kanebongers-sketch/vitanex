import { NextResponse, type NextRequest } from 'next/server'
import { PAD_HEADER, beslis, leesRoutes } from '@/lib/fit-factory/domein'
import { MENTAFORCE_OFFLINE } from '@/lib/site-modus'
import { releaseVProxy } from '@/releasev/lib/proxy-releasev'
import { isReleaseVHost } from '@/releasev/lib/host-routing'
import { NOINDEX_HEADER, isSiteHidden } from '@/releasev/lib/site-mode'
import { MF_BASIS, MF_BASIS_HEADER, beslisMentaforce } from '@/lib/mentaforce/basis'
import { beslisClub } from '@/lib/club/kern/subdomein'
import { ADRES_COOKIE, SLUG_KOP, beslisClubPad, splitsSlugPad, subdomeinUrl } from '@/lib/club/kern/pad-adres'
import { slugBestaat } from '@/lib/club/kern/slug-bestaat'
import { aygDomeinDicht, beslisAyg, isAygHost } from '@/lib/aiyourgym/host'
import { aygIndexeren, siteActief } from '@/lib/aiyourgym/schakelaar'
import { AYG_NOINDEX, moetNoindex } from '@/lib/aiyourgym/indexeren'
import { widgetProxy } from '@/lib/club/widget/proxy-widget'

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
/** Top-level pagina's en API's van de webshop (next.config): die blijven van RELEASE V. */
const WEBSHOP_ROUTES = leesRoutes(process.env.RELEASEV_ROUTES)
const WEBSHOP_APIS = leesRoutes(process.env.RELEASEV_APIS)

/**
 * MentaForce onder releasev.nl/mentaforce (src/lib/mentaforce/basis.ts). Alleen
 * op het kale releasev.nl; null = niet van MentaForce, dan gaat alles verder zoals
 * het altijd ging (webshop, Fit Factory).
 */
function mentaforceOpReleaseV(request: NextRequest): NextResponse | null {
  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  if (!isReleaseVHost(host) || host.startsWith('www.')) return null
  // Zonder routelijsten (kapotte build) niets doen: liever een 404 dan de webshop raken.
  if (MENTAFORCE_ROUTES.size === 0 || WEBSHOP_ROUTES.size === 0) return null

  const { pathname, search } = request.nextUrl
  const besluit = beslisMentaforce(pathname, search, MENTAFORCE_ROUTES, WEBSHOP_ROUTES, WEBSHOP_APIS)
  if (besluit.soort === 'niet-van-mij') return null
  // Absoluut adres op hetzelfde (al gecontroleerde) domein; achter Render is
  // request.url niet altijd het publieke adres.
  if (besluit.soort === 'omleiden') {
    const origin = host === 'releasev.localhost' ? `http://${request.headers.get('host')}` : `https://${host}`
    return NextResponse.redirect(`${origin}${besluit.url}`, 308)
  }

  const headers = new Headers(request.headers)
  headers.set(MF_BASIS_HEADER, MF_BASIS)
  headers.set(PAD_HEADER, `${pathname}${search}`)
  let response: NextResponse
  if (besluit.soort === 'door') {
    response = NextResponse.next({ request: { headers } })
  } else {
    const doel = request.nextUrl.clone()
    doel.pathname = besluit.pad
    response = NextResponse.rewrite(doel, { request: { headers } })
  }
  // Zolang releasev.nl verborgen is voor Google, geldt dat ook voor /mentaforce.
  if (isSiteHidden()) response.headers.set(NOINDEX_HEADER.key, NOINDEX_HEADER.value)
  return response
}

/**
 * Club op een eigen subdomein per sportschool (<slug>.aiyourgym.com), zie
 * src/lib/club/kern/subdomein.ts. Alleen met CLUB_SUBDOMEINEN_ACTIEF=1; zonder
 * die schakelaar, of op elk ander domein, null en gaat alles zoals altijd.
 * Welke sportschool open staat bepaalt de toegang zelf uit de host.
 */
function clubOpSubdomein(request: NextRequest): NextResponse | null {
  const besluit = beslisClub(request.headers.get('host'), request.nextUrl.pathname, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1')
  if (besluit.soort === 'niet-van-mij') return null
  let response: NextResponse
  if (besluit.soort === 'door') {
    response = NextResponse.next()
  } else {
    const doel = request.nextUrl.clone()
    doel.pathname = besluit.pad
    response = NextResponse.rewrite(doel)
  }
  // Club is nooit voor zoekmachines.
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

/** De headers van het verzoek zonder de slug-kop: die zet alleen de proxy zelf. */
function zonderSlugKop(request: NextRequest): Headers {
  const headers = new Headers(request.headers)
  headers.delete(SLUG_KOP)
  return headers
}

/**
 * De omgeving van een sportschool als pad: aiyourgym.com/<slug>/... (besluit
 * Kane 23-10-2026, src/lib/club/kern/pad-adres.ts). Alleen op de host van de
 * website met de site aan; een onbekende of gereserveerde slug is niet van
 * Club (dan de website, met haar 404). De slug gaat mee als kop en als cookie,
 * zodat de gewone links (/club/...) en de API bij deze sportschool blijven.
 * Met subdomeinen aan een 308 naar <slug>.aiyourgym.com.
 */
async function clubOpPad(request: NextRequest): Promise<NextResponse | null> {
  const host = request.headers.get('host')
  if (!siteActief() || !isAygHost(host)) return null
  const { pathname, search } = request.nextUrl
  const gesplitst = splitsSlugPad(pathname)
  if (!gesplitst) return null
  const bestaat = await slugBestaat(gesplitst.slug)
  const besluit = beslisClubPad(pathname, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', () => bestaat)
  if (besluit.soort === 'niet-van-mij') return null
  if (besluit.soort === 'omleiden') return NextResponse.redirect(subdomeinUrl(besluit.slug, besluit.rest, search, host), 308)
  const headers = zonderSlugKop(request)
  headers.set(SLUG_KOP, besluit.slug)
  const doel = request.nextUrl.clone()
  doel.pathname = besluit.pad
  const response = NextResponse.rewrite(doel, { request: { headers } })
  if (request.cookies.get(ADRES_COOKIE)?.value !== besluit.slug) {
    response.cookies.set(ADRES_COOKIE, besluit.slug, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
  }
  // Club en de ledenapp zijn nooit voor zoekmachines.
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

/**
 * De verkoopwebsite van AI Your Gym op aiyourgym.com en www.aiyourgym.com, zie
 * src/lib/aiyourgym/host.ts. Alleen met AIYOURGYM_SITE_ACTIEF=1; zonder die
 * schakelaar, of op elk ander domein, null en gaat alles zoals altijd. Een
 * subdomein van een sportschool is van Club (stap hierboven).
 */
function aiyourgymSite(request: NextRequest): NextResponse | null {
  const host = request.headers.get('host')
  const besluit = beslisAyg(host, request.nextUrl.pathname, siteActief())
  if (besluit.soort === 'niet-van-mij') return null
  const headers = zonderSlugKop(request)
  let response: NextResponse
  if (besluit.soort === 'door') {
    response = NextResponse.next({ request: { headers } })
  } else {
    const doel = request.nextUrl.clone()
    doel.pathname = besluit.pad
    response = NextResponse.rewrite(doel, { request: { headers } })
    // Een pagina van de website: de omgeving van een sportschool is dan niet meer open
    // (inloggen op aiyourgym.com/inloggen is weer voor elk account).
    if (request.cookies.has(ADRES_COOKIE)) response.cookies.delete(ADRES_COOKIE)
  }
  // Nog niet in zoekmachines (src/lib/aiyourgym/indexeren.ts); de /aiyourgym-paden op
  // andere domeinen krijgen dezelfde kop via next.config.ts.
  if (moetNoindex(host, request.nextUrl.pathname, aygIndexeren())) response.headers.set('X-Robots-Tag', AYG_NOINDEX)
  return response
}

export async function proxy(request: NextRequest) {
  // De boekingswidget (/widget/..., /api/widget/...) eerst: op elk domein behalve
  // releasev.nl dezelfde plek, met een eigen CSP (src/lib/club/widget/proxy-widget.ts).
  const widget = await widgetProxy(request)
  if (widget) return widget

  // aiyourgym.com en de subdomeinen blijven dicht tot de schakelaars aan staan:
  // nooit de Fit Factory-app op dat domein.
  if (aygDomeinDicht(request.headers.get('host'), siteActief(), process.env.CLUB_SUBDOMEINEN_ACTIEF === '1')) {
    return new NextResponse('Niet gevonden', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow', 'content-type': 'text/plain; charset=utf-8' } })
  }

  const club = clubOpSubdomein(request)
  if (club) return club

  const clubPad = await clubOpPad(request)
  if (clubPad) return clubPad

  const ayg = aiyourgymSite(request)
  if (ayg) return ayg

  const mentaforce = mentaforceOpReleaseV(request)
  if (mentaforce) return mentaforce

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
