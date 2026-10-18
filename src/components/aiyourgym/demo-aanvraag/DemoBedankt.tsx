'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { DEMO, aygPad } from '@/components/aiyourgym/site/paden'

// Na het versturen: wat er nu gebeurt. Kane belt of mailt zelf; we beloven
// alleen wat we waarmaken (een reactie binnen een werkdag).

export function DemoBedankt({ naam }: { naam: string }) {
  const kop = useRef<HTMLHeadingElement>(null)
  useEffect(() => kop.current?.focus(), [])
  return (
    <section className="aan-klaar ayg-kaart dem-bedankt" aria-live="polite">
      <CheckCircle2 size={36} strokeWidth={1.8} aria-hidden="true" className="aan-klaar-icoon" />
      <h2 ref={kop} tabIndex={-1}>
        Bedankt{naam ? `, ${naam}` : ''}. We nemen binnen een werkdag contact op.
      </h2>
      <p className="ayg-lead">We bellen of mailen je om een moment te plannen dat jou uitkomt. Je zit nergens aan vast.</p>
      <p className="ayg-klein">Kijk in de tussentijd gerust al rond in de live demo.</p>
      <div className="ayg-knoppen">
        <Link href={DEMO} className="ayg-knop ayg-knop--accent">
          Bekijk de live demo
        </Link>
        <Link href={aygPad()} className="ayg-knop ayg-knop--rand">
          Terug naar de website
        </Link>
      </div>
    </section>
  )
}
