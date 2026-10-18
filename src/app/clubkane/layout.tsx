import type { Metadata, Viewport } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { clubToegang, eisClubToegang } from '@/lib/club/toegang'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { ClubBalk } from '@/components/club/shell/ClubBalk'
import { zoekItems } from '@/components/club/shell/zoeken'
import { heeftInstellingen } from '@/lib/club/kern/instel-paginas'
import { instelKijker } from '@/lib/club/instel-toegang'
import { MerkProvider } from '@/components/club/shell/MerkContext'
import { VestigingenProvider } from '@/components/club/shell/VestigingenContext'
import { FfMaker } from '@/components/lifeos/pt-dashboard/FfMaker'
import { PT_FAVICON } from '@/lib/fit-factory/domein'
import { FIT_FACTORY } from '@/components/marketing/theme'
import { barlow, inter } from '@/app/fonts/fit-factory'
import './club.css'

// fitfactorypt.nl/clubkane: de all-in clubsoftware van Fit Factory (leden,
// rooster en reserveren, check-in, leads, intakes en schema's, ledenapp).
// Testfase: alleen Kane, plus (met de schakelaar CLUB_EIGEN_LOGIN aan) de
// eigenaren en clubmanagers van een sportschool, elk alleen in de eigen
// sportschool. De layout geeft iedereen anders een gewone 404; elke
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
  // Instellingen staat in het menu als je iets mag instellen; het zoekveld vindt ook elke instel-pagina.
  const kijker = instelKijker(t)
  const instellingen = heeftInstellingen(kijker)
  return (
    <div className={`lifeos-root ff club-app ${barlow.variable} ${inter.variable}`} style={stijl} data-thema={org.thema}>
      <MerkProvider merk={merk}>
        <VestigingenProvider vestigingen={t.vestigingen}>
          <Suspense fallback={<div className="club-kop club-kop--laden" aria-hidden />}>
            <ClubBalk ptCode={t.code} merk={merk} uit={org.uit} toegestaan={t.onderdelen} instellingen={instellingen} zoek={zoekItems(kijker, instellingen)} />
          </Suspense>
          <main className="club-werkvlak">{children}</main>
        </VestigingenProvider>
      </MerkProvider>
      <footer className="club-voet">
        <span>{org.naam} Club{org.demo ? ' · demo' : ''}{t.isKane ? ' · testomgeving, alleen zichtbaar voor Kane' : ''}</span>
        {t.isKane && t.organisaties.length > 1 && (
          <Link href="/clubkane/huisstijl#sportscholen-kop" className="club-voet-wissel">
            Andere sportschool
          </Link>
        )}
        {t.isKane && (
          <span className="club-voet-links">
            <Link href="/clubkane/platform" className="club-voet-wissel">Platform</Link>
            <Link href="/aiyourgym?bekijk=1" className="club-voet-wissel">Website AI Your Gym</Link>
            <Link href="/clubkane/hulp/meldingen" className="club-voet-wissel">Supportmeldingen</Link>
            <Link href="/clubkane/systeem" className="club-voet-wissel">Systeem</Link>
          </span>
        )}
        <FfMaker />
      </footer>
    </div>
  )
}
