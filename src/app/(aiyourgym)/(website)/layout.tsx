import type { ReactNode } from 'react'
import './basis.css'
import { AYG_FONT_KLASSEN } from '@/components/aiyourgym/merk/fonts'

// Eigen root layout van AI Your Gym (route-groep, de URL blijft /aiyourgym/...).
// Staat volledig los van de rest van de app: geen globals.css, geen TaalProvider,
// geen woordenboek en niets van MentaForce, Fit Factory, LifeOS of RELEASE V.
// Navigeren tussen deze groep en src/app/(hoofd) is een volledige paginalading.
//
// Bewust zonder titel of merknaam in de metadata: zolang de schakelaar uit staat
// krijgt iedereen behalve Kane hier een 404, en die mag niets over AI Your Gym
// verraden. Titels staan in aiyourgym/(site)/layout.tsx en per pagina; de poort,
// viewport en robots-regels in aiyourgym/layout.tsx.

export default function AiYourGymRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" className={AYG_FONT_KLASSEN}>
      <body>{children}</body>
    </html>
  )
}
