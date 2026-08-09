'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, CheckCircle2, ChevronRight } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { huidigeMijlpaal, volgendeMijlpaal, dagenTotVolgende } from '@/lib/streak/mijlpaal'

// De dagelijkse lus op de home: je (vergevende) streak + de check-in-CTA. Dit is de
// reden om terug te komen — genuine waarde + zachte gewoontevorming, geen dark
// pattern (de streak breekt niet omdat je vandaag nog niet logde; zie lib/streak).

interface StreakData {
  streak: number
  actiefVandaag: boolean
}

function leesStreak(ruw: unknown): StreakData | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  return {
    streak: typeof o.streak === 'number' && Number.isFinite(o.streak) ? o.streak : 0,
    actiefVandaag: o.actief_vandaag === true,
  }
}

export function RetentieBalk() {
  const [data, setData] = useState<StreakData | null>(null)

  const laad = useCallback((): Promise<void> => {
    return authFetch('/api/streak')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { const d = leesStreak(json); if (d) setData(d) })
      .catch(() => { /* stil: de balk verdwijnt gewoon */ })
  }, [])

  useEffect(() => { void laad() }, [laad])

  if (data === null) return null

  const { streak, actiefVandaag } = data
  const mijlpaal = huidigeMijlpaal(streak)
  const volgende = volgendeMijlpaal(streak)
  const tot = dagenTotVolgende(streak)

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Mijlpaal-viering (alleen op een exacte drempel) */}
      {mijlpaal && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--mf-amber-light)', border: '1px solid var(--mf-amber)', borderRadius: 14, padding: '10px 14px', marginBottom: 10 }}>
          <span aria-hidden style={{ fontSize: 20 }}>{mijlpaal.emoji}</span>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-1)' }}>{mijlpaal.titel}</span>
        </div>
      )}

      <section aria-label="Je dagelijkse lus" style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* Streak */}
        <div style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px' }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: streak > 0 ? 'var(--mf-amber-light)' : 'var(--bg-subtle)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Flame size={22} aria-hidden style={{ color: streak > 0 ? 'var(--mf-amber)' : 'var(--text-4)' }} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 22, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>{streak}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
              {tot !== null && volgende ? `nog ${tot} tot ${volgende.emoji}` : (streak === 1 ? 'dag op rij' : 'dagen op rij')}
            </span>
          </span>
        </div>

      {/* Dagelijkse check-in — de haak */}
      {actiefVandaag ? (
        <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--brand-soft, var(--mf-green-light))', border: '1px solid var(--brand, var(--mf-green))', borderRadius: 16, padding: '14px 16px' }}>
          <CheckCircle2 size={22} aria-hidden style={{ color: 'var(--brand, var(--mf-green))', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Je bent vandaag bij — mooi bezig.</span>
        </div>
      ) : (
        <Link href="/checkin" aria-label="Doe je dagelijkse check-in"
          style={{ flex: '1 1 200px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--mentaforce-primary)', borderRadius: 16, padding: '14px 16px' }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: 'var(--bg-app)' }}>Dagelijkse check-in</span>
            <span style={{ display: 'block', fontSize: 12, color: 'color-mix(in srgb, var(--bg-app) 80%, transparent)' }}>1 minuut · houd je reeks vast</span>
          </span>
          <ChevronRight size={20} aria-hidden style={{ color: 'var(--bg-app)', flexShrink: 0 }} />
        </Link>
      )}
      </section>
    </div>
  )
}
