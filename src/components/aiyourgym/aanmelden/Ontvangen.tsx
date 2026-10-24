'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { aygPad, sitePaden } from '@/components/aiyourgym/site/paden'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'

// Na een aanvraag (pakket nog niet online af te sluiten): eerlijk wat er nu gebeurt.

export function Ontvangen({ melding, sportschool }: { melding: string; sportschool: string }) {
  const kop = useRef<HTMLHeadingElement>(null)
  const taal = useTaal()
  const t = AANMELD_FORMULIER[taal]
  useEffect(() => {
    kop.current?.focus({ preventScroll: true })
    kop.current?.scrollIntoView({ block: 'center' })
  }, [])
  return (
    <section className="aan-klaar ayg-kaart" aria-live="polite">
      <CheckCircle2 size={36} strokeWidth={1.8} aria-hidden="true" className="aan-klaar-icoon" />
      <h2 ref={kop} tabIndex={-1}>{t.ontvangenKop(sportschool)}</h2>
      <p className="ayg-lead">{melding}</p>
      <p className="ayg-klein">{t.ontvangenNiets}</p>
      <div className="ayg-knoppen">
        <Link href={sitePaden(taal).DEMO} className="ayg-knop ayg-knop--accent">
          {t.bekijkDemo} <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link href={aygPad('', taal)} className="ayg-knop ayg-knop--rand">
          {t.terugWebsite}
        </Link>
      </div>
    </section>
  )
}
