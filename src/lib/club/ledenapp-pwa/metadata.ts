// ─── Club ledenapp: metadata en viewport voor de layout van /mijn (PUUR) ────
// De layout van /mijn roept deze twee functies aan in generateMetadata en
// generateViewport. Zo krijgt de app op het beginscherm de naam, het icoon en
// de kleur van de eigen sportschool, en loopt de pagina door tot onder de
// notch (viewport-fit cover; de app zelf houdt rekening met env(safe-area-inset-*)).

import type { Metadata, Viewport } from 'next'
import type { LedenappMerk } from '@/lib/club/ledenlogin/contract'
import { NEUTRAAL_NAAM, icoonUrl, korteNaam, manifestUrl, merkKleuren } from './manifest'

export function ledenappMetadata(merk: LedenappMerk | null): Metadata {
  const naam = merk?.naam.trim() || NEUTRAAL_NAAM
  return {
    title: naam,
    applicationName: naam,
    manifest: manifestUrl(merk),
    // Leden-app: nooit in zoekmachines.
    robots: { index: false, follow: false },
    appleWebApp: {
      capable: true,
      title: korteNaam(naam),
      // De pagina loopt onder de statusbalk door; de tekst erin wordt wit.
      statusBarStyle: merk?.thema === 'licht' ? 'default' : 'black-translucent',
    },
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: icoonUrl(merk, '192'), sizes: '192x192', type: 'image/png' },
        { url: icoonUrl(merk, '512'), sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: icoonUrl(merk, 'apple'), sizes: '180x180', type: 'image/png' }],
    },
    other: { 'mobile-web-app-capable': 'yes' },
  }
}

export function ledenappViewport(merk: LedenappMerk | null): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: merkKleuren(merk).achtergrond,
    colorScheme: merk?.thema === 'licht' ? 'light' : 'dark',
  }
}
