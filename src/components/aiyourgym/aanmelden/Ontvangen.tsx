'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { DEMO, aygPad } from '@/components/aiyourgym/site/paden'

// Na een aanvraag (pakket nog niet online af te sluiten): eerlijk wat er nu gebeurt.

export function Ontvangen({ melding, sportschool }: { melding: string; sportschool: string }) {
  const kop = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    kop.current?.focus({ preventScroll: true })
    kop.current?.scrollIntoView({ block: 'center' })
  }, [])
  return (
    <section className="aan-klaar ayg-kaart" aria-live="polite">
      <CheckCircle2 size={36} strokeWidth={1.8} aria-hidden="true" className="aan-klaar-icoon" />
      <h2 ref={kop} tabIndex={-1}>Aanvraag ontvangen{sportschool ? ` voor ${sportschool}` : ''}</h2>
      <p className="ayg-lead">{melding}</p>
      <p className="ayg-klein">Je betaalt niets en er is nog niets afgesloten. Tot we elkaar spreken kun je rustig rondkijken.</p>
      <div className="ayg-knoppen">
        <Link href={DEMO} className="ayg-knop ayg-knop--accent">
          Bekijk de live demo <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link href={aygPad()} className="ayg-knop ayg-knop--rand">
          Terug naar de website
        </Link>
      </div>
    </section>
  )
}
