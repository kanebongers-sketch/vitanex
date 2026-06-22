'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import nextDynamic from 'next/dynamic'
import MetricTile from '@/components/gezondheid/MetricTile'
import HighlightCard from '@/components/gezondheid/HighlightCard'
import VandaagHero from '@/components/gezondheid/VandaagHero'
import { laatsteSyncInfo, syncGezondheidsdata, type LaatsteSyncInfo } from '@/lib/health-sync'
import {
  METRICS, METRIC_VOLGORDE, berekenVergelijkingen, vatMetricSamen,
  type MetricKey, type TrendPunt,
} from '@/lib/gezondheid-metrics'

const AiCoachCard = nextDynamic(() => import('@/components/gezondheid/AiCoachCard'), { ssr: false })
const MetricDetailSheet = nextDynamic(() => import('@/components/gezondheid/MetricDetailSheet'), { ssr: false })
const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

interface Risico {
  score: number
  niveau: 'laag' | 'matig' | 'hoog'
  factoren: string[]
}

interface HealthData {
  risico: Risico
  trend: TrendPunt[]
  statistieken: {
    gemiddeldStappen: number
    gemiddeldSlaapMinuten: number
    aantalMetingen: number
    aantalCheckins: number
  }
  correlaties: { label: string; tip: string }[]
}

const RISICO_STIJL = {
  laag:  { kleur: 'var(--mf-green)', label: 'Laag risico' },
  matig: { kleur: 'var(--mf-amber)', label: 'Matig risico' },
  hoog:  { kleur: 'var(--mf-red)', label: 'Hoog risico' },
}

const CATEGORIEEN = [
  { emoji: '🥗', label: 'Voeding', href: '/voeding', kleur: 'var(--mf-green)' },
  { emoji: '🏋️', label: 'Sport', href: '/sport', kleur: 'var(--mf-blue)' },
  { emoji: '✅', label: 'Check-in', href: '/checkin', kleur: 'var(--mf-purple)' },
  { emoji: '⌚', label: 'Koppelingen', href: '/koppelingen', kleur: 'var(--mf-amber)' },
]

function SectieKop({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 13, fontWeight: 800, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      margin: '0 0 12px',
    }}>{children}</h2>
  )
}

function RisicoRing({ risico }: { risico: Risico }) {
  const stijl = RISICO_STIJL[risico.niveau]
  return (
    <section aria-label="Burn-out risico" style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', padding: '18px 20px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex', alignItems: 'center', gap: 18,
    }}>
      <div style={{ position: 'relative', flexShrink: 0, width: 76, height: 76 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
          <GlowOrb color={risico.niveau === 'laag' ? [0.114, 0.620, 0.459] : risico.niveau === 'matig' ? [0.949, 0.722, 0.141] : [0.886, 0.294, 0.290]} intensity={0.35 + risico.score / 200} size={110} />
        </div>
        <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true" style={{ position: 'relative', zIndex: 1 }}>
        <circle cx="38" cy="38" r="30" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="7" />
        <circle
          cx="38" cy="38" r="30" fill="none" stroke={stijl.kleur} strokeWidth="7"
          strokeDasharray={`${(risico.score / 100) * 188.5} 188.5`}
          strokeLinecap="round" transform="rotate(-90 38 38)"
          style={{ transition: 'stroke-dasharray 1.2s var(--ease)' }}
        />
        <text x="38" y="36" textAnchor="middle" fontSize="19" fontWeight="900" fill={stijl.kleur}>{risico.score}</text>
        <text x="38" y="49" textAnchor="middle" fontSize="9" fill="var(--text-4)">/100</text>
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: stijl.kleur, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 5px' }}>
          Burn-out risico — {stijl.label}
        </p>
        {risico.factoren.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {risico.factoren.map((f, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                borderRadius: 999, padding: '3px 9px',
              }}>{f}</span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Geen risicosignalen — ga zo door! 💪</p>
        )}
      </div>
    </section>
  )
}

