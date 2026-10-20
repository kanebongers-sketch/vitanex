'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Module } from '@/lib/club/kern/organisatie'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { groepenMet, menuOnderdeel, onderdelenVan } from './onderdelen'
import { VestigingKeuze } from './VestigingKeuze'

// Het menupaneel (Meer in de onderbalk): alle groepen met hun onderdelen in een
// oogopslag, twee kolommen grote tikvlakken, en de vestiging bovenaan. Op de
// telefoon blijft de onderbalk eronder zichtbaar, zodat dezelfde knop het
// paneel weer sluit. Escape of een tik naast het paneel sluit ook.

interface MenuPaneelProps {
  vestiging: Vestiging | null
  pilot: boolean
  pad: string
  uit: readonly Module[]
  /** Wat deze persoon mag zien; null = alles. */
  toegestaan: readonly string[] | null
  /** Staat Instellingen (het instellingencentrum) in het menu? */
  instellingen: boolean
  href: (pad: string) => string
  onSluit: () => void
  onWissel: (v: string) => void
}

export function MenuPaneel({ vestiging, pilot, pad, uit, toegestaan, instellingen, href, onSluit, onWissel }: MenuPaneelProps) {
  const huidig = menuOnderdeel(pad)
  const paneel = useRef<HTMLElement>(null)
  useEffect(() => {
    paneel.current?.querySelector<HTMLElement>('[aria-current="page"], a')?.focus()
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])
  return (
    <div className="club-menu-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <nav ref={paneel} id="club-menu" className="club-menu" aria-label="Alle onderdelen" role="dialog">
        <div className="club-menu-kop">
          <VestigingKeuze vestiging={vestiging} pilot={pilot} onWissel={onWissel} />
          <button type="button" className="club-knop club-knop--stil club-menu-sluit" aria-label="Menu sluiten" onClick={onSluit}>
            <X aria-hidden size={20} />
          </button>
        </div>
        {groepenMet(uit, toegestaan, instellingen).map((g) => (
          <section key={g.sleutel} className="club-menu-groep" aria-label={g.label} data-hier={huidig.groep === g.sleutel ? 'true' : undefined}>
            <h2>{g.label}</h2>
            <ul>
              {onderdelenVan(g.sleutel, uit, toegestaan, instellingen).map((o) => (
                <li key={o.sleutel}>
                  <Link href={href(o.pad)} aria-current={huidig.sleutel === o.sleutel ? 'page' : undefined} onClick={onSluit}>
                    {o.label}
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
