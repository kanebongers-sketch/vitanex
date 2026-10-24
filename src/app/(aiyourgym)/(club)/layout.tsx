import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './basis.css'
import { CLUB_FONT_KLASSEN } from '@/components/club/shell/fonts'
import { AygTaal } from '@/lib/aiyourgym/taal/client'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { HTML_LANG } from '@/lib/aiyourgym/taal/taal'

// Eigen root layout van de app van AI Your Gym: Club (/club), de ledenapp
// (/mijn), de boekingswidget (/widget) en de inlogpagina's (/clubinloggen).
// Alleen op aiyourgym.com en de subdomeinen (src/proxy.ts); elders een kale 404.
// Staat volledig los van Fit Factory PT, LifeOS, MentaForce en RELEASE V: geen
// globals.css, geen TaalProvider en geen code van die apps. De verkoopwebsite
// heeft haar eigen root layout in ../(website)/layout.tsx; navigeren tussen die
// twee is een volledige paginalading.
//
// Geen merknaam in de standaard-metadata: Club is geheim tot de presentatie en
// een 404 mag niets verraden. Titels zetten de layouts en pagina's zelf.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// De taal is de voorkeur van de gebruiker (cookie ayg-taal), anders de browser,
// anders Nederlands (src/lib/aiyourgym/taal/server.ts, getTaal). Clientcomponenten
// lezen hem met useTaal().
export default async function ClubRootLayout({ children }: { children: ReactNode }) {
  const taal = await getTaal()
  return (
    <html lang={HTML_LANG[taal]} className={CLUB_FONT_KLASSEN}>
      <body>
        <AygTaal taal={taal}>{children}</AygTaal>
      </body>
    </html>
  )
}
