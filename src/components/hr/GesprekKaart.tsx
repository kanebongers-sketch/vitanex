'use client'

import { useState } from 'react'
import { User, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { type Gesprek, StatusBadge } from './GesprekModal'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

type Props = {
  gesprek: Gesprek & { id: string; medewerker_naam?: string }
  onClick?: () => void
}

const TYPE_LABELS: Record<string, { label: string; variant: 'accent' | 'success' | 'neutral' }> = {
  functionering: { label: 'functionering', variant: 'accent' },
  beoordeling:   { label: 'beoordeling',   variant: 'accent' },
  welzijn:       { label: 'welzijn',       variant: 'success' },
  overig:        { label: 'overig',        variant: 'neutral' },
}

function formatDatum(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GesprekKaart({ gesprek, onClick }: Props) {
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
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
          <Badge variant={typeInfo.variant}>{t(`werk.gesprekType.${typeInfo.label}`)}</Badge>
          {isDringend && <Badge variant="warning">{t('werk.gesprekKaart.binnenkort')}</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={gesprek.status} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDatum(gesprek.datum, locale)}</span>
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
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('werk.gesprekKaart.actiepuntenTelling', { gedaan: gedaanCount, totaal: totaalCount })}</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{t('werk.gesprekKaart.geenActiepunten')}</span>
        )}

        {gesprek.followup_datum && (
          <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} aria-hidden />
            {t('werk.gesprekKaart.followUp', { datum: formatDatum(gesprek.followup_datum, locale) })}
          </span>
        )}
      </div>
    </Card>
  )
}
