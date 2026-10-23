import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../aiyourgym.css'
import '@/components/aiyourgym/mockups/mockups.css'
import '@/components/aiyourgym/home/home.css'
import '@/components/aiyourgym/home/hoofdpunten.css'
import '@/components/aiyourgym/home/eerlijk.css'
import { AYG_FONT_KLASSEN } from '@/components/aiyourgym/merk/fonts'
import { AygKop } from '@/components/aiyourgym/site/AygKop'
import { AygVoet } from '@/components/aiyourgym/site/AygVoet'
import { BuitenBeeld } from '@/components/aiyourgym/site/BuitenBeeld'
import { ContactBalk } from '@/components/aiyourgym/site/ContactBalk'
import { PlakActie } from '@/components/aiyourgym/site/PlakActie'

// De pagina's van de verkoopwebsite met kop en voet. De poort (alleen Kane zolang
// de schakelaar uit staat) zit in ../layout.tsx.

export const metadata: Metadata = {
  title: { default: 'AI Your Gym | Clubsoftware voor sportscholen', template: '%s | AI Your Gym' },
  description:
    "Clubsoftware voor sportscholen: leden, check-in, groepslessen, personeel, trainingsschema's met coaching en een ledenapp in je eigen huisstijl.",
  applicationName: 'AI Your Gym',
  // Deellinks wijzen altijd naar het eigen domein; de afbeelding zelf staat in
  // ../opengraph-image.tsx (Next zet og:image en de maten automatisch).
  metadataBase: new URL('https://aiyourgym.com'),
  openGraph: { siteName: 'AI Your Gym', locale: 'nl_NL', type: 'website' },
  twitter: { card: 'summary_large_image' },
}

export default function AiYourGymSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`ayg ${AYG_FONT_KLASSEN}`} lang="nl">
      <a href="#inhoud" className="ayg-overslaan">
        Naar de inhoud
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
