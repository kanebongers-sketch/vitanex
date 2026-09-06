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
    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
      {/* Mijlpaal-viering (alleen op een exacte drempel) */}
      {mijlpaal && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '2px 2px 0' }}>
          <span aria-hidden style={{ fontSize: 16 }}>{mijlpaal.emoji}</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--mf-amber)' }}>{mijlpaal.titel}</span>
        </div>
      )}

      {/* De daglus als één rustige rij: streak links, check-in rechts. */}
      <section aria-label="Je dagelijkse lus" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0, padding: '0 2px' }}>
          <Flame size={18} aria-hidden style={{ color: streak > 0 ? 'var(--mf-amber)' : 'var(--text-4)', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
            <strong style={{ fontWeight: 900, color: 'var(--text-1)' }}>{streak}</strong>{' '}
            {tot !== null && volgende ? `— nog ${tot} tot ${volgende.emoji}` : (streak === 1 ? 'dag op rij' : 'dagen op rij')}
          </span>
        </span>

        {actiefVandaag ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--brand, var(--mf-green))', padding: '0 2px' }}>
            <CheckCircle2 size={16} aria-hidden style={{ flexShrink: 0 }} /> Vandaag bij
          </span>
        ) : (
          <Link href="/checkin" aria-label="Doe je dagelijkse check-in"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--mentaforce-primary)', borderRadius: 12, padding: '9px 12px 9px 14px' }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--bg-app)' }}>Check-in</span>
            <ChevronRight size={17} aria-hidden style={{ color: 'var(--bg-app)', flexShrink: 0 }} />
          </Link>
        )}
      </section>
    </div>
  )
}
