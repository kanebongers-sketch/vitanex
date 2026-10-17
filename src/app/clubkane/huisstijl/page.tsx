import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { HuisstijlPortaal } from '@/components/club/huisstijl/HuisstijlPortaal'
import { SportscholenKeuze } from '@/components/club/huisstijl/SportscholenKeuze'
import '@/components/club/huisstijl/huisstijl.css'

export const metadata: Metadata = { title: 'Huisstijl' }

// Het portaal van een sportschool: logo en naam, kleuren, onderdelen aan of uit.
// Wat hier wordt opgeslagen geldt meteen voor heel Club en de ledenapp van die
// sportschool. Bovenaan wissel je van sportschool (alleen voor Kane).

export default async function HuisstijlPagina() {
  const t = await eisClubToegang()
  const org = t.organisatie
  const logoUrl = org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{org.naam}{org.demo ? ' · demo' : ''}</p>
          <h1>Huisstijl</h1>
          <p>Logo, naam en kleuren van je sportschool, en welke onderdelen je gebruikt. Het geldt meteen voor iedereen in Club en in de ledenapp.</p>
        </div>
      </header>
      <SportscholenKeuze
        actief={org.id}
        sportscholen={t.organisaties.map((o) => ({ id: o.id, naam: o.naam, demo: o.demo, kleurAccent: o.kleurAccent }))}
      />
      <HuisstijlPortaal
        key={org.id}
        organisatie={{ naam: org.naam, slogan: org.slogan, kleurAccent: org.kleurAccent, thema: org.thema, uit: org.uit }}
        logoUrl={logoUrl}
        ingebouwdLogo={org.logo === LOGO_FIT_FACTORY}
      />
    </>
  )
}
