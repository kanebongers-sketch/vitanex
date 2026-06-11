'use client'

import { type Gesprek, StatusBadge } from './GesprekModal'

type Props = {
  gesprek: Gesprek & { id: string; medewerker_naam?: string }
  onClick?: () => void
}

const TYPE_LABELS: Record<string, { label: string; kleur: string; bg: string }> = {
  functionering: { label: 'Functionering', kleur: '#1D4ED8', bg: '#EFF6FF' },
  beoordeling:   { label: 'Beoordeling',   kleur: '#7C3AED', bg: '#EDE9FE' },
  welzijn:       { label: 'Welzijn',       kleur: '#0F6E56', bg: '#E1F5EE' },
  overig:        { label: 'Overig',        kleur: '#6B7280', bg: '#F3F4F6' },
}

function formatDatum(d: string) {
  return new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GesprekKaart({ gesprek, onClick }: Props) {
  const typeInfo = TYPE_LABELS[gesprek.type] ?? TYPE_LABELS.overig
  const gedaanCount = gesprek.actiepunten.filter(a => a.gedaan).length
  const totaalCount = gesprek.actiepunten.length
  const isAankomend = gesprek.status === 'gepland' && new Date(gesprek.datum) >= new Date(new Date().toDateString())
  const isDringend = isAankomend && new Date(gesprek.datum) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 12,
        border: `1.5px solid ${isDringend ? '#FDE68A' : '#E5E7EB'}`,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isDringend
          ? '0 2px 8px rgba(251,191,36,0.15)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.1s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = isDringend ? '0 2px 8px rgba(251,191,36,0.15)' : '0 1px 4px rgba(0,0,0,0.05)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Bovenste rij: type badge + status + datum */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: typeInfo.bg, color: typeInfo.kleur,
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
          }}>{typeInfo.label}</span>
          {isDringend && (
            <span style={{
              background: '#FEF3C7', color: '#92400E',
              borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 600,
            }}>Binnenkort</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={gesprek.status} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDatum(gesprek.datum)}</span>
        </div>
      </div>

      {/* Onderwerp + medewerker */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>{gesprek.onderwerp}</p>
        {gesprek.medewerker_naam && (
          <p style={{ fontSize: 12, color: '#6B7280' }}>
            <span style={{ fontSize: 13 }}>👤</span> {gesprek.medewerker_naam}
          </p>
        )}
      </div>

      {/* Onderste rij: actiepunten + follow-up */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {totaalCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 80, height: 4, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2, background: '#1D9E75',
                width: `${(gedaanCount / totaalCount) * 100}%`,
                transition: 'width 0.3s',
              }} />
            </div>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{gedaanCount}/{totaalCount} actiepunten</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: '#D1D5DB' }}>Geen actiepunten</span>
        )}

        {gesprek.followup_datum && (
          <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Follow-up: {formatDatum(gesprek.followup_datum)}
          </span>
        )}
      </div>
    </div>
  )
}
