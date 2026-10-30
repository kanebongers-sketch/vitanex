import type { Metadata } from 'next'
import { eisOnderdeel } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { adresVan, sportschoolUrl } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { HuisstijlPortaal } from '@/components/club/huisstijl/HuisstijlPortaal'
import { SportscholenKeuze } from '@/components/club/huisstijl/SportscholenKeuze'
import { BeheerdersBlok } from '@/components/club/huisstijl/BeheerdersBlok'
import { haalBeheerders } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { rollenV2Aan } from '@/lib/club/rollen/schakelaar'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import Link from 'next/link'
import { AdresBlok } from '@/components/club/huisstijl/AdresBlok'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'
import '@/components/club/huisstijl/huisstijl.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(HUISSTIJL)).pagina.titel }
}

// Het portaal van een sportschool: logo en naam, kleuren, onderdelen aan of uit.
// Wat hier wordt opgeslagen geldt meteen voor heel Club en de ledenapp van die
// sportschool. Bovenaan wisselt Kane van sportschool (alleen het platform);
// het adres en de eigenaren en clubmanagers beheren Kane en de eigenaar.

export default async function HuisstijlPagina() {
  const t = await eisOnderdeel('huisstijl')
  const beheren = magBeheerdersBeheren(t)
  const subdomeinen = subdomeinenActief()
  const org = t.organisatie
  const beheerders = beheren && !rollenV2Aan(org.id) ? await haalBeheerders(t.admin, t.userId) : null
  const tekst = (await clubTekst(HUISSTIJL)).pagina
  const rollenTekst = await clubTekst(ROLLEN_TEKST)
  const logoUrl = org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
  return (
    <>
      <InstelKruimel id="huisstijl" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{org.naam}{org.demo ? ` · ${tekst.demo}` : ''}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
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
        organisatie={{ naam: org.naam, slogan: org.slogan, kleurAccent: org.kleurAccent, thema: org.thema, uit: org.eigenUit }}
        logoUrl={logoUrl}
        ingebouwdLogo={org.logo === LOGO_FIT_FACTORY}
        adres={org.slug ? adresVan(org.slug, subdomeinen) : null}
        afgenomen={org.afgenomen}
      />
      {beheren && rollenV2Aan(org.id) && (
        <section className="club-kaart club-beheerders" aria-labelledby="beheerders-kop">
          <h2 id="beheerders-kop">{rollenTekst.team.verhuisdKop}</h2>
          <p className="club-hint">{rollenTekst.team.verhuisd}</p>
          <p><Link className="club-knop club-knop--stil" href="/club/beheer/team">{rollenTekst.team.naarTeam}</Link></p>
        </section>
      )}
      {beheren && !rollenV2Aan(org.id) && (
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
