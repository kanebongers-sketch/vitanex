'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { VESTIGING_PARAM } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import type { Verborgen } from '@/lib/club/kern/pakketten'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { PLEKKEN, isHier, onderbalkPlekken, onderdeelInTaal, plekInTaal, plekOp, plekkenMet, schermenVan, toetsTekst, type MenuOpties } from './onderdelen'
import { KOP_HULP, clubHref, kopHulpInTaal, kopHulpOp } from './kop-hulp'
import type { ZoekItem } from './zoeken'
import { ClubZoeken } from './ClubZoeken'
import { KopHulp } from './KopHulp'
import { MenuPaneel, NaamKnop, type KaneLinks } from './MenuPaneel'
import { Onderbalk, type PlekLink } from './Onderbalk'
import { useSneltoetsen } from './useSneltoetsen'
import { useVestigingen } from './VestigingenContext'
import { onderdeelIcoon } from './iconen'
import { TellerBadge } from './TellerBadge'
import { useTellers } from './useTellers'
import { groepTellers, onderdeelTeller } from '@/lib/club/menu/tellers'
import './navigatie.css'

// De kop van Club: vijf plekken (ontwerp "Club in 10 minuten",
// docs/club/EENVOUD-10-MINUTEN.md). Pc en tablet liggend: rij 1 met het merk,
// de plekken (Vandaag, Leden, Rooster, Training, Beheer), zoeken, het
// vraagteken (Hulp en Wat is nieuw) en je naam (vestiging, taal, uitloggen);
// rij 2 met de schermen van de plek waar je bent, hoogstens drie, als knoppen
// over de hele breedte. Telefoon en tablet staand: bovenin merk, zoeken,
// vraagteken en naam, rij 2 met de schermen, en onderin dezelfde vijf plekken
// in dezelfde volgorde, zonder Meer. Sneltoetsen: G en dan V, L, R, T of B voor
// de plekken; de oude letters (G K Taken, G E Leads ...) blijven werken.
// Tellers (open taken, te bellen, nieuwe leads) staan op de plek en het scherm,
// bij 0 niets (lib/club/menu/tellers.ts).

/** Het merk van de sportschool die open staat: haar logo, of haar naam als woordmerk. */
export interface ClubMerkInfo {
  naam: string
  /** URL van het geuploade logo, of null. */
  logoUrl: string | null
  /** Het ingebouwde Fit Factory-logo. */
  fitFactory: boolean
}

function Merk({ merk }: { merk: ClubMerkInfo }) {
  if (merk.fitFactory) return <FitFactoryLogo />
  if (merk.logoUrl) {
    return <img src={merk.logoUrl} alt={merk.naam} className="club-merk-logo" />
  }
  return <span className="club-merk-naam">{merk.naam}</span>
}

/** Op een smal scherm scrolt rij 2 zo dat het actieve scherm in beeld staat. */
function useActiefInBeeld(nav: RefObject<HTMLElement | null>, pad: string): void {
  useEffect(() => {
    const rij = nav.current
    const actief = rij?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!rij || !actief || rij.scrollWidth <= rij.clientWidth) return
    const r = rij.getBoundingClientRect()
    const a = actief.getBoundingClientRect()
    rij.scrollTo({ left: rij.scrollLeft + a.left - r.left - (r.width - a.width) / 2 })
  }, [nav, pad])
}

interface ClubBalkProps {
  /** De platform-eigenaar ziet het label Testomgeving (tot de presentatie). */
  testomgeving: boolean
  merk: ClubMerkInfo
  /** Onderdelen die bij deze sportschool uit staan. */
  uit: readonly Verborgen[]
  /** Wat deze persoon mag zien; null = alles. */
  toegestaan: readonly string[] | null
  /** Staat Instellingen (het instellingencentrum) in Beheer? Zie heeftInstellingen. */
  instellingen: boolean
  /** Schermen die nog leeg zijn (verbergen tot gebruikt, zie inGebruik). */
  nogLeeg: readonly string[]
  /** Alles wat deze persoon via het zoekveld kan vinden. */
  zoek: readonly ZoekItem[]
  /** Mag deze persoon leden zoeken (recht Leden en het onderdeel aan)? */
  ledenZoeken: boolean
  /** Wie er kijkt, voor de teller bij Wat is nieuw. */
  persoon: string
  /** De naam van wie er kijkt, rechtsboven. */
  naam: string
  /** Een demo-sportschool: dat staat onder je naam. */
  demo: boolean
  /** Alleen het master account: de links die vroeger in de voet stonden. */
  kane: KaneLinks | null
  /** Heeft deze persoon minstens een teller (lib/club/menu/tellers.ts)? Anders vraagt de balk niets op. */
  tellers: boolean
  /** "Aan de slag" voor een nieuwe sportschool (AanDeSlagKop, server, in een Suspense). */
  aanDeSlag?: ReactNode
}

