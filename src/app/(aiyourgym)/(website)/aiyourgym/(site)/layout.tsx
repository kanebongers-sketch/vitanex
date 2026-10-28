import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../aiyourgym.css'
import '@/components/aiyourgym/mockups/mockups.css'
import '@/components/aiyourgym/home/home.css'
import '@/components/aiyourgym/home/hoofdpunten.css'
import '@/components/aiyourgym/home/eerlijk.css'
import '@/components/aiyourgym/home/wegwijs.css'
import '@/components/aiyourgym/dag/dag.css'
import '@/components/aiyourgym/voorpagina/voorpagina.css'
import '@/components/aiyourgym/voorpagina/subpaginas.css'
import '@/components/aiyourgym/functies-pagina/functies-pagina.css'
import { AYG_FONT_KLASSEN } from '@/components/aiyourgym/merk/fonts'
import { AygKop } from '@/components/aiyourgym/site/AygKop'
import { AygVoet } from '@/components/aiyourgym/site/AygVoet'
import { BuitenBeeld } from '@/components/aiyourgym/site/BuitenBeeld'
import { ContactBalk } from '@/components/aiyourgym/site/ContactBalk'
import { PlakActie } from '@/components/aiyourgym/site/PlakActie'
import { siteAlternates } from '@/lib/aiyourgym/taal/metadata'
import { getSitePad, getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { HTML_LANG, OG_LOCALE } from '@/lib/aiyourgym/taal/taal'
import { KOP } from '@/lib/aiyourgym/taal/woorden/website/kop'
import { SITE_META } from '@/lib/aiyourgym/taal/woorden/website/meta'

// De pagina's van de verkoopwebsite met kop en voet. De poort (alleen Kane zolang
// de schakelaar uit staat) zit in ../layout.tsx.

export async function generateMetadata(): Promise<Metadata> {
  const [taal, pad] = await Promise.all([getSiteTaal(), getSitePad()])
  const t = SITE_META[taal]
  return {
    title: { default: t.titel, template: '%s | AI Your Gym' },
    description: t.omschrijving,
    applicationName: 'AI Your Gym',
    // Deellinks wijzen altijd naar het eigen domein; de afbeelding zelf staat in
    // ../opengraph-image.tsx (Next zet og:image en de maten automatisch).
    metadataBase: new URL('https://aiyourgym.com'),
    // Een adres per pagina in beide talen (de taal komt uit de cookie), dus alleen
    // een canonical en geen hreflang. Alleen als de proxy het publieke pad meegaf
    // (op aiyourgym.com); elders geen alternates. og:locale volgt de gekozen taal.
    ...(pad ? { alternates: siteAlternates(pad) } : {}),
    openGraph: { siteName: 'AI Your Gym', locale: OG_LOCALE[taal], type: 'website' },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function AiYourGymSiteLayout({ children }: { children: ReactNode }) {
  const taal = await getSiteTaal()
  return (
    <div className={`ayg ${AYG_FONT_KLASSEN}`} lang={HTML_LANG[taal]}>
      <a href="#inhoud" className="ayg-overslaan">
        {KOP[taal].overslaan}
      </a>
      <ContactBalk />
      <AygKop />
      <main id="inhoud" className="ayg-main">
        {children}
      </main>
      <AygVoet />
      <PlakActie />
      <BuitenBeeld />
    </div>
  )
}
