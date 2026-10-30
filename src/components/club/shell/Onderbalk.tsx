'use client'

import Link from 'next/link'
import { LayoutGrid, X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { groepTellers, onderdeelTeller, type Tellers } from '@/lib/club/menu/tellers'
import type { Onderdeel } from './onderdelen'
import { onderdeelIcoon } from './iconen'
import { TellerBadge } from './TellerBadge'

// De onderbalk op de telefoon en de tablet staand (besluit Kane 20-10-2026):
// de vier onderdelen die deze persoon het meest nodig heeft, onder de duim,
// plus Meer voor het menupaneel met alles. Meer licht op als je in een
// onderdeel bent dat niet in de balk staat, zodat je altijd ziet waar je bent.
// Een teller staat rechtsboven op het icoon; staat er een teller bij een
// onderdeel dat alleen onder Meer zit (Taken, Leads), dan krijgt Meer die teller.

interface OnderbalkProps {
  onderdelen: readonly Onderdeel[]
  /** Alle onderdelen in het menu van deze persoon, voor de teller op Meer. */
  alle: readonly Onderdeel[]
  tellers: Tellers
  /** Het menu-onderdeel waar je nu bent; null in de hulpbalk (die staat onder Meer). */
  huidig: Onderdeel | null
  href: (pad: string) => string
  menuOpen: boolean
  onMeer: () => void
  /** Een onderdeel gekozen: sluit het menupaneel als dat open stond. */
  onKies: () => void
}

export function Onderbalk({ onderdelen, alle, tellers, huidig, href, menuOpen, onMeer, onKies }: OnderbalkProps) {
  const t = useTekst(MENU)
  const inBalk = huidig !== null && onderdelen.some((o) => o.sleutel === huidig?.sleutel)
  const inBalkSleutels = new Set(onderdelen.map((o) => o.sleutel))
  const onderMeer = groepTellers(alle.filter((o) => !inBalkSleutels.has(o.sleutel)).map((o) => o.sleutel), tellers)
  // Zelfde soort al zichtbaar in de balk (Opvolgen bij Vandaag)? Dan niet nog eens op Meer.
  const inBalkSoorten = new Set(onderdelen.map((o) => onderdeelTeller(o.sleutel, tellers)?.soort).filter(Boolean))
  const meerTellers = onderMeer.filter((x) => !inBalkSoorten.has(x.soort))
  return (
    <nav className="club-onderbalk" aria-label={t.onderbalk.label}>
      {onderdelen.map((o) => {
        const Icoon = onderdeelIcoon(o.sleutel)
        const hier = !menuOpen && o.sleutel === huidig?.sleutel
        const teller = onderdeelTeller(o.sleutel, tellers)
        return (
          <Link key={o.sleutel} href={href(o.pad)} aria-current={hier ? 'page' : undefined} onClick={onKies}>
            <span className="club-onderbalk-icoon">
              <Icoon aria-hidden size={22} strokeWidth={hier ? 2.25 : 1.75} />
              {teller && <TellerBadge tellers={[teller]} klein />}
            </span>
            <span>{o.label}</span>
          </Link>
        )
      })}
      <button type="button" onClick={onMeer} aria-haspopup="dialog" aria-expanded={menuOpen} data-actief={menuOpen || !inBalk ? 'true' : undefined}>
        <span className="club-onderbalk-icoon">
          {menuOpen ? <X aria-hidden size={22} /> : <LayoutGrid aria-hidden size={22} strokeWidth={!inBalk ? 2.25 : 1.75} />}
          {!menuOpen && <TellerBadge tellers={meerTellers} klein />}
        </span>
        <span>{menuOpen ? t.onderbalk.sluiten : t.onderbalk.meer}</span>
      </button>
    </nav>
  )
}
