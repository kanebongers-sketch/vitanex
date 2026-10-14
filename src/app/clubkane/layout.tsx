import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { eisClubToegang } from '@/lib/club/toegang'
import { ClubBalk } from '@/components/club/shell/ClubBalk'
import { FfMaker } from '@/components/lifeos/pt-dashboard/FfMaker'
import { PT_FAVICON } from '@/lib/fit-factory/domein'
import { FIT_FACTORY } from '@/components/marketing/theme'
import { barlow, inter } from '@/app/fonts/fit-factory'
import './club.css'

// fitfactorypt.nl/clubkane: de all-in clubsoftware van Fit Factory (leden,
// rooster en reserveren, check-in, leads, intakes en schema's, ledenapp).
// Testfase: alleen Kane. De layout geeft iedereen anders een gewone 404; elke
// pagina en elke /api/club-route controleert dat zelf nog een keer (zie
// src/lib/club/toegang.ts). Nooit in zoekmachines.

export const metadata: Metadata = {
  title: { default: 'Fit Factory Club', template: '%s · Fit Factory Club' },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  icons: { icon: PT_FAVICON },
}

export const viewport: Viewport = { themeColor: FIT_FACTORY.zwart }

export default async function ClubLayout({ children }: { children: ReactNode }) {
  const t = await eisClubToegang()
  return (
    <div className={`lifeos-root ff club-app ${barlow.variable} ${inter.variable}`}>
      <Suspense fallback={<div className="club-kop club-kop--laden" aria-hidden />}>
        <ClubBalk ptCode={t.code} />
      </Suspense>
      <main className="club-werkvlak">{children}</main>
      <footer className="club-voet">
        <span>Fit Factory Club · testomgeving, alleen zichtbaar voor Kane</span>
        <FfMaker />
      </footer>
    </div>
  )
}
