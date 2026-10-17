'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { AppOefening } from '@/lib/club/app/schema'
import { voorschrift } from '@/lib/club/app/schema'
import { BeeldBron } from '@/components/club/training/OefeningBeeld'
import { OefeningSpeler } from '@/components/club/training/coaching/OefeningSpeler'
import { OefeningCoaching } from '@/components/club/training/coaching/OefeningCoaching'
import { SpierBlok } from '@/components/club/training/SpierChips'

// Een oefening groot in de app: de bewegende illustratie, het voorschrift, de
// coaching (kernpunten, stappen, fouten) en welke spieren je traint. Schuift als een blad over het schema; Escape of
// de sluitknop gaat terug, de focus springt terug naar de oefening.

interface OefeningBladProps {
  oefening: AppOefening
  onSluit: () => void
}

export function OefeningBlad({ oefening: o, onSluit }: OefeningBladProps) {
  const blad = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    blad.current?.focus()
    function toets(e: KeyboardEvent) {
      if (e.key === 'Escape') onSluit()
    }
    window.addEventListener('keydown', toets)
    return () => {
      window.removeEventListener('keydown', toets)
      vorige?.focus()
    }
  }, [onSluit])

  const regel = voorschrift(o)
  return (
    <div className="club-lidapp-blad-scherm" onMouseDown={(e) => e.target === e.currentTarget && onSluit()}>
      <div ref={blad} className="club-lidapp-blad" role="dialog" aria-modal="true" aria-label={o.naam} tabIndex={-1}>
        <div className="club-lidapp-blad-kop">
          <h3>{o.naam}</h3>
          <button type="button" className="club-lidapp-blad-sluit" onClick={onSluit} aria-label="Sluiten">
            <X aria-hidden size={20} />
          </button>
        </div>
        <OefeningSpeler key={o.id} naam={o.naam} beeld={o.beeld} />
        {regel && <p className="club-lidapp-blad-regel">{regel}</p>}
        {o.notitie && <p className="club-lidapp-blad-notitie">Van je trainer: {o.notitie}</p>}
        <OefeningCoaching naam={o.naam} uitleg={o.uitleg} aandachtspunten={o.aandachtspunten} kop="h4" leeg="Je trainer legt deze oefening aan je uit." />
        {o.spierenPrimair.length > 0 && (
          <section>
            <h4>Deze spieren train je</h4>
            <SpierBlok naam={o.naam} primair={o.spierenPrimair} secundair={o.spierenSecundair} />
          </section>
        )}
        {o.beeld && <BeeldBron bronnen={[o.beeld.bron]} />}
      </div>
    </div>
  )
}
