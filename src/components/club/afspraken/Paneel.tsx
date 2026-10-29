'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'

// Zijpaneel: Escape of de achtergrond sluit het, de focus gaat erin bij openen
// en terug naar waar je was bij sluiten.

interface Props {
  label: string
  onSluit: () => void
  children: ReactNode
}

export function Paneel({ label, onSluit, children }: Props) {
  const paneel = useRef<HTMLElement>(null)
  const sluit = useRef(onSluit)
  const t = useTekst(AFSPRAKEN).paneel

  useEffect(() => {
    sluit.current = onSluit
  }, [onSluit])

  useEffect(() => {
    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    paneel.current?.focus()
    function toets(e: KeyboardEvent) {
      if (e.key === 'Escape') sluit.current()
    }
    document.addEventListener('keydown', toets)
    return () => {
      document.removeEventListener('keydown', toets)
      vorige?.focus()
    }
  }, [])

  return (
    <div className="club-paneel-scherm" onMouseDown={(e) => e.target === e.currentTarget && onSluit()}>
      <aside ref={paneel} className="club-paneel club-afspraken-paneel" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <button type="button" className="club-knop club-knop--stil club-knop--klein club-afspraken-sluit" onClick={onSluit} aria-label={t.sluiten}>
          <X size={18} aria-hidden />
        </button>
        {children}
      </aside>
    </div>
  )
}
