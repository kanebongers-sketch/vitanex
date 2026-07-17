'use client'

import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'

// Een kleine, toegankelijke dialog in LifeOS-stijl (er is geen os/-primitive).
//   • role="dialog" + aria-modal + aria-labelledby
//   • focus gaat bij openen naar de dialog en keert bij sluiten terug naar het
//     element dat 'm opende (de tegel)
//   • Escape sluit, klik op de backdrop sluit
//   • focus blijft binnen (Tab-cyclus)
//
// Geen portal: de dialog rendert ín de `.lifeos-root`-boom, zodat de navy/cyan-
// tokens blijven resolven. `position: fixed` legt 'm alsnog over het hele scherm.

const FOCUSBAAR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialoogProps {
  /** Id van de kop die de dialog benoemt (aria-labelledby). */
  labelId: string
  onSluit: () => void
  children: ReactNode
}

export function Dialoog({ labelId, onSluit, children }: DialoogProps) {
  const paneelRef = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Onthoud wie de dialog opende, zet focus in de dialog, en geef 'm bij sluiten
    // terug. `instanceof HTMLElement` want `activeElement` kan `null` zijn.
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const eerste = paneelRef.current?.querySelector<HTMLElement>(FOCUSBAAR)
    ;(eerste ?? paneelRef.current)?.focus()

    return () => {
      opener.current?.focus()
    }
  }, [])

  function opKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onSluit()
      return
    }
    if (e.key !== 'Tab') return

    const paneel = paneelRef.current
    if (!paneel) return
    const knopen = Array.from(paneel.querySelectorAll<HTMLElement>(FOCUSBAAR))
    if (knopen.length === 0) {
      e.preventDefault()
      paneel.focus()
      return
    }

    const eerste = knopen[0]
    const laatste = knopen[knopen.length - 1]
    const actief = document.activeElement
    if (e.shiftKey && (actief === eerste || actief === paneel)) {
      e.preventDefault()
      laatste.focus()
    } else if (!e.shiftKey && actief === laatste) {
      e.preventDefault()
      eerste.focus()
    }
  }

  // Backdrop-klik alleen als de druk ÉN op de backdrop begint: zo sluit een
  // tekstselectie die per ongeluk buiten het paneel eindigt de dialog niet.
  function opBackdrop(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onSluit()
  }

  return (
    <div className="os-crm__overlay" onMouseDown={opBackdrop}>
      <div
        ref={paneelRef}
        className="os-crm__dialoog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        onKeyDown={opKeyDown}
      >
        {children}
      </div>
    </div>
  )
}
