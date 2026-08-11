'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, Moon, ChevronRight } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'

// Zichtbare vooruitgang op de home: een echte grafiek (sparkline) + weektrend. Nu
// voor slaap (de data ligt er); later uit te breiden met gewicht/stemming. Eerlijk:
// te weinig data → het blok verschijnt gewoon niet.

interface Punt { datum: string; waarde: number }

function leesSlaap(ruw: unknown): Punt[] {
  if (typeof ruw !== 'object' || ruw === null) return []
  const logs = (ruw as { logs?: unknown }).logs
  if (!Array.isArray(logs)) return []
  return logs
    .map((l) => (typeof l === 'object' && l !== null ? l as Record<string, unknown> : null))
    .filter((l): l is Record<string, unknown> => l !== null)
    .filter((l) => typeof l.datum === 'string' && typeof l.uren_slaap === 'number')
    .map((l) => ({ datum: l.datum as string, waarde: l.uren_slaap as number }))
    .sort((a, b) => a.datum.localeCompare(b.datum)) // chronologisch
}

function gem(reeks: readonly number[]): number | null {
  if (reeks.length === 0) return null
  return Math.round((reeks.reduce((a, b) => a + b, 0) / reeks.length) * 10) / 10
}

export function TrendsBlok() {
  const [punten, setPunten] = useState<Punt[] | null>(null)

  const laad = useCallback((): Promise<void> => {
    return authFetch('/api/slaap?limit=14')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setPunten(leesSlaap(json)))
      .catch(() => setPunten([]))
  }, [])

  useEffect(() => { void laad() }, [laad])

  if (punten === null || punten.length < 3) return null

  const laatste = punten.slice(-10)
  const dezeWeek = punten.slice(-7).map((p) => p.waarde)
  const vorigeWeek = punten.slice(-14, -7).map((p) => p.waarde)
  const gemDeze = gem(dezeWeek)
  const gemVorige = gem(vorigeWeek)
  const delta = gemDeze !== null && gemVorige !== null && gemVorige > 0 ? Math.round(((gemDeze - gemVorige) / gemVorige) * 100) : null
  const richting: 'op' | 'neer' | 'stabiel' = delta === null || Math.abs(delta) < 3 ? 'stabiel' : delta > 0 ? 'op' : 'neer'

  return (
    <section aria-label="Trends" style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Trends</h2>
      <Link href="/slaap" aria-label="Slaaptrend bekijken" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-subtle)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Moon size={20} aria-hidden style={{ color: 'var(--text-3)' }} />
        </span>
        <span style={{ flexShrink: 0 }}>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-4)' }}>Slaap · 7 dagen</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)' }}>{gemDeze}u</span>
            <TrendPil richting={richting} delta={delta} />
          </span>
        </span>
        <Sparkline punten={laatste.map((p) => p.waarde)} />
        <ChevronRight size={18} aria-hidden style={{ color: 'var(--text-4)', flexShrink: 0 }} />
      </Link>
    </section>
  )
}

function TrendPil({ richting, delta }: { richting: 'op' | 'neer' | 'stabiel'; delta: number | null }) {
  const kleur = richting === 'op' ? 'var(--mf-green)' : richting === 'neer' ? 'var(--mf-red)' : 'var(--text-4)'
  const Icon = richting === 'op' ? TrendingUp : richting === 'neer' ? TrendingDown : Minus
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: kleur }}>
      <Icon size={14} aria-hidden /> {delta !== null && richting !== 'stabiel' ? `${delta > 0 ? '+' : ''}${delta}%` : 'stabiel'}
    </span>
  )
}

/** Een sparkline: schaalt de reeks in een vaste box, tekent een vloeiende lijn. */
function Sparkline({ punten }: { punten: readonly number[] }) {
  const b = 100, h = 34
  if (punten.length < 2) return <span style={{ flex: 1 }} />
  const min = Math.min(...punten)
  const max = Math.max(...punten)
  const span = max - min || 1
  const stap = b / (punten.length - 1)
  const d = punten.map((w, i) => `${i === 0 ? 'M' : 'L'} ${(i * stap).toFixed(1)} ${(h - 2 - ((w - min) / span) * (h - 4)).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${b} ${h}`} preserveAspectRatio="none" role="img" aria-label="Slaaptrend van de afgelopen nachten" style={{ flex: 1, minWidth: 0, height: h }}>
      <path d={d} fill="none" stroke="var(--mentaforce-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
