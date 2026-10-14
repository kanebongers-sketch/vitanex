'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { AppOefening } from '@/lib/club/app/schema'
import { voorschrift } from '@/lib/club/app/schema'
import { BeeldBron, OefeningBeeld } from '@/components/club/training/OefeningBeeld'

// Een oefening groot in de app: de bewegende tekening, het voorschrift, hoe je
// hem doet en waar je op let. Schuift als een blad over het schema; Escape of
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
        <OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="groot" />
        {regel && <p className="club-lidapp-blad-regel">{regel}</p>}
        {o.notitie && <p className="club-lidapp-blad-notitie">Van je trainer: {o.notitie}</p>}
        <section>
          <h4>Zo doe je het</h4>
          <p>{o.uitleg ?? 'Je trainer legt deze oefening aan je uit.'}</p>
        </section>
        {o.aandachtspunten && (
          <section>
            <h4>Let op</h4>
            <p>{o.aandachtspunten}</p>
          </section>
        )}
        {o.beeld && <BeeldBron />}
      </div>
    </div>
  )
}
