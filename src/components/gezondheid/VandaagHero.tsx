'use client'

/**
 * Vandaag-hero: activiteitsring met stappendoel, kerngetallen van vandaag
 * en de synchronisatiestatus — het eerste wat je ziet op Gezondheid.
 */
import { useState } from 'react'
import { METRICS, datumLang, type TrendPunt } from '@/lib/gezondheid-metrics'
import { BRON_LABELS, type HealthBron } from '@/lib/health-data'
import type { LaatsteSyncInfo } from '@/lib/health-sync'

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

  const subStats = [
    { label: 'Verbranding', waarde: punt.calorieen ? `${METRICS.calorieen.formatWaarde(punt.calorieen)}` : '—', eenheid: 'kcal', kleur: '#E8590C' },
    { label: 'Slaap', waarde: punt.slaap ? METRICS.slaap.formatWaarde(punt.slaap) : '—', eenheid: '', kleur: '#8B5CF6' },
    { label: 'Hartslag', waarde: punt.hartslag ? String(Math.round(punt.hartslag)) : '—', eenheid: 'bpm', kleur: '#E24B4A' },
  ]

  return (
    <section
      aria-label="Vandaag"
      style={{
        background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 55%, #2BB385 100%)',
        borderRadius: 'var(--radius-xl)', padding: '20px 20px 14px',
        boxShadow: '0 8px 28px rgba(15, 110, 86, 0.28), 0 2px 8px rgba(0,0,0,0.06)',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Subtiele textuur */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
        background: 'radial-gradient(circle at 85% 15%, white 0%, transparent 45%)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
        {/* Activiteitsring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
            <circle cx="52" cy="52" r="42" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="9" />
            <circle
              cx="52" cy="52" r="42" fill="none" stroke="white" strokeWidth="9"
              strokeDasharray={`${voortgang * omtrek} ${omtrek}`}
              strokeLinecap="round" transform="rotate(-90 52 52)"
              style={{ transition: 'stroke-dasharray 1.4s var(--ease)' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {stappen.toLocaleString('nl-BE')}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.85, marginTop: 3 }}>
              van {STAPPEN_DOEL.toLocaleString('nl-BE')}
            </span>
          </div>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', opacity: 0.85, margin: '0 0 2px' }}>
            {datumLang(punt.datum)}
          </p>
          <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            {voortgang >= 1 ? 'Stappendoel gehaald! 🎉'
              : voortgang >= 0.6 ? 'Lekker op weg naar je doel'
              : stappen > 0 ? 'Nog ruimte om te bewegen'
              : 'Nog geen beweging gemeten'}
          </p>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {subStats.map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.75, margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                  {s.waarde}
                  {s.eenheid && s.waarde !== '—' && <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75, marginLeft: 3 }}>{s.eenheid}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sync-status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.18)',
        position: 'relative',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, margin: 0 }}>
          {syncInfo
            ? `${BRON_LABELS[syncInfo.bron as HealthBron] ?? syncInfo.bron} · gesynchroniseerd ${new Date(syncInfo.tijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}`
            : 'Nog niet gesynchroniseerd'}
        </p>
        <button
          onClick={onSync}
          disabled={syncBezig}
          aria-label="Nu synchroniseren"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', borderRadius: 999, padding: '5px 12px',
            fontSize: 11.5, fontWeight: 700, cursor: syncBezig ? 'wait' : 'pointer',
          }}
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={syncBezig ? { animation: 'gz-draai 0.9s linear infinite' } : undefined}
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
          {syncBezig ? 'Bezig…' : 'Sync nu'}
        </button>
      </div>
    </section>
  )
}
