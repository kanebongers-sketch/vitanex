import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../aiyourgym.css'
import '@/components/aiyourgym/mockups/mockups.css'
import '@/components/aiyourgym/home/home.css'
import { AYG_FONT_KLASSEN } from '@/components/aiyourgym/merk/fonts'
import { AygKop } from '@/components/aiyourgym/site/AygKop'
import { AygVoet } from '@/components/aiyourgym/site/AygVoet'
import { ContactBalk } from '@/components/aiyourgym/site/ContactBalk'
import { PlakActie } from '@/components/aiyourgym/site/PlakActie'

// De pagina's van de verkoopwebsite met kop en voet. De poort (alleen Kane zolang
// de schakelaar uit staat) zit in ../layout.tsx.

export const metadata: Metadata = {
  title: { default: 'AI Your Gym | Clubsoftware voor sportscholen', template: '%s | AI Your Gym' },
  description:
    "Clubsoftware voor sportscholen: leden, check-in, groepslessen, personeel, trainingsschema's met coaching en een ledenapp in je eigen huisstijl.",
  applicationName: 'AI Your Gym',
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
    </div>
  )
}
