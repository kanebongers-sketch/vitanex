import type { NextConfig } from 'next'
import path from 'path'
import fs from 'fs'
import { SITE_VERBORGEN } from './src/lib/site-modus'

// Walk up from __dirname until we find node_modules/next.
// This makes the config work in both the main checkout and git worktrees.
let turbopackRoot = __dirname
while (
  !fs.existsSync(path.join(turbopackRoot, 'node_modules', 'next')) &&
  path.dirname(turbopackRoot) !== turbopackRoot
) {
  turbopackRoot = path.dirname(turbopackRoot)
}

// De top-level routes van MentaForce (/home, /lifeos, /login, …), afgeleid uit
// src/app tijdens de build: route-groepen als (app) tellen niet als segment, hun
// kinderen wel. Op fitfactorypt.nl stuurt src/proxy.ts deze routes weg, zodat er
// op het Fit Factory-domein niets van MentaForce te zien is. Automatisch, zodat
// een nieuwe MentaForce-pagina er nooit per ongeluk doorheen glipt.
const GEEN_MENTAFORCE_ROUTE = new Set(['[pt]', 'FitFactoryPT', 'api', 'fonts', 'lead'])
function mentaforceRoutes(): string[] {
  const appDir = path.join(__dirname, 'src', 'app')
  const mappen = (dir: string) =>
    fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  const routes = new Set<string>()
  for (const naam of mappen(appDir)) {
    if (naam.startsWith('(') && naam.endsWith(')')) {
      for (const kind of mappen(path.join(appDir, naam))) routes.add(kind)
    } else {
      routes.add(naam)
    }
  }
  return [...routes].filter((r) => !GEEN_MENTAFORCE_ROUTE.has(r) && !r.startsWith('_') && !r.startsWith('['))
}

