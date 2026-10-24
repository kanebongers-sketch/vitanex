'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { SITE_PADEN, aygPad } from '@/components/aiyourgym/site/paden'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { DEMO_AANVRAAG } from '@/lib/aiyourgym/taal/woorden/website/demo-aanvraag'

// Na het versturen: wat er nu gebeurt. Kane belt of mailt zelf; we beloven
// alleen wat we waarmaken (een reactie binnen een werkdag). In de taal van de
// pagina (woordenboek DEMO_AANVRAAG).

export function DemoBedankt({ naam }: { naam: string }) {
  const kop = useRef<HTMLHeadingElement>(null)
  const t = useTekst(DEMO_AANVRAAG)
  useEffect(() => kop.current?.focus(), [])
  return (
    <section className="aan-klaar ayg-kaart dem-bedankt" aria-live="polite">
      <CheckCircle2 size={36} strokeWidth={1.8} aria-hidden="true" className="aan-klaar-icoon" />
      <h2 ref={kop} tabIndex={-1}>
        {t.bedankt(naam)}
      </h2>
      <p className="ayg-lead">{t.bedanktTekst}</p>
      <p className="ayg-klein">{t.tussentijd}</p>
      <div className="ayg-knoppen">
        <Link href={SITE_PADEN.DEMO} className="ayg-knop ayg-knop--accent">
          {t.bekijkDemo}
        </Link>
        <Link href={aygPad()} className="ayg-knop ayg-knop--rand">
          {t.terug}
        </Link>
      </div>
    </section>
  )
}
