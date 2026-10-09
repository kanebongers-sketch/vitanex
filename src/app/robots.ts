import type { MetadataRoute } from 'next'

// Zolang de site verborgen is (lib/site-modus.ts) hoort niets in zoekmachines.
// Dat regelt de header `X-Robots-Tag: noindex` (next.config.ts) — NIET een
// "Disallow: /" hier: dan mag Google de pagina's niet meer ophalen, ziet hij de
// noindex nooit, en blijven de oude resultaten (met oude tekst) gewoon staan.
// Daarom blijft crawlen toegestaan.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } }
}
