// ─── PT-dashboard — web-app-manifest per PT'er (PUUR) ───────────────────────
// Zodat een PT'er zijn dashboard (fitfactorypt.nl/<naam>) op het beginscherm van
// de telefoon zet en het opent als een app: eigen start-URL, Fit Factory-huisstijl.
// Next kent `app/manifest.ts` alleen in de root; per PT'er gaat het daarom via de
// route handler `src/app/[pt]/manifest.webmanifest/route.ts`.

import type { MetadataRoute } from 'next'
import { FIT_FACTORY } from '@/components/marketing/theme'

/** Pad van het manifest van deze PT'er (voor `metadata.manifest`). */
export function manifestPad(code: string): string {
  return `/${code}/manifest.webmanifest`
}

export function ptManifest(code: string, naam: string): MetadataRoute.Manifest {
  const start = `/${code}`
  return {
    // Eigen id per PT'er: twee PT'ers op één toestel zijn twee apps.
    id: start,
    name: `Fit Factory PT · ${naam}`,
    short_name: 'Fit Factory PT',
    description: `De Fit Factory PT-app van ${naam}: leads, klanten, coachgesprek en kennisbank.`,
    lang: 'nl',
    start_url: start,
    scope: start,
    display: 'standalone',
    orientation: 'portrait',
    background_color: FIT_FACTORY.zwart,
    theme_color: FIT_FACTORY.zwart,
    icons: [
      // Het Fit Factory PT-logo op zwart (public/icons); de maskable-variant heeft
      // extra marge zodat het logo binnen de veilige zone valt.
      { src: '/icons/pt-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/pt-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/pt-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
