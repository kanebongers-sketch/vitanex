'use client'

import Link from 'next/link'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import type { Teller } from '@/lib/club/menu/tellers'
import type { Plek, PlekSleutel } from './onderdelen'
import { plekIcoon } from './iconen'
import { TellerBadge } from './TellerBadge'

// De onderbalk op de telefoon en de tablet staand: dezelfde vijf plekken als
// bovenin op de pc, in dezelfde volgorde, onder de duim (ontwerp "Club in 10
// minuten"). Geen Meer: vijf past precies. Een plek brengt je naar haar eerste
// scherm; de andere schermen van de plek staan in rij 2 bovenin. De plek waar
// je bent licht op. Een teller staat rechtsboven op het icoon. Met een plek
// is er geen onderbalk (onderbalkPlekken geeft dan niets).

/** Een plek zoals de kop hem al heeft uitgerekend: naam, link en tellers. */
export interface PlekLink {
  plek: Plek
  href: string
  tellers: Teller[]
  toets: string | null
}

interface OnderbalkProps {
  plekken: readonly PlekLink[]
  /** De plek waar je nu bent, of null (Hulp, platform). */
  hier: PlekSleutel | null
  /** Een plek gekozen: sluit het naam-menu als dat open stond. */
  onKies: () => void
}

export function Onderbalk({ plekken, hier, onKies }: OnderbalkProps) {
  const t = useTekst(MENU)
  if (plekken.length < 2) return null
  return (
    <nav className="club-onderbalk" aria-label={t.onderbalk.label} data-aantal={plekken.length}>
      {plekken.map(({ plek, href, tellers }) => {
        const Icoon = plekIcoon(plek.sleutel)
        const actief = plek.sleutel === hier
        return (
          <Link key={plek.sleutel} href={href} aria-current={actief ? 'page' : undefined} onClick={onKies}>
            <span className="club-onderbalk-icoon">
              <Icoon aria-hidden size={22} strokeWidth={actief ? 2.25 : 1.75} />
              <TellerBadge tellers={tellers} klein />
            </span>
            <span>{plek.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
