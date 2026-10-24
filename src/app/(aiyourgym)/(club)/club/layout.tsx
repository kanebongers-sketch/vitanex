import type { Metadata, Viewport } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { clubToegang, eisClubToegang } from '@/lib/club/toegang'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { LOGO_FIT_FACTORY, moduleAan } from '@/lib/club/kern/organisatie'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { ClubBalk } from '@/components/club/shell/ClubBalk'
import { zoekItems } from '@/components/club/shell/zoeken'
import { hulpbalkVoor, kijkerSleutel } from '@/components/club/shell/hulpbalk-items'
import { Hulpbalk } from '@/components/club/shell/Hulpbalk'
import { heeftInstellingen } from '@/lib/club/kern/instel-paginas'
import { instelKijker } from '@/lib/club/instel-toegang'
import { MerkProvider } from '@/components/club/shell/MerkContext'
import { VestigingenProvider } from '@/components/club/shell/VestigingenContext'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { wizardPoortDicht } from '@/lib/club/start/opslag'
import { WizardPoort } from '@/components/club/start/WizardPoort'
import { StartBalk, WizardWacht } from '@/components/club/start/StartBalk'
import './club.css'

// aiyourgym.com/club: de all-in clubsoftware van AI Your Gym (leden,
// rooster en reserveren, check-in, leads, intakes en schema's, ledenapp).
// Alleen op aiyourgym.com en de subdomeinen (src/proxy.ts). Testfase: alleen
// de platform-eigenaar (master account van Kane), plus (met de schakelaar CLUB_EIGEN_LOGIN aan) de
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
  }
}

export const viewport: Viewport = { themeColor: '#0a0b09' }

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
  // Leden vinden vanuit het zoekveld: alleen voor wie Leden mag zien.
  const ledenZoeken = moduleAan(org, 'leden') && magOnderdeel(t.onderdelen, 'leden')
  // Eerst de startwizard (regel in src/lib/club/start/poort.ts): de eigenaar ziet alleen de wizard,
  // hulp en het abonnement; het team wacht tot de eigenaar klaar is.
  const poortDicht = await wizardPoortDicht(t)
  const eigenaar = magBeheerdersBeheren(t)
  // De hulpbalk onderaan (Instellingen, Koppelingen, Ledenapp, Wat is nieuw, Hulp), alleen wat deze persoon mag.
  const hulpbalk = hulpbalkVoor(kijker, instellingen)
  // Wie er kijkt, voor wat hij al zag bij Wat is nieuw (alleen in zijn eigen browser bewaard).
  const persoon = kijkerSleutel(t)
  return (
    <div className="club-app" style={stijl} data-thema={org.thema}>
      <MerkProvider merk={merk}>
        <VestigingenProvider vestigingen={t.vestigingen}>
          {poortDicht ? (
            <StartBalk naam={org.naam} logoUrl={merk.logoUrl} wizard={eigenaar} />
          ) : (
            <Suspense fallback={<div className="club-kop club-kop--laden" aria-hidden />}>
              <ClubBalk testomgeving={t.isPlatformEigenaar} merk={merk} uit={org.uit} toegestaan={t.onderdelen} instellingen={instellingen} zoek={zoekItems(kijker, instellingen)} ledenZoeken={ledenZoeken} hulpbalk={hulpbalk} persoon={persoon} />
            </Suspense>
          )}
          <main className="club-werkvlak">{!poortDicht ? children : eigenaar ? <WizardPoort>{children}</WizardPoort> : <WizardWacht naam={org.naam} />}</main>
          {!poortDicht && (
            <Suspense fallback={null}>
              <Hulpbalk sleutels={hulpbalk} persoon={persoon} />
            </Suspense>
          )}
        </VestigingenProvider>
      </MerkProvider>
      <footer className="club-voet">
        <span>{org.naam} Club{org.demo ? ' · demo' : ''}{t.isPlatformEigenaar ? ' · testomgeving, alleen zichtbaar voor de platform-eigenaar' : ''}</span>
        {t.isPlatformEigenaar && t.organisaties.length > 1 && (
          <Link href="/club/huisstijl#sportscholen-kop" className="club-voet-wissel">
            Andere sportschool
          </Link>
        )}
        {t.isPlatformEigenaar && (
          <span className="club-voet-links">
            <Link href="/club/platform" className="club-voet-wissel">Platform</Link>
            {/* Eigen root layout: Next laadt de website dan als volledige pagina. */}
            <Link href="/" className="club-voet-wissel">Website AI Your Gym</Link>
            <Link href="/club/hulp/meldingen" className="club-voet-wissel">Supportmeldingen</Link>
            <Link href="/club/systeem" className="club-voet-wissel">Systeem</Link>
          </span>
        )}
      </footer>
    </div>
  )
}
