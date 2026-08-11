'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, Moon, Scale, Footprints, Smile, ChevronRight, type LucideIcon } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'

// Zichtbare vooruitgang op de home: echte grafieken (sparklines) + weektrend per
// metriek. Nu slaap + gewicht; makkelijk uit te breiden. Eerlijk: te weinig data
// voor een metriek → die rij verschijnt niet; geen enkele metriek → geen blok.

interface Reeks {
  key: string
  label: string
  eenheid: string
  icoon: LucideIcon
  route: string
  waarden: number[] // chronologisch (oud → nieuw)
  meerIsBeter: boolean | null // kleur van de trend; null = neutraal (bv. gewicht)
  decimalen: number
}

function gem(reeks: readonly number[]): number | null {
  if (reeks.length === 0) return null
  return reeks.reduce((a, b) => a + b, 0) / reeks.length
}

/**
 * Leest een reeks chronologisch (oud → nieuw) uit een antwoord. Het datumveld is
 * instelbaar: sommige bronnen dragen `datum` (YYYY-MM-DD), andere `aangemaakt_op`
 * (ISO-timestamp) — beide sorteren correct als string.
 */
function leesReeks(ruw: unknown, lijstSleutel: string, veld: string, datumVeld = 'datum'): number[] {
  const o = typeof ruw === 'object' && ruw !== null ? ruw as Record<string, unknown> : {}
  const lijst = Array.isArray(o[lijstSleutel]) ? (o[lijstSleutel] as unknown[]) : []
  return lijst
    .map((r) => (typeof r === 'object' && r !== null ? r as Record<string, unknown> : null))
    .filter((r): r is Record<string, unknown> => r !== null && typeof r[datumVeld] === 'string' && typeof r[veld] === 'number')
    .sort((a, b) => (a[datumVeld] as string).localeCompare(b[datumVeld] as string))
    .map((r) => r[veld] as number)
}

export function TrendsBlok() {
  const [reeksen, setReeksen] = useState<Reeks[] | null>(null)

  const laad = useCallback((): Promise<void> => {
    const haal = (url: string) => authFetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    return Promise.all([
      haal('/api/slaap?limit=14'),
      haal('/api/lichaamsmetingen?limit=14'),
      haal('/api/stappen?dagen=14'),
      haal('/api/stemming?limit=14'),
    ]).then(([slaapRuw, gewichtRuw, stappenRuw, stemmingRuw]) => {
      const kandidaten: Reeks[] = [
        { key: 'slaap', label: 'Slaap', eenheid: 'u', icoon: Moon, route: '/slaap', waarden: leesReeks(slaapRuw, 'logs', 'uren_slaap'), meerIsBeter: true, decimalen: 1 },
        { key: 'stappen', label: 'Stappen', eenheid: '', icoon: Footprints, route: '/stappen', waarden: leesReeks(stappenRuw, 'dagen', 'stappen'), meerIsBeter: true, decimalen: 0 },
        { key: 'stemming', label: 'Stemming', eenheid: '', icoon: Smile, route: '/welzijn', waarden: leesReeks(stemmingRuw, 'logs', 'stemming', 'aangemaakt_op'), meerIsBeter: true, decimalen: 1 },
        { key: 'gewicht', label: 'Gewicht', eenheid: 'kg', icoon: Scale, route: '/prestaties', waarden: leesReeks(gewichtRuw, 'metingen', 'gewicht_kg'), meerIsBeter: null, decimalen: 1 },
      ]
      setReeksen(kandidaten.filter((r) => r.waarden.length >= 3))
    })
  }, [])

  useEffect(() => { void laad() }, [laad])

  if (reeksen === null || reeksen.length === 0) return null

  return (
    <section aria-label="Trends" style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Trends</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {reeksen.map((r) => <TrendRij key={r.key} reeks={r} />)}
      </div>
    </section>
  )
}

function TrendRij({ reeks }: { reeks: Reeks }) {
  const gemDeze = gem(reeks.waarden.slice(-7))
  const gemVorige = gem(reeks.waarden.slice(-14, -7))
  const delta = gemDeze !== null && gemVorige !== null && gemVorige > 0 ? Math.round(((gemDeze - gemVorige) / gemVorige) * 100) : null
  const richting: 'op' | 'neer' | 'stabiel' = delta === null || Math.abs(delta) < 2 ? 'stabiel' : delta > 0 ? 'op' : 'neer'
  const Icon = reeks.icoon

  return (
    <Link href={reeks.route} aria-label={`${reeks.label}-trend bekijken`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px' }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--bg-subtle)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon size={19} aria-hidden style={{ color: 'var(--text-3)' }} />
      </span>
      <span style={{ flexShrink: 0, minWidth: 78 }}>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-4)' }}>{reeks.label} · 7d</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 19, fontWeight: 900, color: 'var(--text-1)' }}>{gemDeze !== null ? gemDeze.toFixed(reeks.decimalen) : '–'}{reeks.eenheid}</span>
          <TrendPil richting={richting} delta={delta} meerIsBeter={reeks.meerIsBeter} />
        </span>
      </span>
      <Sparkline punten={reeks.waarden.slice(-10)} />
      <ChevronRight size={18} aria-hidden style={{ color: 'var(--text-4)', flexShrink: 0 }} />
    </Link>
  )
}

function TrendPil({ richting, delta, meerIsBeter }: { richting: 'op' | 'neer' | 'stabiel'; delta: number | null; meerIsBeter: boolean | null }) {
  const goed = richting === 'op' ? meerIsBeter === true : richting === 'neer' ? meerIsBeter === false : null
  const kleur = meerIsBeter === null || richting === 'stabiel' ? 'var(--text-4)' : goed ? 'var(--mf-green)' : 'var(--mf-red)'
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
    <svg viewBox={`0 0 ${b} ${h}`} preserveAspectRatio="none" role="img" aria-label="Trend van de afgelopen periode" style={{ flex: 1, minWidth: 0, height: h }}>
      <path d={d} fill="none" stroke="var(--mentaforce-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
