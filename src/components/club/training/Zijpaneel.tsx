'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

interface ZijpaneelProps {
  titel: string
  boventitel?: string
  onSluit: () => void
  children: ReactNode
  breed?: boolean
}

/** Een zijpaneel rechts (club-paneel). Escape of klik ernaast sluit; focus gaat naar het paneel. */
export function Zijpaneel({ titel, boventitel, onSluit, children, breed }: ZijpaneelProps) {
  const paneel = useRef<HTMLElement>(null)
  const t = useTekst(CLUB_TRAINING).zijpaneel

  useEffect(() => {
    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    paneel.current?.focus()
    function toets(e: KeyboardEvent) {
      if (e.key === 'Escape') onSluit()
    }
    window.addEventListener('keydown', toets)
    return () => {
      window.removeEventListener('keydown', toets)
      vorige?.focus()
    }
  }, [onSluit])

  return (
    <div className="club-paneel-scherm" onMouseDown={(e) => e.target === e.currentTarget && onSluit()}>
      <aside
        ref={paneel}
        className={`club-paneel ${breed ? 'club-training-paneel--breed' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titel}
        tabIndex={-1}
      >
        <header className="club-training-paneelkop">
          <div>
            {boventitel && <p className="club-boventitel">{boventitel}</p>}
            <h2>{titel}</h2>
          </div>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={onSluit} aria-label={t.sluiten}>
            <X aria-hidden size={18} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  )
}
