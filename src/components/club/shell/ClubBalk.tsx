'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, Menu, X } from 'lucide-react'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { VESTIGINGEN, VESTIGING_LABEL, VESTIGING_PARAM, PILOT_VESTIGING, kiesVestiging, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Module } from '@/lib/club/kern/organisatie'
import { GROEPEN, actiefOnderdeel, groepenMet, isActief, onderdelenVan } from './onderdelen'

// De bovenkant van de clubsoftware. Een ingedeeld menu, maar anders dan de
// zijbalk van Virtuagym: alles bovenin zodat het werkvlak de volle breedte houdt.
// Rij 1: logo, vestiging en de vijf groepen. Rij 2: de onderdelen van de groep
// waarin je zit. Op de telefoon een knop Menu met een paneel met alle groepen.
// De vestiging staat in de URL; wisselen houdt je op hetzelfde onderdeel.

function href(pad: string, vestiging: Vestiging): string {
  return `/clubkane${pad}?${VESTIGING_PARAM}=${vestiging}`
}

function VestigingKeuze({ vestiging, onWissel }: { vestiging: Vestiging; onWissel: (v: string) => void }) {
  return (
    <label className="club-vestiging">
      <Building2 aria-hidden size={16} />
      <span className="club-sr">Vestiging</span>
      <select value={vestiging} onChange={(e) => onWissel(e.target.value)}>
        {VESTIGINGEN.map((v) => (
          <option key={v} value={v}>
            {VESTIGING_LABEL[v]}
            {v === PILOT_VESTIGING ? ' (pilot)' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Het merk van de sportschool die open staat: haar logo, of haar naam als woordmerk. */
export interface ClubMerkInfo {
  naam: string
  /** URL van het geuploade logo, of null. */
  logoUrl: string | null
  /** Het ingebouwde Fit Factory-logo. */
  fitFactory: boolean
}

function Merk({ merk }: { merk: ClubMerkInfo }) {
  if (merk.fitFactory) return <FfLogo />
  if (merk.logoUrl) {
    return <img src={merk.logoUrl} alt={merk.naam} className="club-merk-logo" />
  }
  return <span className="club-merk-naam">{merk.naam}</span>
}

interface MenuPaneelProps {
  vestiging: Vestiging
  pad: string
  uit: readonly Module[]
  onSluit: () => void
  onWissel: (v: string) => void
}

function MenuPaneel({ vestiging, pad, uit, onSluit, onWissel }: MenuPaneelProps) {
  const sluitKnop = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    sluitKnop.current?.focus()
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])
  return (
    <div className="club-menu-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <nav className="club-menu" aria-label="Menu" role="dialog" aria-modal="true">
        <div className="club-menu-kop">
          <VestigingKeuze vestiging={vestiging} onWissel={onWissel} />
          <button ref={sluitKnop} type="button" className="club-knop club-knop--stil" aria-label="Menu sluiten" onClick={onSluit}>
            <X aria-hidden size={20} />
          </button>
        </div>
        {groepenMet(uit).map((g) => (
          <section key={g.sleutel} className="club-menu-groep" aria-label={g.label}>
            <h2>{g.label}</h2>
            <ul>
              {onderdelenVan(g.sleutel, uit).map((o) => (
                <li key={o.sleutel}>
                  <Link href={href(o.pad, vestiging)} aria-current={isActief(o, pad) ? 'page' : undefined} onClick={onSluit}>
                    <span>{o.label}</span>
                    <small>{o.uitleg}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  )
}

interface ClubBalkProps {
  ptCode: string
  merk: ClubMerkInfo
  /** Onderdelen die bij deze sportschool uit staan. */
  uit: readonly Module[]
}

export function ClubBalk({ ptCode, merk, uit }: ClubBalkProps) {
  const pad = usePathname()
  const zoek = useSearchParams()
  const router = useRouter()
  const vestiging = kiesVestiging(zoek.get(VESTIGING_PARAM))
  const huidig = actiefOnderdeel(pad)
  const [menuOpen, setMenuOpen] = useState(false)

  function wissel(nieuw: string) {
    const params = new URLSearchParams(zoek.toString())
    params.set(VESTIGING_PARAM, nieuw)
    router.push(`${pad}?${params.toString()}`)
  }

  return (
    <header className="club-kop">
      <div className="club-balk">
        <Link href={href('', vestiging)} className="club-merk" aria-label={`${merk.naam}, naar Vandaag`}>
          <Merk merk={merk} />
          <span className="club-merk-woord">CLUB</span>
        </Link>
        <nav className="club-groepen" aria-label="Groepen">
          {groepenMet(uit).map((g) => {
            const eerste = onderdelenVan(g.sleutel, uit)[0]
            return (
              <Link key={g.sleutel} href={href(eerste?.pad ?? '', vestiging)} aria-current={huidig.groep === g.sleutel ? 'true' : undefined} title={g.uitleg}>
                {g.label}
              </Link>
            )
          })}
        </nav>
        <div className="club-balk-rechts">
          <VestigingKeuze vestiging={vestiging} onWissel={wissel} />
          <span className="club-test" title="Alleen zichtbaar voor Kane tot de presentatie">
            Testomgeving
          </span>
          <Link href={`/${ptCode}`} className="club-terug" prefetch={false}>
            <ArrowLeft aria-hidden size={15} />
            <span>PT-app</span>
          </Link>
          <button type="button" className="club-knop club-knop--klein club-menuknop" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Menu aria-hidden size={18} />
            Menu
          </button>
        </div>
      </div>
      <nav className="club-nav" aria-label={`Onderdelen van ${GROEPEN.find((g) => g.sleutel === huidig.groep)?.label ?? 'de groep'}`}>
        {onderdelenVan(huidig.groep, uit).map((o) => (
          <Link key={o.sleutel} href={href(o.pad, vestiging)} aria-current={isActief(o, pad) ? 'page' : undefined} title={o.uitleg}>
            {o.label}
          </Link>
        ))}
      </nav>
      {menuOpen && <MenuPaneel vestiging={vestiging} pad={pad} uit={uit} onSluit={() => setMenuOpen(false)} onWissel={wissel} />}
    </header>
  )
}
