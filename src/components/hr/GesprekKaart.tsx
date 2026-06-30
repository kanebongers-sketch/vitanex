'use client'

import { useState } from 'react'
import { User, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { type Gesprek, StatusBadge } from './GesprekModal'

type Props = {
  gesprek: Gesprek & { id: string; medewerker_naam?: string }
  onClick?: () => void
}

const TYPE_LABELS: Record<string, { label: string; variant: 'accent' | 'success' | 'neutral' }> = {
  functionering: { label: 'Functionering', variant: 'accent' },
  beoordeling:   { label: 'Beoordeling',   variant: 'accent' },
  welzijn:       { label: 'Welzijn',       variant: 'success' },
  overig:        { label: 'Overig',        variant: 'neutral' },
}

function formatDatum(d: string) {
  return new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GesprekKaart({ gesprek, onClick }: Props) {
  const typeInfo = TYPE_LABELS[gesprek.type] ?? TYPE_LABELS.overig
  const gedaanCount = gesprek.actiepunten.filter(a => a.gedaan).length
  const totaalCount = gesprek.actiepunten.length
  // Tijdstip per mount vastzetten zodat de render puur blijft
  const [nu] = useState(() => Date.now())
  const isAankomend = gesprek.status === 'gepland' && new Date(gesprek.datum) >= new Date(new Date(nu).toDateString())
  const isDringend = isAankomend && new Date(gesprek.datum) <= new Date(nu + 3 * 24 * 60 * 60 * 1000)

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      style={{
        border: `1px solid ${isDringend ? 'var(--mf-amber)' : 'var(--border)'}`,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Bovenste rij: type badge + status + datum */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
          {isDringend && <Badge variant="warning">Binnenkort</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={gesprek.status} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDatum(gesprek.datum)}</span>
        </div>
      </div>

      {/* Onderwerp + medewerker */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{gesprek.onderwerp}</p>
        {gesprek.medewerker_naam && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <User size={13} aria-hidden /> {gesprek.medewerker_naam}
          </p>
        )}
      </div>

      {/* Onderste rij: actiepunten + follow-up */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {totaalCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 80, height: 4, borderRadius: 2, background: 'var(--bg-subtle)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2, background: 'var(--mentaforce-primary)',
                width: `${(gedaanCount / totaalCount) * 100}%`,
              }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{gedaanCount}/{totaalCount} actiepunten</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Geen actiepunten</span>
        )}

        {gesprek.followup_datum && (
          <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} aria-hidden />
            Follow-up: {formatDatum(gesprek.followup_datum)}
          </span>
        )}
      </div>
    </Card>
  )
}
