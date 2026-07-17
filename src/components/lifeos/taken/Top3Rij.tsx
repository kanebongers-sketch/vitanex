'use client'

import { useState, type CSSProperties } from 'react'
import { Check, X } from 'lucide-react'
import type { Taak, Top3Positie } from '@/lib/lifeos/taken/taken'

// Eén regel van de top-3. Presentationeel: hij weet niets van fetchen, alleen
// dat er op 'm getikt kan worden.
//
// Verwant aan TaakRij maar niet hetzelfde: deze heeft een vaste plek (1/2/3) en
// kan leeg zijn; die bestaat alleen als er een taak ís en kan wég.

interface Top3RijProps {
  positie: Top3Positie
  taak: Taak | null
  onVink: (taak: Taak) => void
  /** Uit de top-3 halen. De plek blijft leeg — nummer 3 schuift niet op. */
  onLosmaken: (taak: Taak) => void
}

export function Top3Rij({ positie, taak, onVink, onLosmaken }: Top3RijProps) {
  const [hover, setHover] = useState(false)
  const [wisFocus, setWisFocus] = useState(false)

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderTop: positie === 1 ? 'none' : '1px solid var(--line)',
      }}
    >
      {/* Kleur uit de inkt-ladder, geen losse rgba. Hier stond
          `rgba(255,255,255,0.28)` — een hardcoded waarde die op navy ±2,9:1
          haalt en dus door WCAG AA zakt. --text-4 is de dimste tint die nog
          leesbaar is; het verschil tussen bezet en leeg loopt via --text-3. */}
      <span
        className="os-cijfer"
        aria-hidden="true"
        style={{ ...CIJFER, color: taak ? 'var(--text-3)' : 'var(--text-4)' }}
      >
        {positie}
      </span>

      {taak ? (
        <>
          <VinkKnop taak={taak} onVink={onVink} />
          <span
            style={{
              ...TITEL,
              color: taak.klaar ? 'var(--text-4)' : 'var(--text-1)',
              textDecoration: taak.klaar ? 'line-through' : 'none',
            }}
          >
            {taak.titel}
          </span>
          <button
            type="button"
            aria-label={`${taak.titel} uit je top-3 halen`}
            title="Uit je top-3 halen"
            onClick={() => onLosmaken(taak)}
            onFocus={() => setWisFocus(true)}
            onBlur={() => setWisFocus(false)}
            style={{ ...LOS, opacity: hover || wisFocus ? 1 : 0 }}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </>
      ) : (
        // Eerlijke lege plek: geen ingeschoven taak, want dan zou positie 3
        // stilletjes positie 1 worden.
        <span style={{ ...TITEL, color: 'var(--text-4)' }}>Nog leeg</span>
      )}
    </li>
  )
}

function VinkKnop({ taak, onVink }: { taak: Taak; onVink: (taak: Taak) => void }) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={taak.klaar}
      aria-label={`${taak.titel} — ${taak.klaar ? 'afgevinkt' : 'afvinken'}`}
      onClick={() => onVink(taak)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...VINK,
        borderColor: taak.klaar || hover ? 'var(--brand)' : 'var(--line-strong)',
        background: taak.klaar ? 'var(--brand-soft)' : 'transparent',
      }}
    >
      <Check
        size={13}
        strokeWidth={3}
        aria-hidden="true"
        style={{
          color: 'var(--brand)',
          opacity: taak.klaar ? 1 : hover ? 0.4 : 0,
          transition: 'opacity 150ms var(--ease)',
        }}
      />
    </button>
  )
}

const CIJFER: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  width: 12,
  flexShrink: 0,
}

const TITEL: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 14,
  lineHeight: 1.4,
  overflowWrap: 'anywhere',
  transition: 'color 180ms var(--ease)',
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

const LOS: CSSProperties = {
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
