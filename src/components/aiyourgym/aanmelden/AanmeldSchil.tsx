import type { ReactNode } from 'react'
import '@/app/(aiyourgym)/(website)/aiyourgym/aiyourgym.css'
import './aanmelden.css'
import { AYG_FONT_KLASSEN } from '@/components/aiyourgym/merk/fonts'
import { AygKop } from '@/components/aiyourgym/site/AygKop'
import { AygVoet } from '@/components/aiyourgym/site/AygVoet'
import { BuitenBeeld } from '@/components/aiyourgym/site/BuitenBeeld'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { HTML_LANG } from '@/lib/aiyourgym/taal/taal'
import { KOP } from '@/lib/aiyourgym/taal/woorden/website/kop'

// Dezelfde kop en voet als de website, rond het aanmelden, de welkomstpagina
// en de 404. In de taal van het adres.

export async function AanmeldSchil({ children }: { children: ReactNode }) {
  const taal = await getSiteTaal()
  return (
    <div className={`ayg ${AYG_FONT_KLASSEN}`} lang={HTML_LANG[taal]}>
      <a href="#inhoud" className="ayg-overslaan">
        {KOP[taal].overslaan}
      </a>
      <AygKop />
      <main id="inhoud" className="ayg-main">
        {children}
      </main>
      <AygVoet />
      <BuitenBeeld />
    </div>
  )
}
