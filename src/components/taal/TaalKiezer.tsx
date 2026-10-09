'use client'

// Taal kiezen: elke taal in haar eigen schrift ("Español", "العربية"), zodat je
// je taal ook herkent als de app nog in een taal staat die je niet leest.

import { useId } from 'react'
import { Languages } from 'lucide-react'
import { TALEN, isTaal } from '@/lib/i18n/talen'
import { kiesTaal, useVertaling } from '@/lib/i18n/TaalProvider'

interface TaalKiezerProps {
  /** Compact: alleen icoon + keuzelijst, voor in de navigatie. */
  compact?: boolean
}

export function TaalKiezer({ compact = false }: TaalKiezerProps) {
  const { taal, t } = useVertaling()
  const id = useId()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Languages size={compact ? 15 : 18} aria-hidden style={{ color: 'var(--text-3)', flex: 'none' }} />
      <label htmlFor={id} className={compact ? 'sr-only' : undefined} style={compact ? undefined : { fontSize: 14, color: 'var(--text-2)' }}>
        {t('taal.label')}
      </label>
      <select
        id={id}
        value={taal}
        onChange={(e) => { if (isTaal(e.target.value)) kiesTaal(e.target.value) }}
        style={{
          minHeight: compact ? 32 : 40,
          padding: '0 10px',
          borderRadius: 8,
          fontSize: compact ? 13 : 14,
          fontFamily: 'inherit',
          color: 'var(--text-1)',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-strong)',
          colorScheme: 'dark',
          cursor: 'pointer',
        }}
      >
        {TALEN.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>{l.naam}</option>
        ))}
      </select>
    </div>
  )
}
