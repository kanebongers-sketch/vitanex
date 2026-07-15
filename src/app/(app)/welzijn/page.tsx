'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NotebookPen, Leaf, Wind, HandHeart, Telescope, CheckCircle2, ChevronRight, Dumbbell, Apple, Droplets } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { PijlerKaart } from '@/components/pijlers/PijlerKaart'
import { LaadFout } from '@/components/pijlers/LaadFout'
import { PIJLERS } from '@/lib/pijlers/pijlers'
import type { PijlerOverzicht } from '@/lib/pijlers/pijlers-server'

// Alles wat je kunt loggen of doen, op één vindbare plek. Deze lijst is óók de
// enige route naar /sport, /voeding en /water — zonder die drie lopen de
// Focus-CTA's op Home dood (die linken er wél naartoe).
const HULPMIDDELEN: { href: string; label: string; icon: LucideIcon; sub: string }[] = [
  { href: '/checkin', label: 'Weekcheck-in', icon: CheckCircle2, sub: 'De wekelijkse meting' },
  { href: '/sport', label: 'Beweging', icon: Dumbbell, sub: 'Training en stappen' },
  { href: '/voeding', label: 'Voeding', icon: Apple, sub: 'Wat je eet' },
  { href: '/water', label: 'Water', icon: Droplets, sub: 'Je hydratatie' },
  { href: '/ademhaling', label: 'Ademhaling', icon: Wind, sub: 'Verlaag je spanning' },
  { href: '/journal', label: 'Journal', icon: NotebookPen, sub: 'Schrijf van je af' },
  { href: '/meditatie', label: 'Meditatie', icon: Leaf, sub: 'Rust je hoofd' },
  { href: '/dankbaarheid', label: 'Dankbaarheid', icon: HandHeart, sub: 'Drie goede dingen' },
  { href: '/reflectie', label: 'Reflectie', icon: Telescope, sub: 'Kijk terug op je week' },
]

export default function WelzijnPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(false)
  const [data, setData] = useState<PijlerOverzicht | null>(null)

  const laad = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    setFout(false)
    try {
      const res = await authFetch('/api/pijlers')
      if (!res.ok) throw new Error('pijlers')
      setData(await res.json() as PijlerOverzicht)
    } catch {
      // Bewust GEEN terugval op de lege staat: dat zou de gebruiker vertellen
      // dat hij niets gemeten heeft, terwijl het onze fout is.
      setFout(true)
    } finally {
      setLaden(false)
    }
  }, [router])

  useEffect(() => { void Promise.resolve().then(laad) }, [laad])

  const pijlers = data?.pijlers ?? []

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-wz">
        <header style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)', margin: '0 0 4px' }}>
            Welzijn
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
            Je zes pijlers in één blik. Tik er een aan voor je score, trend en de beste volgende stap.
          </p>
        </header>

        <div className="mf-wz-layout">
        <div className="mf-wz-pillars">
        {fout ? (
          <LaadFout wat="je pijlers" onOpnieuw={() => { setLaden(true); void laad() }} />
        ) : laden && !data ? (
          <div className="mf-wz-grid" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mf-skeleton" style={{ height: 116, borderRadius: 'var(--radius-card)' }} />
            ))}
          </div>
        ) : (
          <div className="mf-wz-grid">
            {PIJLERS.map((def) => {
              const r = pijlers.find((p) => p.key === def.key)
              return (
                <PijlerKaart
                  key={def.key}
                  pijler={def}
                  score={r?.score ?? null}
                  trend={r?.trend ?? { richting: 'geen', deltaPct: null }}
                />
              )
            })}
          </div>
        )}
        </div>

        <div className="mf-wz-tools">
        {/* Hulpmiddelen */}
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', margin: '30px 0 12px' }}>
          Hulpmiddelen
        </h2>
        <nav aria-label="Hulpmiddelen" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HULPMIDDELEN.map((h) => {
            const Icon = h.icon
            return (
              <Link key={h.href} href={h.href} className="mf-wz-tool">
                <span className="mf-wz-tool-ico" aria-hidden><Icon size={15} strokeWidth={1.9} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{h.label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-4)' }}>{h.sub}</span>
                </span>
                <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--text-4)', flexShrink: 0 }} aria-hidden />
              </Link>
            )
          })}
        </nav>
        </div>
        </div>
      </main>

      <style>{`
        .mf-wz { max-width: 640px; margin: 0 auto; padding: 40px 20px 108px; }
        @media (min-width: 1024px) {
          .mf-wz { max-width: 1040px; padding: 52px 32px 72px; }
          .mf-wz-layout { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 26px; align-items: start; }
        }
        .mf-wz-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 560px) { .mf-wz-grid { grid-template-columns: repeat(3, 1fr); } }
        .mf-wz-tool {
          display: flex; align-items: center; gap: 12px; padding: 12px 15px;
          background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card);
          text-decoration: none; transition: border-color 0.14s var(--ease), transform 0.14s var(--ease);
        }
        .mf-wz-tool:hover { border-color: color-mix(in srgb, var(--brand) 35%, transparent); transform: translateY(-1px); }
        .mf-wz-tool:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
        .mf-wz-tool-ico { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 9px; background: var(--brand-soft); color: var(--brand); flex-shrink: 0; }
        @media (prefers-reduced-motion: reduce) { .mf-wz-tool { transition: none; } .mf-wz-tool:hover { transform: none; } }
      `}</style>
    </div>
  )
}
