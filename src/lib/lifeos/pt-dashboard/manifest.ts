// ─── PT-dashboard — web-app-manifest per PT'er (PUUR) ───────────────────────
// Zodat een PT'er zijn dashboard (mentaforce.nl/<naam>) op het beginscherm van
// zijn telefoon zet en het opent als een app: eigen naam, eigen start-URL, navy.
// Next kent `app/manifest.ts` alleen in de root; per PT'er gaat het daarom via de
// route handler `src/app/[pt]/manifest.webmanifest/route.ts`.

import type { MetadataRoute } from 'next'
import { COLORS } from '@/components/marketing/theme'

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
    short_name: naam.length <= 12 ? naam : 'PT-dashboard',
    description: `Het PT-dashboard van ${naam}: leads, opvolging en PT-klanten.`,
    lang: 'nl',
    start_url: start,
    scope: start,
    display: 'standalone',
    orientation: 'portrait',
    background_color: COLORS.navy,
    theme_color: COLORS.navy,
    icons: [
      // Navy + cyaan "PT." (public/icons); de tekst valt binnen de veilige zone, dus ook maskable.
      { src: '/icons/pt-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/pt-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/pt-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