const nextConfig: NextConfig = {
  env: {
    MENTAFORCE_ROUTES: mentaforceRoutes().join(','),
  },

  serverExternalPackages: ['pdfkit'],
  transpilePackages: ['three'],

  turbopack: {
    root: turbopackRoot,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.openfoodfacts.org',
      },
      {
        protocol: 'https',
        hostname: 'images.openfoodfacts.org',
      },
    ],
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },

  // Tijdelijk verborgen site (src/lib/site-modus.ts): de publieke pagina's sturen
  // met een echte 307 door naar het inlogscherm — vóór er iets gerenderd wordt,
  // dus geen flits van de landing. De pagina's zelf staan er nog.
  async redirects() {
    // De ingang van het PT-team heet mentaforce.nl/FitFactoryPT; oude links
    // (/lead, /lead/joey) sturen door. LET OP: redirects matchen hoofdletter-
    // ONgevoelig — een regel /fitfactorypt → /FitFactoryPT zou op zichzelf
    // lussen. Andere schrijfwijzen vangt src/app/[pt]/layout.tsx op.
    const leadLinks = [
      { source: '/lead/:code([a-z0-9-]{2,60})', destination: '/:code/lead', permanent: true },
      { source: '/lead', destination: '/FitFactoryPT', permanent: true },
    ]
    if (!SITE_VERBORGEN) return leadLinks
    return [
      ...leadLinks,
      ...['/', '/contact', '/voorwaarden', '/bedankt', '/register', '/uitnodiging'].map((source) => ({
        source,
        destination: '/login',
        permanent: false,
        // Niet op het Fit Factory-domein: daar is "/" de team-ingang (src/proxy.ts).
        missing: [{ type: 'host' as const, value: '(www\\.)?fitfactorypt\\.nl' }],
      })),
    ]
  },

  async headers() {
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : '*.supabase.co'
    // LifeOS is een apart Supabase-project (supabase/lifeos-migrations/README.md).
    // De browser PUT PT-documenten rechtstreeks naar diens Storage via een signed
    // upload URL; zonder deze host blokkeert de CSP dat ("Geen verbinding met de opslag").
    const lifeosHost = process.env.LIFEOS_SUPABASE_URL
      ? new URL(process.env.LIFEOS_SUPABASE_URL).host
      : 'bbklogjersviaoocgrve.supabase.co'

    const isProd = process.env.NODE_ENV === 'production'

    // Content-Security-Policy
    //
    // script-src — waarom 'unsafe-inline' er (nog) staat en 'unsafe-eval' niet
    // meer in productie:
    //   * 'unsafe-eval' is alleen in development nodig: React reconstrueert
    //     daar server-stacktraces met eval (zie de Next-guide
    //     content-security-policy.md: "unsafe-eval is not required for
    //     production"). De productiebundel (Turbopack) bevat geen eval; de
    //     CI-build controleert dat niet, dus bij een CSP-melding in de console
    //     eerst hier kijken.
    //   * 'unsafe-inline' is nodig zolang er geen nonce is: Next zet zijn eigen
    //     bootstrap-scripts inline (`self.__next_f.push`). Een nonce vereist een
    //     proxy.ts die per request een nonce maakt én dwingt élke pagina naar
    //     dynamic rendering (geen statische landing meer, elke hit door de
    //     server). Dat is een bewuste latere stap — niet stiekem hier.
    const scriptSrc = isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    const csp = [
      "default-src 'self'",
      scriptSrc,
      // 'unsafe-inline' voor stijlen blijft: framer-motion/R3F zetten style-
      // attributen, en de ui-componenten hebben inline <style>-blokken.
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://${supabaseHost} https://*.openfoodfacts.org https://exercisedb.io https://v2.exercisedb.io https://exercisedb-api.vercel.app https://*.exercisedb.io`,
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://${lifeosHost} https://world.openfoodfacts.org https://exercisedb.io https://v2.exercisedb.io https://exercisedb-api.vercel.app https://*.exercisedb.io https://api.nal.usda.gov`,
      "font-src 'self' data:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      // Alleen in productie: in dev draait alles op http://localhost en zou de
      // browser elk verzoek naar https proberen op te waarderen.
      ...(isProd ? ['upgrade-insecure-requests'] : []),
    ].join('; ')

    // Permissions-Policy — disable unused browser features
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
      'fullscreen=(self)',
    ].join(', ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',           value: csp },
          { key: 'X-Content-Type-Options',             value: 'nosniff' },
          { key: 'X-Frame-Options',                    value: 'DENY' },
          { key: 'Referrer-Policy',                    value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',                 value: permissionsPolicy },
          { key: 'X-DNS-Prefetch-Control',             value: 'on' },
          // Eigen browsing-context-groep: een pagina die wij openen (of die ons
          // opent) krijgt geen `window.opener` naar ons. Er zijn geen popup-
          // flows (OAuth loopt via redirects), dus dit breekt niets.
          { key: 'Cross-Origin-Opener-Policy',         value: 'same-origin' },
          // Onze antwoorden (API-JSON, chunks, afbeeldingen) mag een andere site
          // niet no-cors inladen. `same-site` i.p.v. `same-origin` zodat een
          // www./apex-split of een subdomein het niet breekt.
          { key: 'Cross-Origin-Resource-Policy',       value: 'same-site' },
          // Geen Flash/PDF-crossdomain.xml-beleid: niets mag ons cross-domain lezen.
          { key: 'X-Permitted-Cross-Domain-Policies',  value: 'none' },
          // HSTS — only in production to avoid breaking local dev
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
          // Verborgen site: nergens in zoekmachines. Werkt alleen als Google de
          // pagina wél mag ophalen (zie app/robots.ts) — anders ziet hij dit nooit
          // en blijven oude resultaten staan.
          ...(SITE_VERBORGEN ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
        ],
      },
      // Het Fit Factory-domein hoort NOOIT in zoekmachines, los van de site-modus:
      // het is een besloten team-app met gegevens van leads en klanten. Crawlen
      // blijft toegestaan (zie app/robots.ts), zodat Google deze kop ook ziet.
      {
        source: '/(.*)',
        has: [{ type: 'host' as const, value: '(www\\.)?fitfactorypt\\.nl' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' }],
      },
      // Cache static assets aggressively — alleen in productie.
      // In dev zijn Turbopack-chunknamen stabiel: immutable caching laat de
      // browser dan voor altijd oude code serveren.
      ...(isProd ? [{
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      }] : []),
    ]
  },
}

export default nextConfig
