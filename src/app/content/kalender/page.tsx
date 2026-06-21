'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

// ── Types ──────────────────────────────────────────────────

type ContentItem = {
  type: 'reel' | 'post' | 'story' | 'carousel'
  pijler: string
  titel: string
  hook?: string
  caption: string
  hashtags?: string[]
  beste_tijd: string
}

type DagEntry = {
  dag: number
  dag_naam: string
  datum: string
  items: ContentItem[]
}

type GroeiActie = {
  dag: number
  dag_naam: string
  acties: string[]
}

type Kalender = {
  id: string
  week_start: string
  instagram: DagEntry[]
  facebook: DagEntry[]
  linkedin: DagEntry[]
  groei_acties: GroeiActie[]
}

type Platform = 'instagram' | 'facebook' | 'linkedin'

// ── Helpers ────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, { label: string; kleur: string; icon: string }> = {
  instagram: { label: 'Instagram', kleur: '#E1306C', icon: '📸' },
  facebook:  { label: 'Facebook',  kleur: '#1877F2', icon: '👥' },
  linkedin:  { label: 'LinkedIn',  kleur: '#0A66C2', icon: '💼' },
}

const TYPE_CONFIG: Record<string, { label: string; kleur: string }> = {
  reel:     { label: 'Reel',     kleur: '#E1306C' },
  carousel: { label: 'Carousel', kleur: 'var(--mf-purple)' },
  post:     { label: 'Post',     kleur: 'var(--mf-green)' },
  story:    { label: 'Story',    kleur: 'var(--mf-amber)' },
}

const PIJLER_KLEUR: Record<string, string> = {
  fitness:           'var(--mf-green)',
  ondernemen:        'var(--mf-blue)',
  discipline:        '#0D1117',
  leefstijl:         'var(--mf-purple)',
  stressmanagement:  'var(--mf-red)',
  performance:       'var(--mf-amber)',
  'persoonlijke-groei': 'var(--mf-green)',
}

const DAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function getMaandagVanWeek(): string {
  const d = new Date()
  const dag = d.getDay()
  const diff = dag === 0 ? -6 : 1 - dag
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const eind = new Date(weekStart)
  eind.setDate(eind.getDate() + 6)
  const s = start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
  const e = eind.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${s} – ${e}`
}

// ── NAV TABS ───────────────────────────────────────────────

const NAV_TABS = [
  { href: '/content',           label: 'Overzicht'  },
  { href: '/content/strategie', label: 'Strategie'  },
  { href: '/content/ideeen',    label: 'Ideeën'     },
  { href: '/content/kalender',  label: 'Kalender'   },
]

// ── DagZoomModal ───────────────────────────────────────────

function DagZoomModal({ dag, kalender, onClose }: {
  dag: { dagNr: number; dagNaam: string; datum: string | undefined }
  kalender: Kalender
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const platforms: { key: Platform; cfg: typeof PLATFORM_CONFIG[Platform] }[] = (
    Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]
  ).map(([key, cfg]) => ({ key, cfg }))

  const datumObj = dag.datum ? new Date(dag.datum) : null
  const isVandaag = datumObj ? datumObj.toDateString() === new Date().toDateString() : false
  const isMorgen = datumObj ? datumObj.toDateString() === (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toDateString() })() : false

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        ref={ref}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          width: '100%', maxWidth: 780,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>
                {dag.dagNaam.charAt(0).toUpperCase() + dag.dagNaam.slice(1)}
              </h2>
              {isVandaag && (
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--mf-green)', background: 'rgba(29,158,117,0.12)', borderRadius: 100, padding: '3px 10px' }}>
                  Vandaag
                </span>
              )}
              {isMorgen && (
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--mf-blue)', background: 'rgba(24,95,165,0.12)', borderRadius: 100, padding: '3px 10px' }}>
                  Morgen
                </span>
              )}
            </div>
            {datumObj && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
                {datumObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-3)', lineHeight: 1, padding: '4px 8px' }}
          >
            ×
          </button>
        </div>

        {/* Modal body — per platform */}
        <div style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {platforms.map(({ key, cfg }) => {
            const dagEntry = (kalender[key] as DagEntry[]).find(d => d.dag === dag.dagNr)
            const items = dagEntry?.items ?? []
            return (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: cfg.kleur, margin: 0 }}>{cfg.label}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>
                    {items.length} {items.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0, fontStyle: 'italic' }}>Geen content gepland</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map((item, idx) => (
                      <ModalItemKaart key={idx} item={item} platformKleur={cfg.kleur} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ModalItemKaart({ item, platformKleur }: { item: ContentItem; platformKleur: string }) {
  const typeCfg = TYPE_CONFIG[item.type] ?? { label: item.type, kleur: 'var(--text-2)' }
  const pijlerKleur = PIJLER_KLEUR[item.pijler] ?? 'var(--text-2)'

  return (
    <div style={{
      background: 'var(--bg-app)',
      border: `1px solid ${typeCfg.kleur}30`,
      borderRadius: 'var(--radius-md)',
      padding: '16px 18px',
    }}>
      {/* Type + tijd */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color: typeCfg.kleur,
          background: typeCfg.kleur + '18', borderRadius: 100, padding: '3px 10px',
          textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>
          {typeCfg.label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: pijlerKleur,
          background: pijlerKleur + '15', borderRadius: 100, padding: '3px 10px',
        }}>
          {item.pijler}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginLeft: 'auto' }}>
          ⏰ {item.beste_tijd}
        </span>
      </div>

      {/* Titel */}
      <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 10px', lineHeight: 1.3 }}>
        {item.titel}
      </h4>

      {/* Hook */}
      {item.hook && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>
            Hook
          </p>
          <p style={{
            fontSize: 13, color: platformKleur, fontStyle: 'italic', fontWeight: 600,
            margin: 0, lineHeight: 1.45,
            background: platformKleur + '08', borderRadius: 8, padding: '8px 12px',
            borderLeft: `3px solid ${platformKleur}`,
          }}>
            "{item.hook}"
          </p>
        </div>
      )}

      {/* Caption */}
      <div style={{ marginBottom: item.hashtags?.length ? 10 : 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>
          Caption
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {item.caption}
        </p>
      </div>

      {/* Hashtags */}
      {item.hashtags && item.hashtags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {item.hashtags.map((tag, i) => (
            <span key={i} style={{
              fontSize: 11, color: platformKleur, fontWeight: 600,
              background: platformKleur + '10', borderRadius: 6, padding: '3px 8px',
            }}>
              #{tag.replace(/^#/, '')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────

export default function ContentKalenderPage() {
  const [kalender, setKalender] = useState<Kalender | null>(null)
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [laden, setLaden] = useState(true)
  const [genereren, setGenereren] = useState(false)
  const [openDag, setOpenDag] = useState<number | null>(null)
  const [zoomDag, setZoomDag] = useState<{ dagNr: number; dagNaam: string; datum: string | undefined } | null>(null)
  const weekStart = getMaandagVanWeek()

  const laadKalender = useCallback(async () => {
    setLaden(true)
    try {
      const res = await authFetch(`/api/content/kalender?week=${weekStart}`)
      const data = await res.json()
      setKalender(data.kalender)
    } catch {
      // ignore
    } finally {
      setLaden(false)
    }
  }, [weekStart])

  useEffect(() => { laadKalender() }, [laadKalender])

  async function genereeerKalender(forceer = false) {
    setGenereren(true)
    try {
      const res = await authFetch('/api/content/kalender', {
        method: 'POST',
        body: JSON.stringify({ forceer, week: weekStart }),
      })
      const data = await res.json()
      if (data.kalender) setKalender(data.kalender)
    } catch {
      // ignore
    } finally {
      setGenereren(false)
    }
  }

  const dagData: DagEntry[] = kalender?.[platform] ?? []
  const groeiData: GroeiActie[] = kalender?.groei_acties ?? []

  return (
    <div className="mf-has-sidebar">
      <Navbar />
      <main style={{
        marginLeft: 240,
        maxWidth: 1200,
        padding: '32px 40px 80px',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
      }}>

        {/* ── Nav Tabs ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {NAV_TABS.map((tab) => {
            const isActive = tab.href === '/content/kalender'
            return (
              <Link key={tab.href} href={tab.href} style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? 'var(--mf-green)' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-2)',
                border: isActive ? 'none' : '1px solid var(--border)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.18s var(--ease)',
              }}>
                {tab.label}
              </Link>
            )
          })}
        </div>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              Content Kalender
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>
              {kalender ? formatWeekLabel(kalender.week_start) : 'Wekelijkse planner per platform'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {kalender && (
              <button
                onClick={() => genereeerKalender(true)}
                disabled={genereren}
                style={{
                  padding: '9px 18px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', color: 'var(--text-2)',
                  border: '1px solid var(--border)', cursor: genereren ? 'default' : 'pointer',
                  fontSize: 13, fontWeight: 600, opacity: genereren ? 0.6 : 1,
                }}
              >
                {genereren ? 'Bezig...' : 'Vernieuwen'}
              </button>
            )}
            {!kalender && !laden && (
              <button
                onClick={() => genereeerKalender(false)}
                disabled={genereren}
                style={{
                  padding: '11px 24px', borderRadius: 'var(--radius-md)',
                  background: 'var(--mf-green)', color: '#fff',
                  border: 'none', cursor: genereren ? 'default' : 'pointer',
                  fontSize: 14, fontWeight: 700, opacity: genereren ? 0.7 : 1,
                }}
              >
                {genereren ? 'AI genereert kalender...' : 'Genereer weekkalender'}
              </button>
            )}
          </div>
        </div>

        {/* ── Laden ────────────────────────────────────────── */}
        {laden && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)', fontSize: 15 }}>
            Kalender laden...
          </div>
        )}

        {/* ── Lege state ───────────────────────────────────── */}
        {!laden && !kalender && !genereren && (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 10px' }}>
              Nog geen kalender voor deze week
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-3)', margin: '0 0 28px', maxWidth: 420, marginInline: 'auto' }}>
              Laat AI een complete content kalender genereren voor Instagram, Facebook en LinkedIn — met dagelijkse groei-acties.
            </p>
            <button
              onClick={() => genereeerKalender(false)}
              disabled={genereren}
              style={{
                padding: '13px 32px', borderRadius: 'var(--radius-md)',
                background: 'var(--mf-green)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
              }}
            >
              Genereer weekkalender
            </button>
          </div>
        )}

        {/* ── Genereren ────────────────────────────────────── */}
        {genereren && (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>✨</div>
            <p style={{ fontSize: 16, color: 'var(--text-2)', fontWeight: 600 }}>
              AI maakt jouw content kalender...
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 8 }}>
              Dit duurt 15–30 seconden
            </p>
          </div>
        )}

        {/* ── Kalender weergave ────────────────────────────── */}
        {kalender && !genereren && (
          <>
            {/* Platform tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
              {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]).map(([key, cfg]) => {
                const isActive = platform === key
                return (
                  <button
                    key={key}
                    onClick={() => setPlatform(key)}
                    style={{
                      padding: '9px 20px', borderRadius: 'var(--radius-md)',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      border: isActive ? 'none' : '1px solid var(--border)',
                      background: isActive ? cfg.kleur : 'var(--bg-card)',
                      color: isActive ? '#fff' : 'var(--text-2)',
                      boxShadow: isActive ? '0 2px 8px ' + cfg.kleur + '40' : 'none',
                      transition: 'all 0.18s var(--ease)',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}
                  >
                    <span>{cfg.icon}</span>
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            {/* Platform info banner */}
            <PlatformInfo platform={platform} />

            {/* Dag-kolommen grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 10,
              marginBottom: 40,
            }}>
              {Array.from({ length: 7 }, (_, i) => {
                const dagNr = i + 1
                const entry = dagData.find(d => d.dag === dagNr)
                const datum = entry?.datum
                const datumObj = datum ? new Date(datum) : null
                const isVandaag = datumObj
                  ? datumObj.toDateString() === new Date().toDateString()
                  : false

                const dagNamen = ['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag']

                return (
                  <div
                    key={dagNr}
                    onClick={() => setZoomDag({ dagNr, dagNaam: dagNamen[i], datum: entry?.datum })}
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${isVandaag ? 'var(--mf-green)' : 'var(--border)'}`,
                      background: isVandaag ? 'rgba(29,158,117,0.04)' : 'var(--bg-card)',
                      overflow: 'hidden',
                      boxShadow: isVandaag ? '0 0 0 2px rgba(29,158,117,0.15)' : 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = isVandaag ? '0 0 0 2px rgba(29,158,117,0.15)' : 'var(--shadow-sm)')}
                  >
                    {/* Dag header */}
                    <div style={{
                      padding: '10px 12px 8px',
                      borderBottom: '1px solid var(--border)',
                      background: isVandaag ? 'rgba(29,158,117,0.08)' : 'var(--bg-subtle)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          color: isVandaag ? 'var(--mf-green)' : 'var(--text-2)',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                          {DAG_KORT[i]}
                        </span>
                        {isVandaag && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, color: 'var(--mf-green)',
                            background: 'rgba(29,158,117,0.15)', borderRadius: 100,
                            padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.4px',
                          }}>
                            Vandaag
                          </span>
                        )}
                      </div>
                      {datumObj && (
                        <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>
                          {datumObj.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                    </div>

                    {/* Content items */}
                    <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                      {entry?.items?.length ? entry.items.map((item, idx) => (
                        <ContentItemKaart key={idx} item={item} />
                      )) : (
                        <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', padding: '16px 0' }}>
                          Geen post
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Groei Acties */}
            <GroeiActiesPanel acties={groeiData} openDag={openDag} setOpenDag={setOpenDag} />
          </>
        )}
      </main>

      {/* Dag zoom modal */}
      {zoomDag && kalender && (
        <DagZoomModal
          dag={zoomDag}
          kalender={kalender}
          onClose={() => setZoomDag(null)}
        />
      )}
    </div>
  )
}

