import type { Metadata } from 'next'
import { eisOnderdeel } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { HuisstijlPortaal } from '@/components/club/huisstijl/HuisstijlPortaal'
import { SportscholenKeuze } from '@/components/club/huisstijl/SportscholenKeuze'
import { BeheerdersBlok } from '@/components/club/huisstijl/BeheerdersBlok'
import { haalBeheerders } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { AdresBlok } from '@/components/club/huisstijl/AdresBlok'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import '@/components/club/huisstijl/huisstijl.css'

export const metadata: Metadata = { title: 'Huisstijl' }

// Het portaal van een sportschool: logo en naam, kleuren, onderdelen aan of uit.
// Wat hier wordt opgeslagen geldt meteen voor heel Club en de ledenapp van die
// sportschool. Bovenaan wisselt Kane van sportschool (alleen het platform);
// het adres en de eigenaren en clubmanagers beheren Kane en de eigenaar.

export default async function HuisstijlPagina() {
  const t = await eisOnderdeel('huisstijl')
  const beheren = magBeheerdersBeheren(t)
  const subdomeinen = subdomeinenActief()
  const org = t.organisatie
  const beheerders = beheren ? await haalBeheerders(t.admin, t.userId) : null
  const logoUrl = org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
  return (
    <>
      <InstelKruimel id="huisstijl" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{org.naam}{org.demo ? ' · demo' : ''}</p>
          <h1>Huisstijl</h1>
          <p>Logo, naam en kleuren van je sportschool, en welke onderdelen je gebruikt. Het geldt meteen voor iedereen in Club en in de ledenapp.</p>
        </div>
      </header>
      {t.isPlatformEigenaar && (
        <SportscholenKeuze
          actief={org.id}
          sportscholen={t.organisaties.map((o) => ({ id: o.id, naam: o.naam, demo: o.demo, kleurAccent: o.kleurAccent }))}
        />
      )}
      {beheren && <AdresBlok key={`adres-${org.id}`} slug={org.slug} naam={org.naam} subdomeinen={subdomeinen} />}
      <HuisstijlPortaal
        key={org.id}
        organisatie={{ naam: org.naam, slogan: org.slogan, kleurAccent: org.kleurAccent, thema: org.thema, uit: org.uit }}
        logoUrl={logoUrl}
        ingebouwdLogo={org.logo === LOGO_FIT_FACTORY}
      />
      {beheren && (
        <BeheerdersBlok
          sportschool={org.naam}
          beheerders={beheerders}
          loginAan={CLUB_EIGEN_LOGIN}
          eigenSportschool={t.isPlatformEigenaar && org.id === t.beheerderId}
          ikZelf={t.persoonId}
          linkBasis={org.slug ? sportschoolUrl(org.slug, subdomeinen) : null}
        />
      )}
    </>
  )
}
