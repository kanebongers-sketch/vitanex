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

const nextConfig: NextConfig = {
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
      })),
    ]
  },

  async headers() {
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : '*.supabase.co'

    const isProd = process.env.NODE_ENV === 'production'

    // Content-Security-Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Turbopack needs unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://${supabaseHost} https://*.openfoodfacts.org https://exercisedb.io https://v2.exercisedb.io https://exercisedb-api.vercel.app https://*.exercisedb.io`,
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://world.openfoodfacts.org https://exercisedb.io https://v2.exercisedb.io https://exercisedb-api.vercel.app https://*.exercisedb.io https://api.nal.usda.gov`,
      "font-src 'self' data:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
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
          // HSTS — only in production to avoid breaking local dev
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
        ],
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
