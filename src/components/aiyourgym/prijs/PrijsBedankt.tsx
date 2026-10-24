'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { PRIJS_OP_MAAT } from '@/lib/aiyourgym/taal/woorden/website/prijs-op-maat'

// Na het versturen: wat er nu gebeurt. Kane neemt zelf contact op; we beloven
// alleen een reactie binnen een werkdag, net als bij een demo-aanvraag.

export function PrijsBedankt({ naam }: { naam: string }) {
  const kop = useRef<HTMLHeadingElement>(null)
  const taal = useTaal()
  const t = PRIJS_OP_MAAT[taal]
  const { AANMELDEN, DEMO } = SITE_PADEN
  useEffect(() => kop.current?.focus(), [])
  return (
    <section className="aan-klaar ayg-kaart dem-bedankt" aria-live="polite">
      <CheckCircle2 size={36} strokeWidth={1.8} aria-hidden="true" className="aan-klaar-icoon" />
      <h2 ref={kop} tabIndex={-1}>
        {t.bedankt(naam)}
      </h2>
      <p className="ayg-lead">{t.bedanktTekst}</p>
      <div className="ayg-knoppen">
        <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
          {t.alvast(PROEFDAGEN)}
        </Link>
        <Link href={DEMO} className="ayg-knop ayg-knop--rand">
          {t.bekijkDemo}
        </Link>
      </div>
    </section>
  )
}
