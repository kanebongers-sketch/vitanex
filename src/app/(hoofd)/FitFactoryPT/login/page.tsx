import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { FfInloggen } from '@/components/lifeos/pt-dashboard/FfInloggen'
import { FfMaker } from '@/components/lifeos/pt-dashboard/FfMaker'
import { FIT_FACTORY } from '@/components/marketing/theme'
import { barlow, inter } from '@/app/fonts/fit-factory'
import { PT_FAVICON } from '@/lib/fit-factory/domein'

// fitfactorypt.nl/login (src/proxy.ts herschrijft /login hierheen): het
// inlogscherm van de beheerder, volledig in de Fit Factory-stijl.

export const metadata: Metadata = {
  title: 'Inloggen · Fit Factory PT',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  icons: { icon: PT_FAVICON, apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = { themeColor: FIT_FACTORY.zwart }

export default function FfLoginPagina() {
  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`}>
      <header className="ff-balk">
        <FfLogo prioriteit />
      </header>
      <div className="ptd ff-smal">
        <FfHero boventitel="Personal Training · team-app" titel="Inloggen" />
        <Suspense fallback={null}>
          <FfInloggen />
        </Suspense>
        <footer className="ff-voet">
          <span>Fit Factory Personal Training</span>
          <FfMaker />
        </footer>
      </div>
    </main>
  )
}
