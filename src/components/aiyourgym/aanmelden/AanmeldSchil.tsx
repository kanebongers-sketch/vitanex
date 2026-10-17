import type { ReactNode } from 'react'
import '@/app/aiyourgym/aiyourgym.css'
import './aanmelden.css'
import { AYG_FONT_KLASSEN } from '@/components/aiyourgym/merk/fonts'
import { AygKop } from '@/components/aiyourgym/site/AygKop'
import { AygVoet } from '@/components/aiyourgym/site/AygVoet'

// Dezelfde kop en voet als de website, rond het aanmelden en de welkomstpagina.

export function AanmeldSchil({ children }: { children: ReactNode }) {
  return (
    <div className={`ayg ${AYG_FONT_KLASSEN}`} lang="nl">
      <a href="#inhoud" className="ayg-overslaan">
        Naar de inhoud
      </a>
      <AygKop />
      <main id="inhoud" className="ayg-main">
        {children}
      </main>
      <AygVoet />
    </div>
  )
}
