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
  duur_sec: number
  platform: string[]
  prioriteit: 'hoog' | 'medium' | 'laag'
  hook: string
  script: string
  broll: string[]
  cta: string
  caption_idee: string
  status?: string
}

type Briefing = {
  id: string
  datum: string
  videos: Video[]
  totale_opnametijd_sec: number
  status: string
  gegenereerd_op: string
  meta?: { groet?: string; thema?: string; tip?: string }
}

// ── Helpers ────────────────────────────────────────────────

const PIJLER_KLEUR: Record<string, string> = {
  fitness: '#1D9E75',
  ondernemen: '#185FA5',
  discipline: '#0D1117',
  leefstijl: '#8B5CF6',
  stressmanagement: '#E24B4A',
  performance: '#BA7517',
  'persoonlijke-groei': '#1D9E75',
}

const PIJLER_LABEL: Record<string, string> = {
  fitness: 'Fitness',
  ondernemen: 'Ondernemen',
  discipline: 'Discipline',
  leefstijl: 'Leefstijl',
  stressmanagement: 'Stressmanagement',
  performance: 'Performance',
  'persoonlijke-groei': 'Persoonlijke Groei',
}

const PIJLER_EMOJI: Record<string, string> = {
  fitness: '💪',
  ondernemen: '🚀',
  discipline: '🧱',
  leefstijl: '🌿',
  stressmanagement: '⚡',
  performance: '📈',
  'persoonlijke-groei': '🧠',
}

function secNaarMinuten(sec: number): string {
  const min = Math.floor(sec / 60)
  const rest = sec % 60
  if (rest === 0) return `${min} min`
  return `${min}:${String(rest).padStart(2, '0')} min`
}