// ── PlatformInfo ───────────────────────────────────────────

function PlatformInfo({ platform }: { platform: Platform }) {
  const info: Record<Platform, { tip: string; kleur: string }> = {
    instagram: {
      kleur: '#E1306C',
      tip: 'Reels: 7-15s scoren het best (hogere herbekijkkans). DM-shares zijn het sterkste algoritme-signaal — maak content die mensen doorsturen.',
    },
    facebook: {
      kleur: '#1877F2',
      tip: 'Native video/Reels presteren 5-10x beter dan tekst-posts. Upload video direct naar Facebook, link niet vanuit Instagram.',
    },
    linkedin: {
      kleur: '#0A66C2',
      tip: 'Carousels/PDF-posts zijn top format (20+ seconden kijktijd). Eerste regel moet stoppen met scrollen — zichtbaar vóór "meer lezen".',
    },
  }
  const { tip, kleur } = info[platform]
  return (
    <div style={{
      marginBottom: 20, padding: '10px 16px',
      background: kleur + '0D', borderRadius: 'var(--radius-md)',
      border: `1px solid ${kleur}25`,
      fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55,
    }}>
      <span style={{ fontWeight: 700, color: kleur }}>Tip: </span>{tip}
    </div>
  )
}

// ── ContentItemKaart ───────────────────────────────────────

