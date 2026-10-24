'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { VESTIGING_PARAM } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import type { Module } from '@/lib/club/kern/organisatie'
import { GROEPEN, groepenMet, menuOnderdeel, onderbalkOnderdelen, onderdelenVan, toetsTekst } from './onderdelen'
import { HULPBALK, clubHref, hulpItemOp, type HulpSleutel } from './hulpbalk-items'
import type { ZoekItem } from './zoeken'
import { ClubZoeken } from './ClubZoeken'
import { MenuPaneel } from './MenuPaneel'
import { Onderbalk } from './Onderbalk'
import { VestigingKeuze } from './VestigingKeuze'
import { useSneltoetsen } from './useSneltoetsen'
import { useVestigingen } from './VestigingenContext'
import { UitlogKnop } from './UitlogKnop'

// De bovenkant van de clubsoftware (besluit Kane 20-10-2026: vooral de trainer
// op de vloer moet er makkelijk doorheen, op telefoon, tablet en pc even goed).
// Pc en tablet liggend: rij 1 met logo, de vijf groepen, zoeken en vestiging;
// rij 2 met de onderdelen van de groep waarin je zit, als knoppen over de hele
// breedte (het onderdeel waar je bent gevuld in de accentkleur). Telefoon en tablet staand:
// bovenin logo en zoeken, rij 2 met de groep en haar onderdelen, en onderin een
// vaste balk met de vier onderdelen die je het meest nodig hebt plus Meer (het
// menupaneel met alles). Zoeken (Ctrl K, / of het vergrootglas) vindt ook leden.
// Sneltoetsen op de pc: G en dan een letter (G dan L is Leden).
// Instellingen, Koppelingen, Ledenapp, Wat is nieuw en Hulp staan niet hier
// maar onderaan in de hulpbalk (Hulpbalk.tsx); op de telefoon onderaan in Meer.
// Ben je daar, dan licht geen groep op en noemt rij 2 waar je bent.

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

/** Op een smal scherm scrolt rij 2 zo dat het actieve onderdeel in beeld staat. */
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
  uit: readonly Module[]
  /** Wat deze persoon mag zien; null = alles. */
  toegestaan: readonly string[] | null
  /** Staat Instellingen (het instellingencentrum) in het menu? Zie heeftInstellingen. */
  instellingen: boolean
  /** Alles wat deze persoon via het zoekveld kan vinden. */
  zoek: readonly ZoekItem[]
  /** Mag deze persoon leden zoeken (recht Leden en het onderdeel aan)? */
  ledenZoeken: boolean
  /** Wat deze persoon in de hulpbalk heeft (ook onderaan in het menupaneel). */
  hulpbalk: readonly HulpSleutel[]
  /** Wie er kijkt, voor de teller bij Wat is nieuw. */
  persoon: string
}

export function ClubBalk({ testomgeving, merk, uit, toegestaan, instellingen, zoek: zoekItems, ledenZoeken, hulpbalk, persoon }: ClubBalkProps) {
  const pad = usePathname()
  const zoek = useSearchParams()
  const router = useRouter()
  const vestiging = kiesUit(useVestigingen(), zoek.get(VESTIGING_PARAM))
  const huidig = menuOnderdeel(pad)
  const groep = huidig ? GROEPEN.find((g) => g.sleutel === huidig.groep) : undefined
  const hulpHier = huidig ? undefined : HULPBALK.find((i) => i.sleutel === hulpItemOp(pad))
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const naar = useCallback((p: string) => clubHref(p, vestiging), [vestiging])
  const sluitMenu = useCallback(() => setMenuOpen(false), [setMenuOpen])
  useSneltoetsen({ uit, toegestaan, instellingen, href: naar })
  useActiefInBeeld(navRef, pad)

  function wissel(nieuw: string) {
    const params = new URLSearchParams(zoek.toString())
    params.set(VESTIGING_PARAM, nieuw)
    router.push(`${pad}?${params.toString()}`)
  }

  return (
    <>
      <header className="club-kop">
        <div className="club-balk">
          <Link href={naar('')} className="club-merk" aria-label={`${merk.naam}, naar Vandaag`}>
            <Merk merk={merk} />
            <span className="club-merk-woord">CLUB</span>
          </Link>
          <nav className="club-groepen" aria-label="Groepen">
            {groepenMet(uit, toegestaan).map((g) => {
              const eerste = onderdelenVan(g.sleutel, uit, toegestaan)[0]
              return (
                <Link key={g.sleutel} href={naar(eerste?.pad ?? '')} aria-current={huidig?.groep === g.sleutel ? 'true' : undefined} title={g.uitleg}>
                  {g.label}
                </Link>
              )
            })}
          </nav>
          <div className="club-balk-rechts">
            <ClubZoeken items={zoekItems} vestiging={vestiging} ledenZoeken={ledenZoeken} />
            <span className="club-balk-vestiging">
              <VestigingKeuze vestiging={vestiging} pilot={merk.fitFactory} onWissel={wissel} />
            </span>
            {testomgeving && (
              <span className="club-test" title="Alleen zichtbaar voor de platform-eigenaar tot de presentatie">
                Testomgeving
              </span>
            )}
            <UitlogKnop />
          </div>
        </div>
        {(groep || hulpHier) && (
        <nav ref={navRef} className="club-nav" aria-label={groep ? `Onderdelen van ${groep.label}` : 'Waar je bent'}>
          {/* De groep staat altijd voor de knoppen, zodat je ziet waar je zit (besluit Kane 23-10-2026). */}
          {groep && huidig && (
            <span className="club-nav-groep" data-zelfde={groep.label === huidig.label ? '' : undefined} aria-hidden>
              {groep.label}
            </span>
          )}
          {/* In de hulpbalk: de naam van het item en wat het is, zonder knoppen (die staan onderaan). */}
          {hulpHier && (
            <>
              <span className="club-nav-groep">{hulpHier.label}</span>
              <span className="club-nav-uitleg">{hulpHier.uitleg}</span>
            </>
          )}
          {huidig && onderdelenVan(huidig.groep, uit, toegestaan).map((o) => {
            const toets = toetsTekst(o)
            return (
              <Link key={o.sleutel} href={naar(o.pad)} aria-current={huidig.sleutel === o.sleutel ? 'page' : undefined} title={toets ? `${o.uitleg} (${toets})` : o.uitleg}>
                {o.label}
              </Link>
            )
          })}
        </nav>
        )}
      </header>
      <Onderbalk onderdelen={onderbalkOnderdelen(uit, toegestaan)} huidig={huidig} href={naar} menuOpen={menuOpen} onMeer={() => setMenuOpen((o) => !o)} onKies={sluitMenu} />
      {menuOpen && (
        <MenuPaneel vestiging={vestiging} pilot={merk.fitFactory} pad={pad} uit={uit} toegestaan={toegestaan} hulpbalk={hulpbalk} persoon={persoon} href={naar} onSluit={sluitMenu} onWissel={wissel} />
      )}
    </>
  )
}
