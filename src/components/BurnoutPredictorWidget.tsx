'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/auth-fetch'

interface PredictorScore {
  risico_score: number
  trending: 'stijgend' | 'dalend' | 'stabiel'
  dominante_factor: string
  week_start: string
}

const FACTOR_LABELS: Record<string, string> = {
  slaap: 'Slaap', stress: 'Stress', energie: 'Energie',
  focus: 'Focus', balans: 'Balans', motivatie: 'Motivatie',
}

const TREND_CONFIG = {
  stijgend: { label: '↑ Stijgend', kleur: '#EF4444' },
  dalend: { label: '↓ Dalend', kleur: '#1D9E75' },
  stabiel: { label: '→ Stabiel', kleur: '#9CA3AF' },
}

export default function BurnoutPredictorWidget() {
  const [score, setScore] = useState<PredictorScore | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      try {
        const res = await authFetch('/api/burnout-predictor')
        if (res.ok) {
          const json = await res.json() as { scores: PredictorScore[] }
          if (json.scores?.length) setScore(json.scores[0])
        }
      } catch { /* niet-kritiek */ }
      setLaden(false)
    }
    laad()
  }, [])

  if (laden) return (
    <div style={{ height: 80, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mf-spinner" style={{ width: 20, height: 20 }} />
    </div>
  )

  if (!score) return null

  const pct = Math.round(score.risico_score)
  const risicoKleur = pct >= 70 ? '#EF4444' : pct >= 45 ? '#F59E0B' : '#1D9E75'
  const risicoLabel = pct >= 70 ? 'Hoog risico' : pct >= 45 ? 'Matig risico' : 'Laag risico'
  const trend = TREND_CONFIG[score.trending] ?? TREND_CONFIG.stabiel

  return (
    <Link href="/burnout" style={{ textDecoration: 'none', display: 'block' }}>
      <article style={{
        background: 'white', borderRadius: 14, padding: '14px 16px',
        border: `1.5px solid ${risicoKleur}20`,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 2 }}>
              Burn-out predictor
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: risicoKleur }}>{risicoLabel}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: risicoKleur, lineHeight: 1 }}>{pct}</p>
            <p style={{ fontSize: 9, color: '#9CA3AF' }}>/100 risico</p>
          </div>
        </div>

        {/* Risicobalk */}
        <div style={{ height: 6, borderRadius: 9999, background: '#F3F4F6', marginBottom: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 9999, width: `${pct}%`,
            background: `linear-gradient(90deg, ${risicoKleur}80, ${risicoKleur})`,
            transition: 'width 0.8s ease',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#9CA3AF' }}>
            Aandachtspunt: {FACTOR_LABELS[score.dominante_factor] ?? score.dominante_factor}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: trend.kleur }}>
            {trend.label}
          </span>
        </div>
      </article>
    </Link>
  )
}
