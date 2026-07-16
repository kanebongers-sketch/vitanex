'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Taak, Top3Positie } from '@/lib/lifeos/taken/taken'

// Eén regel van de top-3. Presentationeel: hij weet niets van fetchen, alleen
// dat er op 'm getikt kan worden.

interface Top3RijProps {
  positie: Top3Positie
  taak: Taak | null
  onVink: (taak: Taak) => void
}

export function Top3Rij({ positie, taak, onVink }: Top3RijProps) {
  const [hover, setHover] = useState(false)

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderTop: positie === 1 ? 'none' : '1px solid var(--line)',
      }}
    >
      <span
        className="os-cijfer"
        aria-hidden="true"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: taak ? 'var(--text-4)' : 'rgba(255,255,255,0.28)',
          width: 12,
          flexShrink: 0,
        }}
      >
        {positie}
      </span>

      {taak ? (
        <>
          <button
            type="button"
            role="checkbox"
            aria-checked={taak.klaar}
            aria-label={`${taak.titel} — ${taak.klaar ? 'afgevinkt' : 'afvinken'}`}
            onClick={() => onVink(taak)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              flexShrink: 0,
              padding: 0,
              borderRadius: 6,
              border: `1px solid ${taak.klaar || hover ? 'var(--brand)' : 'var(--line-strong)'}`,
              background: taak.klaar ? 'var(--brand-soft)' : 'transparent',
              cursor: 'pointer',
              transition: 'border-color 180ms var(--ease), background 180ms var(--ease)',
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
          <span
            style={{
              fontSize: 14,
              lineHeight: 1.4,
              color: taak.klaar ? 'var(--text-4)' : 'var(--text-1)',
              textDecoration: taak.klaar ? 'line-through' : 'none',
              transition: 'color 180ms var(--ease)',
            }}
          >
            {taak.titel}
          </span>
        </>
      ) : (
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.28)' }}>Nog leeg</span>
      )}
    </li>
  )
}
