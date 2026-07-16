'use client'

import { Check, CloudUpload } from 'lucide-react'
import { opslagLabel, type OpslagStatus } from '@/lib/lifeos/journal/journal'

// De opslag-indicator. Puur presentational: de tekst komt uit `opslagLabel`
// (getest), dit component kiest alleen het icoon en de kleur.
//
// `mislukt` komt hier NIET langs — dat rendert als een echte `Foutmelding` met
// een weg terug, niet als een grijs regeltje dat je over het hoofd ziet. Een
// journal die stil niet opslaat is erger dan geen journal.

interface OpslagIndicatorProps {
  status: OpslagStatus
}

export function OpslagIndicator({ status }: OpslagIndicatorProps) {
  const label = opslagLabel(status)
  if (label === null) return null

  const opgeslagen = status.fase === 'opgeslagen'

  return (
    // role=status + aria-live=polite: een screenreader hoort "Opgeslagen" één
    // keer, zonder dat de focus uit het tekstveld wordt getrokken (WCAG 4.1.3).
    <p
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        margin: 0,
        fontSize: 12,
        lineHeight: 1.4,
        color: opgeslagen ? 'var(--text-3)' : 'var(--text-4)',
        transition: 'color 180ms var(--ease)',
      }}
    >
      {opgeslagen ? (
        <Check size={12} strokeWidth={2.6} aria-hidden="true" style={{ color: 'var(--status-goed)' }} />
      ) : (
        <CloudUpload size={12} strokeWidth={2.2} aria-hidden="true" />
      )}
      {label}
    </p>
  )
}
