'use client'

import { useEffect, useId, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Dialoog } from '@/components/lifeos/crm/Dialoog'
import { SnelInvoer } from './SnelInvoer'

// Een taak toevoegen vanaf élke LifeOS-pagina: de ronde +-knop rechtsonder, of de
// sneltoets "n" (niet terwijl je in een veld typt). Eén regel, Enter, klaar — je
// hoeft niet eerst naar het dashboard. Draagt zijn eigen `.lifeos-root` voor de
// tokens, want hij hangt ook in de layout buiten de pagina-inhoud.

function typtInVeld(doel: EventTarget | null): boolean {
  if (!(doel instanceof HTMLElement)) return false
  return doel.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(doel.tagName)
}

export function SnelTaakKnop() {
  const labelId = useId()
  const [open, setOpen] = useState(false)
  const [laatste, setLaatste] = useState<string | null>(null)

  useEffect(() => {
    function opToets(e: KeyboardEvent) {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey || typtInVeld(e.target)) return
      e.preventDefault()
      setLaatste(null)
      setOpen(true)
    }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [])

  return (
    <div className="lifeos-root" style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 55, minHeight: 0, background: 'transparent' }}>
      <button
        type="button"
        onClick={() => {
          setLaatste(null)
          setOpen(true)
        }}
        aria-label="Snel een taak toevoegen (sneltoets n)"
        title="Taak toevoegen (n)"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52,
          borderRadius: 999, border: '1px solid var(--brand)', background: 'var(--bg-card)', color: 'var(--brand)',
          boxShadow: '0 0 0 4px var(--brand-soft)', cursor: 'pointer',
        }}
      >
        <Plus size={24} strokeWidth={2.4} aria-hidden />
      </button>
      {open ? (
        <Dialoog labelId={labelId} onSluit={() => setOpen(false)}>
          <div style={{ display: 'grid', gap: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 id={labelId} style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--text-1)' }}>
                Nieuwe taak
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Sluiten" style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
                <X size={18} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
            <SnelInvoer autoFocus onToegevoegd={(titel) => setLaatste(titel)} />
            {laatste ? (
              <p role="status" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--brand)' }}>
                <Check size={14} strokeWidth={2.4} aria-hidden /> “{laatste}” staat erin. Typ gerust de volgende.
              </p>
            ) : null}
          </div>
        </Dialoog>
      ) : null}
    </div>
  )
}