function GezondheidInhoud() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncBezig, setSyncBezig] = useState(false)
  const [syncInfo, setSyncInfo] = useState<LaatsteSyncInfo | null>(null)

  const metricParam = searchParams.get('metric')
  const openMetric: MetricKey | null =
    metricParam && metricParam in METRICS ? (metricParam as MetricKey) : null

  const laadInsights = useCallback((): Promise<HealthData | null> =>
    authFetch('/api/health-insights')
      .then(r => r.json())
      .then(d => (d?.trend ? d as HealthData : null))
      .catch(() => null)
  , [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setSyncInfo(laatsteSyncInfo())
      laadInsights().then(d => { setData(d); setLoading(false) })

      // Stille achtergrond-sync (Apple Health / Health Connect / Google Fit),
      // daarna de inzichten verversen met de nieuwe data
      syncGezondheidsdata().then(uitkomst => {
        if (!uitkomst) return
        setSyncInfo(laatsteSyncInfo())
        laadInsights().then(d => { if (d) setData(d) })
      })
    })
  }, [router, laadInsights])

  function handmatigeSync() {
    setSyncBezig(true)
    syncGezondheidsdata({ forceer: true })
      .then(uitkomst => {
        setSyncInfo(laatsteSyncInfo())
        if (uitkomst) return laadInsights().then(d => { if (d) setData(d) })
      })
      .finally(() => setSyncBezig(false))
  }

  const trend = useMemo(() => data?.trend ?? [], [data])

  const tegels = useMemo(() => (
    METRIC_VOLGORDE
      .map(key => ({ key, samenvatting: vatMetricSamen(trend, key) }))
      .filter((t): t is { key: MetricKey; samenvatting: NonNullable<ReturnType<typeof vatMetricSamen>> } => t.samenvatting !== null)
  ), [trend])

  const vergelijkingen = useMemo(() => berekenVergelijkingen(trend), [trend])

  function openDetail(key: MetricKey) {
    router.replace(`/gezondheid?metric=${key}`, { scroll: false })
  }
  function sluitDetail() {
    router.replace('/gezondheid', { scroll: false })
  }

  const datumVandaag = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 110px' }}>

      {/* Grote titel zoals in Apple Health */}
      <header style={{ marginBottom: 22 }} className="gz-intro">
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>
          {datumVandaag}
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em', margin: 0 }}>
          Gezondheid
        </h1>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-label="Laden">
          <div className="gz-skelet" style={{ height: 112 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="gz-skelet" style={{ height: 118 }} />)}
          </div>
        </div>
      ) : !data || tegels.length === 0 ? (
        <div className="gz-intro" style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
          padding: '44px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 44, margin: '0 0 12px' }}>⌚</p>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px' }}>
            Hier komt jouw gezondheidsbeeld
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Koppel een wearable of doe je eerste check-in.<br />
            Stappen, slaap, hartslag en stemming verschijnen hier vanzelf.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/koppelingen" style={{
              background: 'var(--mf-green)', color: 'white', textDecoration: 'none',
              padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            }}>Wearable koppelen</Link>
            <Link href="/checkin" style={{
              background: 'var(--bg-subtle)', color: 'var(--text-2)', textDecoration: 'none',
              border: '1px solid var(--border)',
              padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            }}>Check-in doen</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

          <div className="gz-sectie" style={{ animationDelay: '0.02s' }}>
            <VandaagHero trend={trend} syncInfo={syncInfo} syncBezig={syncBezig} onSync={handmatigeSync} />
          </div>

          <div className="gz-sectie" style={{ animationDelay: '0.08s' }}>
            <RisicoRing risico={data.risico} />
          </div>

          {/* Favorieten: metriek-tegels */}
          <section className="gz-sectie" style={{ animationDelay: '0.12s' }} aria-label="Mijn metingen">
            <SectieKop>Mijn metingen</SectieKop>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
              {tegels.map(t => (
                <MetricTile
                  key={t.key} metricKey={t.key}
                  samenvatting={t.samenvatting} trend={trend}
                  onOpen={openDetail}
                />
              ))}
            </div>
          </section>

          {/* Hoogtepunten */}
          {(vergelijkingen.length > 0 || data.correlaties.length > 0) && (
            <section className="gz-sectie" style={{ animationDelay: '0.19s' }} aria-label="Hoogtepunten">
              <SectieKop>Hoogtepunten</SectieKop>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {vergelijkingen.map((v, i) => <HighlightCard key={i} vergelijking={v} />)}
                {data.correlaties.map((c, i) => (
                  <article key={i} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex', alignItems: 'flex-start', gap: 11,
                  }}>
                    <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }} aria-hidden="true">{c.label.split(' ')[0]}</span>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 3px' }}>
                        {c.label.split(' ').slice(1).join(' ')}
                      </h3>
                      <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>{c.tip}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* AI Coach */}
          <section className="gz-sectie" style={{ animationDelay: '0.26s' }} aria-label="AI Coach">
            <SectieKop>Jouw coach</SectieKop>
            <AiCoachCard
              categorie="beweging"
              apiUrl="/api/ai-coach/beweging"
              linkUrl="/koppelingen"
              linkLabel="Koppel wearable"
            />
          </section>

          {/* Categorieën */}
          <section className="gz-sectie" style={{ animationDelay: '0.33s' }} aria-label="Ontdek meer">
            <SectieKop>Ontdek meer</SectieKop>
            <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))', gap: 10 }}>
              {CATEGORIEEN.map(c => (
                <Link key={c.href} href={c.href} className="gz-categorie" style={{
                  display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '12px 14px',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <span style={{ fontSize: 17 }} aria-hidden="true">{c.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{c.label}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto' }} aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </nav>
          </section>
        </div>
      )}

      {openMetric && (
        <MetricDetailSheet metricKey={openMetric} trend={trend} onClose={sluitDetail} />
      )}
    </main>
  )
}

export default function GezondheidPage() {
  return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="gz-spinner" />
        </div>
      }>
        <GezondheidInhoud />
      </Suspense>

      <style>{`
        .gz-skelet {
          border-radius: 18px;
          background: var(--bg-card);
          animation: gz-puls 1.5s ease-in-out infinite;
        }
        .gz-spinner {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.08); border-top-color: var(--mf-green);
          animation: gz-draai 0.8s linear infinite;
        }
        .gz-intro, .gz-sectie {
          animation: gz-op 0.5s var(--ease) both;
        }
        .metric-tile {
          transition: transform 0.18s var(--ease), box-shadow 0.18s var(--ease);
        }
        .metric-tile:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .metric-tile:active { transform: scale(0.98); }
        .metric-tile:focus-visible, .gz-categorie:focus-visible {
          outline: 2px solid var(--mf-green); outline-offset: 2px;
        }
        .gz-categorie { transition: transform 0.18s var(--ease), box-shadow 0.18s var(--ease); }
        .gz-categorie:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .metric-sheet { animation: gz-sheet 0.32s var(--ease) both; }
        .metric-sheet-backdrop { animation: gz-fade 0.25s ease both; }
        .highlight-balk { animation: gz-balk 0.7s var(--ease) both; transform-origin: left; }
        @keyframes gz-puls { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes gz-draai { to { transform: rotate(360deg) } }
        @keyframes gz-op { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        @keyframes gz-sheet { from { transform: translateY(40px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes gz-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes gz-balk { from { transform: scaleX(0.3); opacity: 0 } to { transform: none; opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .gz-intro, .gz-sectie, .metric-sheet, .metric-sheet-backdrop, .highlight-balk { animation: none }
          .metric-tile, .gz-categorie { transition: none }
        }
        @media (min-width: 640px) {
          .metric-sheet-backdrop { align-items: center !important; padding: 24px; }
          .metric-sheet { border-radius: 24px !important; }
        }
      `}</style>
    </div>
  )
}
