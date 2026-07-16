'use client'

import { useState, type CSSProperties } from 'react'
import { Check, Trash2 } from 'lucide-react'
import type { Taak, Top3Positie } from '@/lib/lifeos/taken/taken'

// Eén regel van de volledige takenlijst. Presentationeel: kent geen fetch, alleen
// dat er afgevinkt en verwijderd kan worden. De verwijderknop is rustig — hij
// verschijnt bij hover of focus, niet permanent, zodat de lijst niet schreeuwt.
//
// Verwant aan Top3Rij maar niet hetzelfde: die heeft een vaste plek (1/2/3) en
// kan leeg zijn; deze bestaat alleen als er een taak ís en kan wég.

interface TaakRijProps {
  taak: Taak
  onVink: (taak: Taak) => void
  onVerwijder: (taak: Taak) => void
  /** Toont het top-3-nummer als de taak vandaag een plek in de top-3 heeft. */
  positie?: Top3Positie | null
}

export function TaakRij({ taak, onVink, onVerwijder, positie = null }: TaakRijProps) {
  const [hover, setHover] = useState(false)
  const [vinkHover, setVinkHover] = useState(false)
  const [wisFocus, setWisFocus] = useState(false)

  const rand = taak.klaar || vinkHover ? 'var(--brand)' : 'var(--line-strong)'

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderTop: '1px solid var(--line)',
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={taak.klaar}
        aria-label={`${taak.titel} — ${taak.klaar ? 'afgevinkt' : 'afvinken'}`}
        onClick={() => onVink(taak)}
        onMouseEnter={() => setVinkHover(true)}
        onMouseLeave={() => setVinkHover(false)}
        style={{ ...VINK, borderColor: rand, background: taak.klaar ? 'var(--brand-soft)' : 'transparent' }}
      >
        <Check
          size={13}
          strokeWidth={3}
          aria-hidden="true"
          style={{
            color: 'var(--brand)',
            opacity: taak.klaar ? 1 : vinkHover ? 0.4 : 0,
            transition: 'opacity 150ms var(--ease)',
          }}
        />
      </button>

      {positie ? (
        <span
          className="os-cijfer"
          aria-label={`top-3, plek ${positie}`}
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)', width: 10, flexShrink: 0 }}
        >
          {positie}
        </span>
      ) : null}

      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          lineHeight: 1.4,
          color: taak.klaar ? 'var(--text-4)' : 'var(--text-1)',
          textDecoration: taak.klaar ? 'line-through' : 'none',
          overflowWrap: 'anywhere',
          transition: 'color 180ms var(--ease)',
        }}
      >
        {taak.titel}
      </span>

      <button
        type="button"
        aria-label={`${taak.titel} verwijderen`}
        onClick={() => onVerwijder(taak)}
        onFocus={() => setWisFocus(true)}
        onBlur={() => setWisFocus(false)}
        style={{ ...WIS, opacity: hover || wisFocus ? 1 : 0 }}
      >
        <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </li>
  )
}

const VINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  flexShrink: 0,
  padding: 0,
  borderRadius: 6,
  border: '1px solid var(--line-strong)',
  cursor: 'pointer',
  transition: 'border-color 180ms var(--ease), background 180ms var(--ease)',
}

const WIS: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  flexShrink: 0,
  padding: 0,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-4)',
  cursor: 'pointer',
  transition: 'opacity 150ms var(--ease), color 150ms var(--ease)',
}