function vandaagNl(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function uurVanDeDag(): string {
  const uur = new Date().getHours()
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

// ── VideoKaart ─────────────────────────────────────────────

function VideoKaart({ video, briefingId, onStatusUpdate }: {
  video: Video
  briefingId: string
  onStatusUpdate: (nummer: number, status: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [gefilmd, setGefilmd] = useState(video.status === 'gefilmd')
  const kleur = PIJLER_KLEUR[video.pijler] ?? '#1D9E75'
  const emoji = PIJLER_EMOJI[video.pijler] ?? '🎬'

  async function markeerGefilmd() {
    const nieuwStatus = gefilmd ? 'te_filmen' : 'gefilmd'
    setGefilmd(!gefilmd)
    await authFetch('/api/content/briefing', {
      method: 'PATCH',
      body: JSON.stringify({ briefing_id: briefingId, video_nummer: video.nummer, status: nieuwStatus }),
    })
    onStatusUpdate(video.nummer, nieuwStatus)
  }

  const prioriteitKleur = video.prioriteit === 'hoog' ? '#E24B4A' : video.prioriteit === 'medium' ? '#BA7517' : '#6B7280'

  return (
    <div style={{
      background: gefilmd ? '#F0FDF4' : 'var(--bg-card)',
      border: `1px solid ${gefilmd ? '#86EFAC' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div
        style={{ padding: '20px 24px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {/* Nummer badge */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `${kleur}18`,
            border: `2px solid ${kleur}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: kleur, flexShrink: 0,
          }}>
            {video.nummer}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                background: `${kleur}15`, color: kleur,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {emoji} {PIJLER_LABEL[video.pijler] ?? video.pijler}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: `${prioriteitKleur}12`, color: prioriteitKleur,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {video.prioriteit === 'hoog' ? '🔴 Hoog' : video.prioriteit === 'medium' ? '🟡 Medium' : '🟢 Laag'}
              </span>
            </div>

            <h3 style={{
              fontSize: 17, fontWeight: 800, color: 'var(--text-1)',
              margin: 0, lineHeight: 1.3,
              textDecoration: gefilmd ? 'line-through' : 'none',
              opacity: gefilmd ? 0.5 : 1,
            }}>
              {video.titel}
            </h3>

            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                📍 {video.locatie}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                ⏱ {secNaarMinuten(video.duur_sec)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                📱 {video.platform.join(' · ')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); markeerGefilmd() }}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: gefilmd ? '#1D9E75' : 'var(--bg-subtle)',
                color: gefilmd ? '#fff' : 'var(--text-2)',
                fontSize: 13, fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
            >
              {gefilmd ? '✓ Gefilmd' : 'Gefilmd'}
            </button>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Uitklapbare inhoud */}
      {open && (
        <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border)' }}>
          {/* Hook */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
              Hook (eerste 3 seconden)
            </div>
            <div style={{
              background: `${kleur}08`,
              border: `1px solid ${kleur}25`,
              borderLeft: `4px solid ${kleur}`,
              borderRadius: 10, padding: '14px 16px',
              fontSize: 16, fontWeight: 700, color: 'var(--text-1)',
              lineHeight: 1.5, fontStyle: 'italic',
            }}>
              "{video.hook}"
            </div>
          </div>

          {/* Script */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
              Script
            </div>
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: '16px',
              fontSize: 14, color: 'var(--text-2)',
              lineHeight: 1.8, whiteSpace: 'pre-line', fontFamily: 'monospace',
            }}>
              {video.script}
            </div>
          </div>

          {/* B-roll + CTA grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                B-roll
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {video.broll.map((b, i) => (
                  <li key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    fontSize: 13, color: 'var(--text-2)',
                  }}>
                    <span style={{ color: kleur, fontWeight: 800, flexShrink: 0 }}>▸</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                Call-to-Action
              </div>
              <div style={{
                background: `${kleur}10`, border: `1px solid ${kleur}25`,
                borderRadius: 10, padding: '12px 14px',
                fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
              }}>
                {video.cta}
              </div>
            </div>
          </div>

          {/* Caption idee */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
              Caption idee
            </div>
            <div style={{
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px',
              fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7,
            }}>
              {video.caption_idee}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hoofdpagina ────────────────────────────────────────────

export default function ContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [genereren, setGenereren] = useState(false)
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

  function handleStatusUpdate(nummer: number, status: string) {
    setBriefing(prev => {
      if (!prev) return prev
      const videos = prev.videos.map(v => v.nummer === nummer ? { ...v, status } : v)
      const teller = videos.filter(v => v.status === 'gefilmd').length
      setGefilmdTeller(teller)
      return { ...prev, videos }
    })
  }

  const videosGefilmd = gefilmdTeller
  const videosTotaal = briefing?.videos?.length ?? 0
  const volledigKlaar = videosGefilmd === videosTotaal && videosTotaal > 0

  return (
    <div className="mf-has-sidebar" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ marginLeft: 240, padding: '32px 40px', maxWidth: 900, margin: '0 auto', paddingLeft: 280 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'capitalize' }}>
            {vandaagNl()}
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 900, color: 'var(--text-1)',
            margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            {uurVanDeDag()}, Kane
          </h1>
          {briefing?.meta?.thema && (
            <p style={{ fontSize: 15, color: 'var(--text-3)', margin: '8px 0 0', fontWeight: 500 }}>
              Thema van vandaag: <strong style={{ color: 'var(--text-2)' }}>{briefing.meta.thema}</strong>
            </p>
          )}
        </div>

        {/* Navigatie tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { href: '/content', label: '📋 Briefing', actief: true },
            { href: '/content/strategie', label: '🗺 Strategie' },
            { href: '/content/ideeen', label: '💡 Ideeën bank' },
          ].map(tab => (
            <Link key={tab.href} href={tab.href} style={{
              padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
              background: tab.actief ? 'var(--mf-green)' : 'var(--bg-card)',
              color: tab.actief ? '#fff' : 'var(--text-2)',
              border: tab.actief ? 'none' : '1px solid var(--border)',
              boxShadow: tab.actief ? '0 2px 8px rgba(29,158,117,0.3)' : 'var(--shadow-xs)',
            }}>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Geen briefing state */}
        {!loading && !briefing && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '60px 40px', textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px' }}>
              Nog geen briefing voor vandaag
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-3)', margin: '0 0 28px' }}>
              Genereer je dagelijkse content briefing met AI. Je ontvangt 3 video-opdrachten
              die samen maximaal 15 minuten opnametijd kosten.
            </p>
            <button
              onClick={() => genereerBriefing(false)}
              disabled={genereren}
              style={{
                padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: genereren ? '#9CA3AF' : 'var(--mf-green)',
                color: '#fff', fontSize: 16, fontWeight: 800,
                boxShadow: genereren ? 'none' : '0 4px 16px rgba(29,158,117,0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {genereren ? '⚡ AI genereert...' : '⚡ Genereer vandaag briefing'}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Briefing laden...</div>
          </div>
        )}

        {/* Briefing gevonden */}
        {briefing && (
          <>
            {/* Groet banner */}
            {briefing.meta?.groet && (
              <div style={{
                background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
                borderRadius: 'var(--radius-lg)', padding: '16px 24px', marginBottom: 24,
                boxShadow: '0 4px 20px rgba(29,158,117,0.25)',
              }}>
                <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700 }}>
                  {briefing.meta.groet}
                </p>
              </div>
            )}

            {/* Stats bar */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28,
            }}>
              {[
                {
                  label: 'Totale opnametijd',
                  waarde: secNaarMinuten(briefing.totale_opnametijd_sec),
                  sub: 'max 15 minuten',
                  kleur: briefing.totale_opnametijd_sec <= 900 ? '#1D9E75' : '#E24B4A',
                  icon: '⏱',
                },
                {
                  label: 'Video\'s vandaag',
                  waarde: `${videosGefilmd} / ${videosTotaal}`,
                  sub: volledigKlaar ? 'Alles gefilmd!' : 'gefilmd',
                  kleur: volledigKlaar ? '#1D9E75' : '#185FA5',
                  icon: '🎬',
                },
                {
                  label: 'Platforms',
                  waarde: [...new Set(briefing.videos.flatMap(v => v.platform))].length.toString(),
                  sub: [...new Set(briefing.videos.flatMap(v => v.platform))].slice(0, 2).join(', '),
                  kleur: '#8B5CF6',
                  icon: '📱',
                },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '20px',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: stat.kleur, letterSpacing: '-0.02em' }}>
                    {stat.waarde}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Voortgangs balk */}
            {videosTotaal > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  height: 8, background: 'var(--bg-subtle)', borderRadius: 99,
                  border: '1px solid var(--border)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${(videosGefilmd / videosTotaal) * 100}%`,
                    background: volledigKlaar
                      ? 'var(--mf-green)'
                      : 'linear-gradient(90deg, var(--mf-green) 0%, #15785A 100%)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Video kaarten */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {briefing.videos.map(video => (
                <VideoKaart
                  key={video.nummer}
                  video={video}
                  briefingId={briefing.id}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>

            {/* Tip van de dag */}
            {briefing.meta?.tip && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '20px 24px',
                display: 'flex', alignItems: 'flex-start', gap: 16,
                boxShadow: 'var(--shadow-xs)', marginBottom: 24,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Tip van de dag
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {briefing.meta.tip}
                  </div>
                </div>
              </div>
            )}

            {/* Acties */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => genereerBriefing(true)}
                disabled={genereren}
                style={{
                  padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)',
                  cursor: genereren ? 'not-allowed' : 'pointer',
                  background: 'var(--bg-card)', color: 'var(--text-2)',
                  fontSize: 13, fontWeight: 700,
                  opacity: genereren ? 0.6 : 1,
                }}
              >
                {genereren ? '⚡ Genereren...' : '🔄 Hergeneer briefing'}
              </button>
              <Link href="/content/ideeen" style={{
                padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-2)',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                💡 Bekijk ideeën bank
              </Link>
            </div>
          </>
        )}

        {error && (
          <div style={{
            marginTop: 16, padding: '12px 16px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 10,
            fontSize: 14, color: '#E24B4A', fontWeight: 600,
          }}>
            {error}
          </div>
        )}
      </main>
    </div>
  )
}
