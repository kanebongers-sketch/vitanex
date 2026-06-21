'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

// ── Types ──────────────────────────────────────────────────

type Video = {
  nummer: number
  titel: string
  pijler: string
  locatie: string
  format?: string
  invalshoek?: string
  doelgroep_pijn?: string
  duur_sec: number
  platform: string[]
  prioriteit: 'hoog' | 'medium' | 'laag'
  hook: string
  script: string
  camera_opstelling?: string
  kleding?: string
  opname_volgorde?: string[]
  licht?: string
  productie_tip?: string
  broll: string[]
  cta: string
  caption_idee: string
  status?: string
}

type Briefing = {
  id: string
  datum: string
  post_datum?: string
  videos: Video[]
  totale_opnametijd_sec: number
  status: string
  gegenereerd_op: string
  meta?: { groet?: string; thema?: string; tip?: string }
}

// ── Helpers ────────────────────────────────────────────────

function secNaarMinuten(sec: number): string {
  const min = Math.floor(sec / 60)
  const rest = sec % 60
  if (rest === 0) return `${min} min`
  return `${min}:${String(rest).padStart(2, '0')} min`
}

function vandaagNl(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function uurVanDeDag(): string {
  const uur = new Date().getHours()
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

const GROEN = 'var(--mf-green)'
const ORANJE = 'var(--mf-amber)'
const BLAUW = 'var(--mf-blue)'

// ── VideoKaart ─────────────────────────────────────────────

function VideoKaart({ video, briefingId, onStatusUpdate }: {
  video: Video
  briefingId: string
  onStatusUpdate: (nummer: number, status: string) => void
}) {
  const [tab, setTab] = useState<'script' | 'productie' | 'caption'>('script')
  const [gefilmd, setGefilmd] = useState(video.status === 'gefilmd')

  async function markeerGefilmd() {
    const nieuwStatus = gefilmd ? 'te_filmen' : 'gefilmd'
    setGefilmd(!gefilmd)
    await authFetch('/api/content/briefing', {
      method: 'PATCH',
      body: JSON.stringify({ briefing_id: briefingId, video_nummer: video.nummer, status: nieuwStatus }),
    })
    onStatusUpdate(video.nummer, nieuwStatus)
  }

  return (
    <div style={{
      background: gefilmd ? 'var(--mf-green-light)' : 'var(--bg-card)',
      border: `2px solid ${gefilmd ? '#86EFAC' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: gefilmd ? 'none' : 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {/* Nummer badge */}
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: gefilmd ? 'var(--mf-green)' : 'var(--bg-subtle)',
            border: `2px solid ${gefilmd ? '#1D9E75' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: gefilmd ? '#fff' : 'var(--text-1)', flexShrink: 0,
          }}>
            {gefilmd ? '✓' : video.nummer}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Locatie + format chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                background: `${GROEN}15`, color: GROEN,
                padding: '3px 10px', borderRadius: 20,
              }}>
                📍 {video.locatie}
              </span>
              {video.format && (
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                  background: 'var(--bg-subtle)', color: 'var(--text-3)',
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {video.format}
                </span>
              )}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'var(--bg-subtle)', color: 'var(--text-3)',
                padding: '3px 10px', borderRadius: 20,
              }}>
                ⏱ {secNaarMinuten(video.duur_sec)}
              </span>
            </div>

            <h3 style={{
              fontSize: 18, fontWeight: 800, color: 'var(--text-1)',
              margin: '0 0 6px', lineHeight: 1.3,
              textDecoration: gefilmd ? 'line-through' : 'none',
              opacity: gefilmd ? 0.5 : 1,
            }}>
              {video.titel}
            </h3>

            {/* Invalshoek / doelgroep pijn */}
            {video.invalshoek && (
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
                {video.invalshoek}
                {video.doelgroep_pijn && <span style={{ color: 'var(--text-4)' }}> · {video.doelgroep_pijn}</span>}
              </div>
            )}
          </div>

          <button
            onClick={markeerGefilmd}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: gefilmd ? 'var(--mf-green)' : 'var(--bg-subtle)',
              color: gefilmd ? '#fff' : 'var(--text-2)',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {gefilmd ? '✓ Gefilmd' : 'Gefilmd'}
          </button>
        </div>

        {/* Hook — altijd zichtbaar */}
        <div style={{
          marginTop: 16,
          background: `${GROEN}08`,
          border: `1px solid ${GROEN}25`,
          borderLeft: `4px solid ${GROEN}`,
          borderRadius: 10, padding: '12px 16px',
          fontSize: 16, fontWeight: 700, color: 'var(--text-1)',
          lineHeight: 1.5, fontStyle: 'italic',
        }}>
          "{video.hook}"
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
      }}>
        {([
          { id: 'script', label: '📝 Script' },
          { id: 'productie', label: '🎬 Productie' },
          { id: 'caption', label: '📱 Caption' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'var(--bg-card)' : 'transparent',
              color: tab === t.id ? 'var(--text-1)' : 'var(--text-3)',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              borderBottom: tab === t.id ? `2px solid ${GROEN}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab inhoud */}
      <div style={{ padding: '20px 24px' }}>

        {/* ── Script tab ── */}
        {tab === 'script' && (
          <>
            <div style={{
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '18px',
              fontSize: 14, color: 'var(--text-1)',
              lineHeight: 2, whiteSpace: 'pre-line',
              fontFamily: '"SF Mono", "Fira Code", monospace',
            }}>
              {video.script}
            </div>

            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 6, textTransform: 'uppercase' }}>
                  B-roll shots
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(video.broll ?? []).map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                      <span style={{ color: GROEN, fontWeight: 800, flexShrink: 0 }}>▸</span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Call to action
                </div>
                <div style={{
                  background: `${GROEN}10`, border: `1px solid ${GROEN}25`,
                  borderRadius: 10, padding: '12px 14px',
                  fontSize: 13, fontWeight: 700, color: GROEN,
                }}>
                  {video.cta}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Productie tab ── */}
        {tab === 'productie' && (
          <>
            {/* Camera / Kleding / Licht */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: '📷 Camera', waarde: video.camera_opstelling, kleur: ORANJE },
                { label: '👕 Kleding', waarde: video.kleding, kleur: BLAUW },
                { label: '💡 Licht', waarde: video.licht, kleur: 'var(--mf-purple)' },
              ].map(item => item.waarde ? (
                <div key={item.label} style={{
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '14px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: item.kleur, marginBottom: 6, textTransform: 'uppercase' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {item.waarde}
                  </div>
                </div>
              ) : null)}
            </div>

            {/* Opname volgorde */}
            {video.opname_volgorde?.length ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Opname volgorde
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {video.opname_volgorde.map((shot, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      background: 'var(--bg-subtle)', borderRadius: 8, padding: '10px 14px',
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                        background: ORANJE, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                      }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{shot}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Pro tip */}
            {video.productie_tip && (
              <div style={{
                background: 'var(--mf-orange-light)', border: '1px solid #FED7AA',
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ORANJE, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Pro tip
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--mf-amber-dark)', lineHeight: 1.6 }}>
                    {video.productie_tip}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Caption tab ── */}
        {tab === 'caption' && (
          <>
            <div style={{
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '16px',
              fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8,
              whiteSpace: 'pre-line',
            }}>
              {video.caption_idee}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(video.platform ?? []).map(p => (
                <span key={p} style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                  background: `${BLAUW}12`, color: BLAUW,
                }}>
                  {p}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Hoofdpagina ────────────────────────────────────────────

export default function ContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [genereren, setGenereren] = useState(false)
  const [pdfLaden, setPdfLaden] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [error, setError] = useState('')
  const [gefilmdTeller, setGefilmdTeller] = useState(0)

  const laadBriefing = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    try {
      const res = await authFetch('/api/content/briefing')
      const json = await res.json()
      if (json.briefing) {
        setBriefing(json.briefing)
        setGefilmdTeller(json.briefing.videos?.filter((v: Video) => v.status === 'gefilmd').length ?? 0)
        if (json.briefing.drive_link) setPdfUrl(json.briefing.drive_link)
      }
    } catch {
      setError('Kon briefing niet laden')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { laadBriefing() }, [laadBriefing])

  async function genereerBriefing(forceer = false) {
    setGenereren(true)
    setError('')
    try {
      const res = await authFetch('/api/content/briefing', {
        method: 'POST',
        body: JSON.stringify({ forceer }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setBriefing(json.briefing)
      setGefilmdTeller(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Onbekende fout')
    } finally {
      setGenereren(false)
    }
  }

  async function downloadPDF() {
    if (pdfUrl) { window.open(pdfUrl, '_blank'); return }
    setPdfLaden(true)
    setError('')
    try {
      const res = await authFetch('/api/content/pdf', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      if (json.link) {
        setPdfUrl(json.link)
        window.open(json.link, '_blank')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'PDF mislukt')
    } finally {
      setPdfLaden(false)
    }
  }

  function handleStatusUpdate(nummer: number, status: string) {
    setBriefing(prev => {
      if (!prev) return prev
      const videos = prev.videos.map(v => v.nummer === nummer ? { ...v, status } : v)
      setGefilmdTeller(videos.filter(v => v.status === 'gefilmd').length)
      return { ...prev, videos }
    })
  }

  const videosTotaal  = briefing?.videos?.length ?? 0
  const volledigKlaar = gefilmdTeller === videosTotaal && videosTotaal > 0

  return (
    <div className="mf-has-sidebar" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ marginLeft: 240, padding: '32px 40px', maxWidth: 900, margin: '0 auto', paddingLeft: 280 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'capitalize' }}>
            {vandaagNl()}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {uurVanDeDag()}, Kane
          </h1>
          {briefing?.post_datum && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.25)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: GROEN }}>
                🎬 Film vandaag &middot; 📅 Post morgen{' '}
                {new Date(briefing.post_datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          )}
        </div>

        {/* Geen briefing */}
        {!loading && !briefing && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '60px 40px', textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💪</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px' }}>
              Klaar om te groeien?
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-3)', margin: '0 0 28px' }}>
              4 AI agents genereren jouw dagelijkse fitness content — scripts, hooks, camera-instructies en shot lists. Klaar in 30 seconden.
            </p>
            <button
              onClick={() => genereerBriefing(false)}
              disabled={genereren}
              style={{
                padding: '14px 36px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: genereren ? 'var(--text-3)' : GROEN,
                color: '#fff', fontSize: 16, fontWeight: 800,
                boxShadow: genereren ? 'none' : '0 4px 16px rgba(29,158,117,0.4)',
              }}
            >
              {genereren ? '⚡ 4 agents aan het werk...' : '⚡ Genereer vandaag briefing'}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Briefing laden...</div>
          </div>
        )}

        {/* Briefing */}
        {briefing && (
          <>
            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                {
                  label: 'Opnametijd', waarde: secNaarMinuten(briefing.totale_opnametijd_sec),
                  sub: 'vandaag filmen', kleur: GROEN, icon: '⏱',
                },
                {
                  label: 'Voortgang', waarde: `${gefilmdTeller} / ${videosTotaal}`,
                  sub: volledigKlaar ? '🎉 Alles gefilmd!' : 'videos gefilmd', kleur: volledigKlaar ? GROEN : BLAUW, icon: '🎬',
                },
                {
                  label: 'Platforms',
                  waarde: [...new Set(briefing.videos.flatMap(v => v.platform))].length.toString(),
                  sub: [...new Set(briefing.videos.flatMap(v => v.platform))].join(', '),
                  kleur: 'var(--mf-purple)', icon: '📱',
                },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '20px',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: stat.kleur, letterSpacing: '-0.02em' }}>{stat.waarde}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>{stat.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Voortgangsbalk */}
            {videosTotaal > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${(gefilmdTeller / videosTotaal) * 100}%`,
                    background: GROEN,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Video kaarten */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
              {briefing.videos.map(video => (
                <VideoKaart
                  key={video.nummer}
                  video={video}
                  briefingId={briefing.id}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>

            {/* Acties */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8 }}>
              <button
                onClick={downloadPDF}
                disabled={pdfLaden}
                style={{
                  padding: '12px 24px', borderRadius: 10, border: 'none',
                  cursor: pdfLaden ? 'not-allowed' : 'pointer',
                  background: pdfLaden ? 'var(--text-3)' : pdfUrl ? GROEN : BLAUW,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  boxShadow: pdfLaden ? 'none' : '0 2px 10px rgba(24,95,165,0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {pdfLaden ? '⏳ PDF genereren...' : pdfUrl ? '📄 Open PDF' : '📄 Download PDF'}
              </button>
              <button
                onClick={() => genereerBriefing(true)}
                disabled={genereren}
                style={{
                  padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)',
                  cursor: genereren ? 'not-allowed' : 'pointer',
                  background: 'var(--bg-card)', color: 'var(--text-2)',
                  fontSize: 13, fontWeight: 700, opacity: genereren ? 0.6 : 1,
                }}
              >
                {genereren ? '⚡ 4 agents...' : '🔄 Hergeneer briefing'}
              </button>
              <Link href="/content/kalender" style={{
                padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-2)',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                📅 Weekkalender
              </Link>
            </div>
          </>
        )}

        {error && (
          <div style={{
            marginTop: 16, padding: '12px 16px', background: 'var(--mf-red-light)',
            border: '1px solid #FECACA', borderRadius: 10,
            fontSize: 14, color: 'var(--mf-red)', fontWeight: 600,
          }}>
            {error}
          </div>
        )}
      </main>
    </div>
  )
}
