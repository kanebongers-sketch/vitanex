'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { AANMELDEN, DEMO } from '@/components/aiyourgym/site/paden'

// Na het versturen: wat er nu gebeurt. Kane neemt zelf contact op; we beloven
// alleen een reactie binnen een werkdag, net als bij een demo-aanvraag.

export function PrijsBedankt({ naam }: { naam: string }) {
  const kop = useRef<HTMLHeadingElement>(null)
  useEffect(() => kop.current?.focus(), [])
  return (
    <section className="aan-klaar ayg-kaart dem-bedankt" aria-live="polite">
      <CheckCircle2 size={36} strokeWidth={1.8} aria-hidden="true" className="aan-klaar-icoon" />
      <h2 ref={kop} tabIndex={-1}>
        Bedankt{naam ? `, ${naam}` : ''}. Je hoort binnen een werkdag van ons.
      </h2>
      <p className="ayg-lead">We sturen je een prijs die past bij je sportschool. Heb je nog een vraag, dan bellen we je even. Je zit nergens aan vast.</p>
      <div className="ayg-knoppen">
        <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
          Probeer alvast {PROEFDAGEN} dagen gratis
        </Link>
        <Link href={DEMO} className="ayg-knop ayg-knop--rand">
          Bekijk de live demo
        </Link>
      </div>
    </section>
  )
}
