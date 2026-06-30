'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, TrendingUp, MessageCircle, ArrowRight } from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'
import { CAT } from '@/lib/doelen-config'
import type { WellbeingCat } from '@/lib/weekdoelen'

const VLAKKEN: WellbeingCat[] = ['slaap', 'stress', 'energie', 'focus', 'balans', 'motivatie']

/** Eén bewezen patroon uit /api/patronen (deterministisch, met echte cijfers). */
type Patroon = {
  id: string
  titel: string
  beschrijving: string
  betrouwbaarheid: 'laag' | 'middel' | 'hoog'
}

interface CheckinInsightProps {
  /** De zojuist ingevulde domeinscores (4–20 per vlak). */
  scores: Record<WellbeingCat, number>
}

function pct(score: number): number {
  return Math.round(((score - 4) / 16) * 100)
}

/**
 * Toont direct ná de check-in een persoonlijk inzicht — het beloningsmoment.
 * De kern is instant en deterministisch (uit de zojuist ingevulde scores, geen
 * AI-kosten, geen wachttijd). Als er genoeg historie is, verrijkt het zich met
 * één bewezen patroon uit /api/patronen. Eerlijk: alleen echte cijfers.
 */
export function CheckinInsight({ scores }: CheckinInsightProps) {
  const [patroon, setPatroon] = useState<Patroon | null>(null)

  useEffect(() => {
    let actief = true
    async function laad() {
      try {
        const res = await authFetch('/api/patronen')
        if (!res.ok || !actief) return
        const json = (await res.json()) as { patronen?: Patroon[] }
        const lijst = json.patronen ?? []
        // Alleen geloofwaardige patronen — nooit een zwak signaal opdringen.
        const beste = lijst.find(p => p.betrouwbaarheid === 'hoog')
          ?? lijst.find(p => p.betrouwbaarheid === 'middel')
        if (beste && actief) setPatroon(beste)
      } catch { /* faal zacht: geen patroon is geen probleem */ }
    }
    laad()
    return () => { actief = false }
  }, [])

  const aanwezig = VLAKKEN.filter(v => scores[v] > 0)
  if (!aanwezig.length) return null

  const vitaliteit = Math.round(aanwezig.reduce((a, v) => a + pct(scores[v]), 0) / aanwezig.length)
  const gesorteerd = [...aanwezig].sort((a, b) => scores[b] - scores[a])
  const sterkste = gesorteerd[0]
  const focus = gesorteerd[gesorteerd.length - 1]
  const sterktePct = pct(scores[sterkste])

  const lead =
    vitaliteit >= 70 ? 'Sterke week — je staat er goed voor.'
    : vitaliteit >= 45 ? 'Een solide basis om op verder te bouwen.'
    : 'Fijn dat je eerlijk incheckt. Juist nu telt elke kleine stap.'

  // Noem een sterkste vlak alleen als dat écht goed scoort; anders puur de kans.
  const body = sterktePct >= 55
    ? `Je sterkste vlak is ${CAT[sterkste].label.toLowerCase()} (${sterktePct}%). Je grootste kans deze week ligt bij ${CAT[focus].label.toLowerCase()} — daar helpen de doelen hieronder je gericht mee.`
    : `Je grootste kans deze week ligt bij ${CAT[focus].label.toLowerCase()}. De doelen hieronder zijn precies daarop gericht — één stap tegelijk.`

  return (
    <section
      aria-label="Persoonlijk inzicht na je check-in"
      style={{
        marginBottom: 20,
        padding: '18px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--mentaforce-primary)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div
          aria-hidden
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
          }}
        >
          <Sparkles size={20} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--mentaforce-primary)', margin: '0 0 2px',
          }}>
            Jouw moment
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
            {lead}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--mentaforce-primary)', lineHeight: 1, letterSpacing: '-0.03em', margin: 0 }}>
            {vitaliteit}
          </p>
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', margin: '3px 0 0' }}>
            vitaliteit
          </p>
        </div>
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
        {body}
      </p>

      {patroon && (
        <div style={{
          marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10,
        }}>
          <TrendingUp size={16} strokeWidth={1.75} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: 'var(--mentaforce-primary)' }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px' }}>
              Je coach zag een patroon — {patroon.titel.toLowerCase()}
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-3)', margin: 0 }}>
              {patroon.beschrijving}
            </p>
          </div>
        </div>
      )}

      <Link
        href="/coach"
        className="mf-pressable"
        style={{
          marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 600, color: 'var(--mentaforce-primary)',
          textDecoration: 'none',
        }}
      >
        <MessageCircle size={14} strokeWidth={2} aria-hidden />
        Bespreek deze week met je coach
        <ArrowRight size={13} strokeWidth={2.25} aria-hidden />
      </Link>
    </section>
  )
}
