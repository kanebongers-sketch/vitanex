'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'

export interface MeerItem {
  sleutel: string
  label: string
  icoon: ReactNode
  onKies: () => void
  /** Uitleg als het (nog) niet kan, bijvoorbeeld "Sla eerst je wijzigingen op". */
  uit?: string
  gevaar?: boolean
}

interface EditorMeerProps {
  items: MeerItem[]
  /** Kleine regel onderaan het menu (sneltoetsen). */
  voet?: ReactNode
}

/** Het menu "Meer" van de werkbalk: minder gebruikte acties uit het zicht. Escape of klik ernaast sluit. */
export function EditorMeer({ items, voet }: EditorMeerProps) {
  const id = useId()
  const t = useTekst(SCHEMA_EDITOR).meer
  const [open, setOpen] = useState(false)
  const kader = useRef<HTMLDivElement>(null)
  const knop = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    kader.current?.querySelector<HTMLButtonElement>('[role="menu"] button:not(:disabled)')?.focus()
    function klik(e: MouseEvent) {
      if (e.target instanceof Node && !kader.current?.contains(e.target)) setOpen(false)
    }
    function toets(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setOpen(false)
      knop.current?.focus()
    }
    document.addEventListener('mousedown', klik)
    document.addEventListener('keydown', toets)
    return () => {
      document.removeEventListener('mousedown', klik)
      document.removeEventListener('keydown', toets)
    }
  }, [open])

  return (
    <div className="club-training-meer" ref={kader}>
      <button
        ref={knop}
        type="button"
        className="club-knop club-knop--stil"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal aria-hidden size={18} /> <span className="club-training-meer-tekst">{t.knop}</span>
      </button>
      {open && (
        <div className="club-training-meer-paneel" id={id}>
          <ul role="menu" aria-label={t.label}>
            {items.map((i) => (
              <li key={i.sleutel} role="none">
                <button
                  type="button"
                  role="menuitem"
                  disabled={Boolean(i.uit)}
                  data-gevaar={i.gevaar || undefined}
                  onClick={() => {
                    setOpen(false)
                    i.onKies()
                  }}
                >
                  {i.icoon}
                  <span>
                    {i.label}
                    {i.uit && <small>{i.uit}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {voet && <p className="club-training-meer-voet">{voet}</p>}
        </div>
      )}
    </div>
  )
}