export function ClubBalk({ testomgeving, merk, uit, toegestaan, instellingen, nogLeeg, zoek: zoekItems, ledenZoeken, persoon, naam, demo, kane, tellers: tellersAan, aanDeSlag }: ClubBalkProps) {
  const pad = usePathname()
  const zoek = useSearchParams()
  const router = useRouter()
  const vestiging = kiesUit(useVestigingen(), zoek.get(VESTIGING_PARAM))
  const taal = useTaal()
  const t = useTekst(MENU)
  const opties: MenuOpties = { instellingen, nogLeeg, pad }
  const plekHier = plekOp(pad)
  const plekBron = plekHier ? PLEKKEN.find((p) => p.sleutel === plekHier) : undefined
  const plek = plekBron ? plekInTaal(plekBron, taal) : undefined
  const schermen = plekHier ? schermenVan(plekHier, uit, toegestaan, opties) : []
  const hulpSleutel = plek ? null : kopHulpOp(pad)
  const hulpBron = hulpSleutel ? KOP_HULP.find((i) => i.sleutel === hulpSleutel) : undefined
  const hulpHier = hulpBron ? kopHulpInTaal(hulpBron, taal) : undefined
  const navRef = useRef<HTMLElement>(null)
  const naar = useCallback((p: string) => clubHref(p, vestiging), [vestiging])
  const tellers = useTellers(vestiging, pad, tellersAan)
  useSneltoetsen({ uit, toegestaan, instellingen, href: naar })
  useActiefInBeeld(navRef, pad)
  const [naamOpen, setNaamOpen] = useState(false)
  const sluitNaam = useCallback(() => setNaamOpen(false), [])

  function wissel(nieuw: string) {
    const params = new URLSearchParams(zoek.toString())
    params.set(VESTIGING_PARAM, nieuw)
    router.push(`${pad}?${params.toString()}`)
  }

  const plekken = plekkenMet(uit, toegestaan, opties)
  const plekLinks: PlekLink[] = plekken.map((bron) => {
    const p = plekInTaal(bron, taal)
    const van = schermenVan(p.sleutel, uit, toegestaan, opties)
    return { plek: p, href: naar(van[0]?.pad ?? ''), tellers: groepTellers(van.map((o) => o.sleutel), tellers), toets: toetsTekst(p) }
  })

  return (
    <>
      <header className="club-kop">
        <div className="club-balk">
          <Link href={naar('')} className="club-merk" aria-label={t.kop.naarVandaag(merk.naam)}>
            <Merk merk={merk} />
            <span className="club-merk-woord">CLUB</span>
          </Link>
          {plekLinks.length > 1 && (
            <nav className="club-groepen club-plekken" aria-label={t.kop.plekken}>
              {plekLinks.map(({ plek: p, href, tellers: tel, toets }) => (
                <Link key={p.sleutel} href={href} aria-current={plekHier === p.sleutel ? 'true' : undefined} title={toets ? `${p.uitleg} (${toets})` : p.uitleg}>
                  {p.label}
                  <TellerBadge tellers={tel} klein />
                </Link>
              ))}
            </nav>
          )}
          <div className="club-balk-rechts">
            {aanDeSlag}
            <ClubZoeken items={zoekItems} vestiging={vestiging} ledenZoeken={ledenZoeken} tellers={tellers} />
            {testomgeving && (
              <span className="club-test" title={t.kop.testomgevingUitleg}>
                {t.kop.testomgeving}
              </span>
            )}
            <KopHulp persoon={persoon} href={naar('/hulp')} hier={hulpSleutel !== null} />
            <NaamKnop naam={naam} vestiging={vestiging} open={naamOpen} onOpen={setNaamOpen} />
          </div>
        </div>
        {((plek && schermen.length > 0) || hulpHier) && (
          <nav ref={navRef} className="club-nav" aria-label={plek ? t.kop.schermenVan(plek.label) : t.kop.waarJeBent}>
            {/* De plek staat altijd voor de knoppen, zodat je ziet waar je zit (besluit Kane 23-10-2026). */}
            {plek && (
              <span className="club-nav-groep" data-zelfde={schermen.length === 1 && onderdeelInTaal(schermen[0], taal).label === plek.label ? '' : undefined} aria-hidden>
                {plek.label}
              </span>
            )}
            {/* Op Hulp of Wat is nieuw: de naam en wat het is, zonder knoppen. */}
            {hulpHier && (
              <>
                <span className="club-nav-groep">{hulpHier.label}</span>
                <span className="club-nav-uitleg">{hulpHier.uitleg}</span>
              </>
            )}
            {schermen.map((bron) => {
              const o = onderdeelInTaal(bron, taal)
              const toets = toetsTekst(o)
              const Icoon = onderdeelIcoon(o.sleutel)
              const hier = isHier(bron, pad)
              const teller = onderdeelTeller(o.sleutel, tellers)
              return (
                <Link key={o.sleutel} href={naar(o.pad)} aria-current={hier ? 'page' : undefined} title={toets ? `${o.uitleg} (${toets})` : o.uitleg}>
                  <Icoon aria-hidden size={17} strokeWidth={hier ? 2.25 : 1.75} className="club-nav-icoon" />
                  <span>{o.label}</span>
                  {teller && <TellerBadge tellers={[teller]} />}
                </Link>
              )
            })}
          </nav>
        )}
      </header>
      {naamOpen && (
        <MenuPaneel naam={naam} vestiging={vestiging} pilot={merk.fitFactory} sportschool={merk.naam} demo={demo} testomgeving={testomgeving} kane={kane} onSluit={sluitNaam} onWissel={wissel} />
      )}
      <Onderbalk plekken={onderbalkPlekken(uit, toegestaan, opties).map((p) => plekLinks.find((l) => l.plek.sleutel === p.sleutel)).filter((l): l is PlekLink => l !== undefined)} hier={plekHier} onKies={sluitNaam} />
    </>
  )
}
