import type { MetadataRoute } from 'next'
import { SITE_VERBORGEN } from '@/lib/site-modus'

// Zolang de site verborgen is (lib/site-modus.ts) hoort niets in zoekmachines.
export default function robots(): MetadataRoute.Robots {
  return SITE_VERBORGEN
    ? { rules: { userAgent: '*', disallow: '/' } }
    : { rules: { userAgent: '*', allow: '/' } }
}
