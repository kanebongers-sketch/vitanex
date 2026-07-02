'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'
import PandaFace, { type EmotionState } from '@/components/vita/PandaFace'
import type { CoachNudge, NudgeToon } from '@/lib/coach/nudges'

// De banner is een bericht van Vita zelf — haar gezicht draagt de toon.
const TOON_EMOTIE: Record<NudgeToon, EmotionState> = {
  zorg: 'supportive',
  viering: 'proud',
  aanmoediging: 'motivated',
}

// Hoe lang een weggeklikte/aangetikte nudge van hetzelfde type wegblijft,
// zodat de coach nooit gaat zeuren. Vieringen mogen sneller terugkomen.
const COOLDOWN_DAGEN: Record<NudgeToon, number> = {
  zorg: 4,
  aanmoediging: 4,
  viering: 2,
}

const STORAGE_KEY = 'mf_coach_nudge_cooldown'

function leesCooldown(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function zetCooldown(type: string, dagen: number): void {
  try {
    const huidig = leesCooldown()
    huidig[type] = Date.now() + dagen * 86_400_000
    localStorage.setItem(STORAGE_KEY, JSON.stringify(huidig))
  } catch { /* localStorage niet beschikbaar — stil negeren */ }
}

export function CoachNudgeBanner() {
  const [nudge, setNudge] = useState<CoachNudge | null>(null)

  useEffect(() => {
    let actief = true
    async function laad() {
      try {
        const res = await authFetch('/api/coach/nudge')
        if (!res.ok || !actief) return
        const json = (await res.json()) as { nudge: CoachNudge | null }
        if (!json.nudge || !actief) return
        const cooldown = leesCooldown()
        const tot = cooldown[json.nudge.type]
        if (tot && Date.now() < tot) return // nog in cooldown — niet tonen
        setNudge(json.nudge)
      } catch { /* faal zacht: geen nudge is geen probleem */ }
    }
    laad()
    return () => { actief = false }
  }, [])

  if (!nudge) return null

  function sluit() {
    if (nudge) zetCooldown(nudge.type, COOLDOWN_DAGEN[nudge.toon])
    setNudge(null)
  }

  function naarCoach() {
    if (nudge) zetCooldown(nudge.type, COOLDOWN_DAGEN[nudge.toon])
  }

  return (
    <section
      className="mf-nudge"
      aria-label="Bericht van Vita"
      style={{
        position: 'relative',
        marginBottom: 16,
        padding: '16px 16px 16px 18px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--mentaforce-primary)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        gap: 14,
      }}
    >
      <div aria-hidden style={{ flexShrink: 0, width: 38, height: 38 }}>
        <PandaFace emotion={TOON_EMOTIE[nudge.toon]} size={38} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--mentaforce-primary)',
          }}>
            Vita
          </span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          {nudge.titel}
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-2)', margin: '0 0 12px' }}>
          {nudge.bericht}
        </p>
        <Link
          href={`/coach?start=${nudge.type}`}
          onClick={naarCoach}
          className="mf-pressable"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: 'var(--bg-app)',
            background: 'var(--mentaforce-primary)',
            padding: '8px 14px', borderRadius: 'var(--radius-btn)',
            textDecoration: 'none',
          }}
        >
          {nudge.cta}
          <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>

      <button
        onClick={sluit}
        aria-label="Verberg dit bericht"
        className="mf-pressable"
        style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', background: 'transparent', color: 'var(--text-4)', cursor: 'pointer',
        }}
      >
        <X size={16} strokeWidth={2} aria-hidden />
      </button>

      <style>{`
        .mf-nudge { animation: mf-nudge-in 0.4s var(--ease, cubic-bezier(0.16, 1, 0.3, 1)) both; }
        @keyframes mf-nudge-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-nudge { animation: none; }
        }
      `}</style>
    </section>
  )
}
