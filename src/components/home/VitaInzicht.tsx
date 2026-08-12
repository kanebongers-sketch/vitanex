'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { gemiddelde, slaapschuld, regelmaat } from '@/lib/slaap/stats'
import { kiesVitaInzicht } from '@/lib/vita/inzicht'
import { dagGemiddelde, kiesSterksteVerband } from '@/lib/vita/verbanden'
import { verbandDefinities } from '@/lib/vita/verband-teksten'

// Vita's stem op de home: één eerlijk inzicht uit je data ("je slaapschuld daalt").
// Alleen bij een écht signaal (kiesVitaInzicht → null = niets tonen). Bouwt de
// signalen uit /api/slaap + /api/streak met de bestaande, geteste slaap-stats.

interface SlaapLog { uren_slaap: number; bedtijd: string | null }

function leesSlaap(ruw: unknown): { uren: number[]; bedtijden: string[]; doel: number | null } {
  const o = typeof ruw === 'object' && ruw !== null ? ruw as Record<string, unknown> : {}
  const logs = Array.isArray(o.logs) ? (o.logs as unknown[]) : []
  const rijen = logs
    .filter((l): l is SlaapLog => typeof l === 'object' && l !== null && typeof (l as SlaapLog).uren_slaap === 'number')
  const uren = rijen.map((l) => l.uren_slaap)
  const bedtijden = rijen.map((l) => l.bedtijd).filter((b): b is string => typeof b === 'string' && b.length > 0)
  const doelObj = typeof o.doel === 'object' && o.doel !== null ? o.doel as Record<string, unknown> : {}
  const doel = typeof doelObj.uren === 'number' ? doelObj.uren : null
  return { uren, bedtijden, doel }
}

function leesStreak(ruw: unknown): number {
  const o = typeof ruw === 'object' && ruw !== null ? ruw as Record<string, unknown> : {}
  return typeof o.streak === 'number' && Number.isFinite(o.streak) ? o.streak : 0
}

interface VitaToon { emoji: string; tekst: string; label: string }

function lijst(ruw: unknown, sleutel: string): unknown[] {
  const o = typeof ruw === 'object' && ruw !== null ? ruw as Record<string, unknown> : {}
  return Array.isArray(o[sleutel]) ? (o[sleutel] as unknown[]) : []
}

export function VitaInzicht() {
  const [toon, setToon] = useState<VitaToon | null>(null)

  const laad = useCallback((): Promise<void> => {
    const haal = (url: string) => authFetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    return Promise.all([
      haal('/api/slaap?limit=30'),
      haal('/api/streak'),
      haal('/api/stemming?limit=30'),
      haal('/api/stappen?dagen=30'),
    ]).then(([slaapRuw, streakRuw, stemmingRuw, stappenRuw]) => {
      // 1. Cross-pijler verband — het meest onderscheidende inzicht, dus voorrang.
      const verband = kiesSterksteVerband(verbandDefinities({
        slaapUren: dagGemiddelde(lijst(slaapRuw, 'logs'), 'datum', 'uren_slaap'),
        stemming: dagGemiddelde(lijst(stemmingRuw, 'logs'), 'aangemaakt_op', 'stemming'),
        stappen: dagGemiddelde(lijst(stappenRuw, 'dagen'), 'datum', 'stappen'),
      }))
      if (verband) { setToon({ emoji: '🔗', tekst: verband.tekst, label: 'Vita ziet een verband' }); return }

      // 2. Terugval: enkel-pijler slaap-inzicht.
      const { uren, bedtijden, doel } = leesSlaap(slaapRuw)
      const inzicht = kiesVitaInzicht({
        slaapDezeWeek: gemiddelde(uren.slice(0, 7)),
        slaapVorigeWeek: gemiddelde(uren.slice(7, 14)),
        slaapschuld: doel !== null ? slaapschuld(uren, doel) : null,
        regelmaat: regelmaat(bedtijden),
        streak: leesStreak(streakRuw),
      })
      if (inzicht) setToon({ emoji: inzicht.emoji, tekst: inzicht.tekst, label: 'Vita' })
    })
  }, [])

  useEffect(() => { void laad() }, [laad])

  if (toon === null) return null

  return (
    <Link href="/coach" aria-label="Praat met Vita over dit inzicht"
      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--brand-soft, var(--mf-green-light))', border: '1px solid var(--brand, var(--mentaforce-primary))', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
      <span style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--brand, var(--mentaforce-primary))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Sparkles size={20} aria-hidden style={{ color: 'var(--bg-app)' }} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--brand, var(--mentaforce-primary))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{toon.label}</span>
        <span style={{ display: 'block', fontSize: 13.5, color: 'var(--text-1)', lineHeight: 1.45 }}>{toon.emoji} {toon.tekst}</span>
      </span>
    </Link>
  )
}
