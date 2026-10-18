import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { robotsRegels } from '@/lib/aiyourgym/indexeren'
import { aygIndexeren } from '@/lib/aiyourgym/schakelaar'

// Zolang de site verborgen is (lib/site-modus.ts) hoort niets in zoekmachines.
// Dat regelt de header `X-Robots-Tag: noindex` (next.config.ts), NIET een
// "Disallow: /" hier: dan mag Google de pagina's niet meer ophalen, ziet hij de
// noindex nooit, en blijven de oude resultaten (met oude tekst) gewoon staan.
// Daarom blijft crawlen toegestaan.
// Uitzondering: aiyourgym.com (nieuw domein, geen oude resultaten) schermt alles
// af zolang AIYOURGYM_INDEXEREN uit staat, zie src/lib/aiyourgym/indexeren.ts.
// Geen sitemap-vermelding.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = h.get('x-forwarded-host')?.split(',')[0] ?? h.get('host')
  return robotsRegels(host, aygIndexeren())
}