function ContentItemKaart({ item }: { item: ContentItem }) {
  const [open, setOpen] = useState(false)
  const typeCfg = TYPE_CONFIG[item.type] ?? { label: item.type, kleur: 'var(--text-2)' }
  const pijlerKleur = PIJLER_KLEUR[item.pijler] ?? 'var(--text-2)'

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        borderRadius: 8,
        border: `1px solid ${typeCfg.kleur}25`,
        background: typeCfg.kleur + '08',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: typeCfg.kleur,
            background: typeCfg.kleur + '18', borderRadius: 100, padding: '2px 8px',
            textTransform: 'uppercase', letterSpacing: '0.4px',
          }}>
            {typeCfg.label}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600 }}>
            {item.beste_tijd}
          </span>
        </div>
        <p style={{
          fontSize: 12, fontWeight: 700, color: 'var(--text-1)',
          margin: 0, lineHeight: 1.35,
        }}>
          {item.titel}
        </p>
        {item.hook && !open && (
          <p style={{
            fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0',
            lineHeight: 1.4, fontStyle: 'italic',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            "{item.hook}"
          </p>
        )}
      </div>

      {open && (
        <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {item.hook && (
            <div>
              <Label>Hook</Label>
              <p style={{ fontSize: 12, color: 'var(--text-1)', margin: '3px 0 0', fontStyle: 'italic', lineHeight: 1.45 }}>
                "{item.hook}"
              </p>
            </div>
          )}
          <div>
            <Label>Caption</Label>
            <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '3px 0 0', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {item.caption}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: pijlerKleur,
              background: pijlerKleur + '15', borderRadius: 100, padding: '2px 9px',
            }}>
              {item.pijler}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── GroeiActiesPanel ───────────────────────────────────────

function GroeiActiesPanel({
  acties,
  openDag,
  setOpenDag,
}: {
  acties: GroeiActie[]
  openDag: number | null
  setOpenDag: (n: number | null) => void
}) {
  const vandaagDag = (() => {
    const d = new Date().getDay()
    return d === 0 ? 7 : d
  })()

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
          Dagelijkse Groei Acties
        </h2>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--mf-amber)',
          background: '#BA751715', borderRadius: 100, padding: '3px 11px',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Organische groei
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const dagNr = i + 1
          const entry = acties.find(a => a.dag === dagNr)
          const isVandaag = dagNr === vandaagDag
          const isOpen = openDag === dagNr

          return (
            <div
              key={dagNr}
              onClick={() => setOpenDag(isOpen ? null : dagNr)}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${isVandaag ? '#BA751740' : 'var(--border)'}`,
                background: isVandaag ? '#BA751708' : 'var(--bg-card)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                padding: '10px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: isOpen ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: isVandaag ? 'var(--mf-amber)' : 'var(--text-2)',
                }}>
                  {DAG_KORT[i]}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                  {entry?.acties?.length ?? 0} acties
                </span>
              </div>

              {isOpen && entry?.acties && (
                <ul style={{ margin: 0, padding: '10px 12px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entry.acties.map((actie, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'var(--mf-green)', fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{actie}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Helper ─────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 800, color: 'var(--text-4)',
      textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0,
    }}>
      {children}
    </p>
  )
}
