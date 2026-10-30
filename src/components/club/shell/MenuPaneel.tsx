'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { Verborgen } from '@/lib/club/kern/pakketten'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { TaalKeuze } from '@/components/aiyourgym/taal/TaalKeuze'
import { groepInTaal, groepenMet, menuOnderdeel, onderdeelInTaal, onderdelenVan } from './onderdelen'
import { hulpItemOp, type HulpSleutel } from './hulpbalk-items'
import { HulpLinks } from './Hulpbalk'
import { VestigingKeuze } from './VestigingKeuze'
import { openClubZoeken } from './ClubZoeken'
import { onderdeelIcoon } from './iconen'
import { TellerBadge } from './TellerBadge'
import { groepTellers, onderdeelTeller, type Tellers } from '@/lib/club/menu/tellers'

// Het menupaneel (Meer in de onderbalk): alle groepen met hun onderdelen in een
// oogopslag, twee kolommen grote tikvlakken, en de vestiging bovenaan. Onderaan
// de hulpbalk (Instellingen, Koppelingen, Ledenapp, Wat is nieuw, Hulp). Op de
// telefoon blijft de onderbalk eronder zichtbaar, zodat dezelfde knop het
// paneel weer sluit. Escape of een tik naast het paneel sluit ook.

interface MenuPaneelProps {
  vestiging: Vestiging | null
  pilot: boolean
  pad: string
  uit: readonly Verborgen[]
  /** Wat deze persoon mag zien; null = alles. */
  toegestaan: readonly string[] | null
  /** Wat deze persoon in de hulpbalk heeft. */
  hulpbalk: readonly HulpSleutel[]
  /** Wie er kijkt, voor de teller bij Wat is nieuw. */
  persoon: string
  /** De tellers van het menu (open taken, te bellen, nieuwe leads). */
  tellers: Tellers
  /** Zoekt het zoekvenster ook leden? Dan zegt de zoekknop dat. */
  ledenZoeken: boolean
  href: (pad: string) => string
  onSluit: () => void
  onWissel: (v: string) => void
}

export function MenuPaneel({ vestiging, pilot, pad, uit, toegestaan, hulpbalk, persoon, tellers, ledenZoeken, href, onSluit, onWissel }: MenuPaneelProps) {
  const huidig = menuOnderdeel(pad)
  const taal = useTaal()
  const t = useTekst(MENU)
  const paneel = useRef<HTMLElement>(null)
  useEffect(() => {
    paneel.current?.querySelector<HTMLElement>('[aria-current="page"], a')?.focus()
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])
  return (
    <div className="club-menu-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <nav ref={paneel} id="club-menu" className="club-menu" aria-label={t.menuPaneel.label} role="dialog">
        <div className="club-menu-kop">
          <VestigingKeuze vestiging={vestiging} pilot={pilot} onWissel={onWissel} />
          <button type="button" className="club-knop club-knop--stil club-menu-sluit" aria-label={t.menuPaneel.sluiten} onClick={onSluit}>
            <X aria-hidden size={20} />
          </button>
        </div>
        {/* Zoeken op de telefoon en tablet: hetzelfde venster als Ctrl K, groot en bovenaan. */}
        <button
          type="button"
          className="club-menu-zoek"
          onClick={() => {
            onSluit()
            openClubZoeken()
          }}
        >
          <Search aria-hidden size={18} />
          <span>{ledenZoeken ? t.zoeken.knopLeden : t.zoeken.knop}</span>
        </button>
        {groepenMet(uit, toegestaan).map((bron) => groepInTaal(bron, taal)).map((g) => {
          const van = onderdelenVan(g.sleutel, uit, toegestaan)
          return (
            <section key={g.sleutel} className="club-menu-groep" aria-label={g.label} data-hier={huidig?.groep === g.sleutel ? 'true' : undefined}>
              <h2>
                {g.label}
                <TellerBadge tellers={groepTellers(van.map((o) => o.sleutel), tellers)} klein />
              </h2>
              <ul>
                {van.map((bron) => onderdeelInTaal(bron, taal)).map((o) => {
                  const Icoon = onderdeelIcoon(o.sleutel)
                  const hier = huidig?.sleutel === o.sleutel
                  const teller = onderdeelTeller(o.sleutel, tellers)
                  return (
                    <li key={o.sleutel}>
                      <Link href={href(o.pad)} aria-current={hier ? 'page' : undefined} onClick={onSluit}>
                        <Icoon aria-hidden size={18} strokeWidth={hier ? 2.25 : 1.75} className="club-menu-icoon" />
                        <span className="club-menu-naam">{o.label}</span>
                        {teller && <TellerBadge tellers={[teller]} />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
        {hulpbalk.length > 0 && (
          <section className="club-menu-hulp" aria-label={t.menuPaneel.hulp} data-hier={hulpItemOp(pad) ? 'true' : undefined}>
            <h2>{t.menuPaneel.hulp}</h2>
            <HulpLinks sleutels={hulpbalk} persoon={persoon} pad={pad} href={href} onKies={onSluit} />
          </section>
        )}
        <div className="club-menu-taal">
          <TaalKeuze className="club-taalkeuze" />
        </div>
      </nav>
    </div>
  )
}
