'use client'

/**
 * Vandaag-hero: activiteitsring met stappendoel, kerngetallen van vandaag
 * en de synchronisatiestatus — het eerste wat je ziet op Gezondheid.
 */
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { METRICS, datumLang, type TrendPunt } from '@/lib/health/gezondheid-metrics'
import { BRON_LABELS, type HealthBron } from '@/lib/health/health-data'
import type { LaatsteSyncInfo } from '@/lib/health/health-sync'

export const STAPPEN_DOEL = 10_000

interface VandaagHeroProps {
  trend: TrendPunt[]
  syncInfo: LaatsteSyncInfo | null
  syncBezig: boolean
  onSync: () => void
}

export default function VandaagHero({ trend, syncInfo, syncBezig, onSync }: VandaagHeroProps) {
  const [vandaag] = useState(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date()))

  // Toon vandaag, of anders de meest recente dag met data
  const punt = trend.find(p => p.datum === vandaag) ?? trend[trend.length - 1]
  if (!punt) return null

  const stappen = punt.stappen ?? 0
  const voortgang = Math.min(1, stappen / STAPPEN_DOEL)
  const omtrek = 2 * Math.PI * 42
  const voortgangPct = Math.round(voortgang * 100)

  const subStats = [
    { label: 'Verbranding', waarde: punt.calorieen ? `${METRICS.calorieen.formatWaarde(punt.calorieen)}` : '—', eenheid: 'kcal' },
    { label: 'Slaap', waarde: punt.slaap ? METRICS.slaap.formatWaarde(punt.slaap) : '—', eenheid: '' },
    { label: 'Hartslag', waarde: punt.hartslag ? String(Math.round(punt.hartslag)) : '—', eenheid: 'bpm' },
  ]

  return (
    <section
      aria-label="Vandaag"
      style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xl)', padding: '20px 20px 14px',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text-1)', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Subtiele cyaan-glow als textuur */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
        background: 'radial-gradient(circle at 85% 10%, color-mix(in srgb, var(--mentaforce-primary) 16%, transparent) 0%, transparent 50%)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
        {/* Activiteitsring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="104" height="104" viewBox="0 0 104 104" role="img" aria-label={`Stappen ${stappen.toLocaleString('nl-BE')} van ${STAPPEN_DOEL.toLocaleString('nl-BE')}, ${voortgangPct} procent van je doel`}>
            <circle cx="52" cy="52" r="42" fill="none" stroke="var(--border-strong)" strokeWidth="9" />
            <circle
              cx="52" cy="52" r="42" fill="none" stroke="var(--mentaforce-primary)" strokeWidth="9"
              strokeDasharray={`${voortgang * omtrek} ${omtrek}`}
              strokeLinecap="round" transform="rotate(-90 52 52)"
              style={{ transition: 'stroke-dasharray 1.4s var(--ease)' }}
            />
          </svg>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              {stappen.toLocaleString('nl-BE')}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--text-3)', marginTop: 3 }}>
              van {STAPPEN_DOEL.toLocaleString('nl-BE')}
            </span>
          </div>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-3)', margin: '0 0 2px' }}>
            {datumLang(punt.datum)}
          </p>
          <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.01em', color: 'var(--text-1)' }}>
            {voortgang >= 1 ? 'Stappendoel gehaald'
              : voortgang >= 0.6 ? 'Lekker op weg naar je doel'
              : stappen > 0 ? 'Nog ruimte om te bewegen'
              : 'Nog geen beweging gemeten'}
          </p>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {subStats.map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1, color: 'var(--text-1)' }}>
                  {s.waarde}
                  {s.eenheid && s.waarde !== '—' && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginLeft: 3 }}>{s.eenheid}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sync-status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)',
        position: 'relative',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', margin: 0, minWidth: 0 }}>
          {syncInfo
            ? `${BRON_LABELS[syncInfo.bron as HealthBron] ?? syncInfo.bron} · gesynchroniseerd ${new Date(syncInfo.tijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}`
            : 'Nog niet gesynchroniseerd'}
        </p>
        <button
          onClick={onSync}
          disabled={syncBezig}
          aria-label="Nu synchroniseren"
          className="mf-pressable"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
            background: 'var(--mf-green-light)', border: '1px solid var(--mentaforce-primary)',
            color: 'var(--mentaforce-primary)', borderRadius: 999, padding: '5px 12px',
            fontSize: 11.5, fontWeight: 700, cursor: syncBezig ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw
            size={12} strokeWidth={2.5} aria-hidden="true"
            style={syncBezig ? { animation: 'gz-draai 0.9s linear infinite' } : undefined}
          />
          {syncBezig ? 'Bezig…' : 'Sync nu'}
        </button>
      </div>
    </section>
  )
}
