import type { ReactNode } from 'react'
import './basis.css'
import { AYG_FONT_KLASSEN } from '@/components/aiyourgym/merk/fonts'
import { AygTaal } from '@/lib/aiyourgym/taal/client'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { HTML_LANG } from '@/lib/aiyourgym/taal/taal'

// Eigen root layout van AI Your Gym (route-groep, de URL blijft /aiyourgym/...).
// Staat volledig los van de rest van de app: geen globals.css, geen TaalProvider,
// geen woordenboek en niets van MentaForce, Fit Factory, LifeOS of RELEASE V.
// Navigeren tussen deze groep en src/app/(hoofd) is een volledige paginalading.
//
// Bewust zonder titel of merknaam in de metadata: zolang de schakelaar uit staat
// krijgt iedereen behalve Kane hier een 404, en die mag niets over AI Your Gym
// verraden. Titels staan in aiyourgym/(site)/layout.tsx en per pagina; de poort,
// viewport en robots-regels in aiyourgym/layout.tsx.
//
// De taal (Nederlands of Engels) komt uit de cookie ayg-taal, anders Nederlands
// (src/lib/aiyourgym/taal). Eigen taalmodule, niet de MentaForce-i18n.

export default async function AiYourGymRootLayout({ children }: { children: ReactNode }) {
  const taal = await getSiteTaal()
  return (
    <html lang={HTML_LANG[taal]} className={AYG_FONT_KLASSEN}>
      <body>
        <AygTaal taal={taal}>{children}</AygTaal>
      </body>
    </html>
  )
}
