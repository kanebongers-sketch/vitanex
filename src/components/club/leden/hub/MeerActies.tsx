'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

// Meer acties in de kop van de ledenkaart: een knop die een klein menu opent
// met de acties die niet de hoofdactie van het tabblad zijn. Sluit met Escape,
// een tik ernaast of na een keuze (een link). De inhoud komt van de server
// (links en de incheckknop); dit component regelt alleen open en dicht.

interface MeerActiesProps {
  label: string
  children: ReactNode
}

export function MeerActies({ label, children }: MeerActiesProps) {
  const [open, setOpen] = useState(false)
  const wortel = useRef<HTMLDivElement>(null)
  const knop = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const buiten = (e: PointerEvent) => {
      if (wortel.current && !wortel.current.contains(e.target as Node)) setOpen(false)
    }
    const toets = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      knop.current?.focus()
    }
    document.addEventListener('pointerdown', buiten)
    document.addEventListener('keydown', toets)
    return () => {
      document.removeEventListener('pointerdown', buiten)
      document.removeEventListener('keydown', toets)
    }
  }, [open])

  return (
    <div className="club-lidhub-meer" ref={wortel} data-open={open || undefined}>
      <button ref={knop} type="button" className="club-knop" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((o) => !o)}>
        {label} <ChevronDown aria-hidden size={16} className="club-lidhub-meer-pijl" />
      </button>
      <div
        id={menuId}
        className="club-lidhub-meer-menu"
        hidden={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setOpen(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}
