'use client'

import { useSyncExternalStore } from 'react'
import { groetVoorUur } from '@/lib/lifeos/momenten/momenten'

// Klein client-eiland: alleen de groet + datum hebben de klok van de gebruiker
// nodig. De rest van de cockpit blijft Server Component. De groet server-side
// bepalen zou de tijdzone van de server gebruiken — dan zit je om 07:00 in de
// "avond". Vandaar dezelfde useSyncExternalStore-vorm als de oude MomentWissel:
// de klok is een extern systeem, geen React-state.

function abonneerOpKlok(herlees: () => void): () => void {
  const id = setInterval(herlees, 60_000)
  return () => clearInterval(id)
}

/** Het úúr, niet de Date: React vergelijkt met Object.is, dus een render volgt
 *  hooguit één keer per uur in plaats van elke minuut. */
function leesUur(): number {
  return new Date().getHours()
}

/** De server kent de tijdzone van de gebruiker niet, dus geen antwoord. null →
 *  placeholder, en de client hydrateert met exact dezelfde output. Geen mismatch. */
function leesUurOpServer(): null {
  return null
}

export function CockpitKop() {
  const uur = useSyncExternalStore(abonneerOpKlok, leesUur, leesUurOpServer)

  if (uur === null) {
    // Rustige, stabiele placeholder met dezelfde hoogte — geen layout-schok bij
    // hydratie, geen spinner-spektakel.
    return <div className="os-kop" style={{ minHeight: 84 }} aria-hidden="true" />
  }

  const datum = new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="os-kop">
      <p className="os-kop__datum">{datum}</p>
      <h1 className="os-kop__groet">{groetVoorUur(uur)}, Kane</h1>
    </header>
  )
}
