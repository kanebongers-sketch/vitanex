'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

// Na een aanvraag (pakket nog niet online af te sluiten): eerlijk wat er nu gebeurt.

export function Ontvangen({ melding, sportschool }: { melding: string; sportschool: string }) {
  const kop = useRef<HTMLHeadingElement>(null)
  useEffect(() => kop.current?.focus(), [])
  return (
    <section className="aan-klaar ayg-kaart" aria-live="polite">
      <CheckCircle2 size={36} strokeWidth={1.8} aria-hidden="true" className="aan-klaar-icoon" />
      <h2 ref={kop} tabIndex={-1}>Aanvraag ontvangen{sportschool ? ` voor ${sportschool}` : ''}</h2>
      <p className="ayg-lead">{melding}</p>
      <p className="ayg-klein">Je betaalt niets en er is nog niets afgesloten.</p>
      <Link href="/aiyourgym" className="ayg-knop ayg-knop--rand">
        Terug naar de website
      </Link>
    </section>
  )
}
