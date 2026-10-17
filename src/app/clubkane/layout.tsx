import type { Metadata, Viewport } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { Suspense } from 'react'
import { clubToegang, eisClubToegang } from '@/lib/club/toegang'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { ClubBalk } from '@/components/club/shell/ClubBalk'
import { MerkProvider } from '@/components/club/shell/MerkContext'
import { VestigingenProvider } from '@/components/club/shell/VestigingenContext'
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

export async function generateMetadata(): Promise<Metadata> {
  const naam = (await clubToegang())?.organisatie.naam ?? 'Club'
  return {
    title: { default: `${naam} Club`, template: `%s · ${naam} Club` },
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
    icons: { icon: PT_FAVICON },
  }
}

export const viewport: Viewport = { themeColor: FIT_FACTORY.zwart }

export default async function ClubLayout({ children }: { children: ReactNode }) {
  const t = await eisClubToegang()
  const org = t.organisatie
  // De huisstijl van de sportschool die open staat, als CSS-variabelen op de hele app.
  const stijl = huisstijlVariabelen(org.kleurAccent, org.thema) as CSSProperties
  const merk = {
    naam: org.naam,
    fitFactory: org.logo === LOGO_FIT_FACTORY,
    logoUrl: org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null,
  }
  return (
    <div className={`lifeos-root ff club-app ${barlow.variable} ${inter.variable}`} style={stijl} data-thema={org.thema}>
      <MerkProvider merk={merk}>
        <VestigingenProvider vestigingen={t.vestigingen}>
          <Suspense fallback={<div className="club-kop club-kop--laden" aria-hidden />}>
            <ClubBalk ptCode={t.code} merk={merk} uit={org.uit} />
          </Suspense>
          <main className="club-werkvlak">{children}</main>
        </VestigingenProvider>
      </MerkProvider>
      <footer className="club-voet">
        <span>{org.naam} Club{org.demo ? ' · demo' : ''} · testomgeving, alleen zichtbaar voor Kane</span>
        <FfMaker />
      </footer>
    </div>
  )
}
