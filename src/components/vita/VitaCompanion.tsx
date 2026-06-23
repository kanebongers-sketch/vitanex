'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { authFetch } from '@/lib/auth-fetch'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

const HIDDEN_ROUTES = [
  '/login', '/register', '/setup', '/uitnodiging',
  '/voorwaarden', '/wachtwoord-reset', '/wachtwoord-vergeten',
  '/onboarding', '/bedankt',
]

const CACHE_KEY = 'vita-state-v1'
const CACHE_TTL = 5 * 60 * 1000

interface ReadinessData {
  score: number
  label: string
  slaap_uren: number | null
  stress_niveau: number | null
  stemming_waarde: number | null
  streak: number
  heeft_data: boolean
}

function getCached(): ReadinessData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: ReadinessData; ts: number }
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function setCache(data: ReadinessData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

function orbColor(score: number): [number, number, number] {
  if (score >= 80) return [0.114, 0.620, 0.459]
  if (score >= 60) return [0.231, 0.510, 0.965]
  if (score >= 40) return [0.949, 0.722, 0.141]
  return [0.886, 0.294, 0.290]
}

function orbIntensity(score: number): number {
  return 0.25 + (score / 100) * 0.45
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Uitstekend'
  if (score >= 70) return 'Vitaal'
  if (score >= 55) return 'Stabiel'
  if (score >= 40) return 'Aandacht'
  return 'Herstel'
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--mf-green)'
  if (score >= 55) return '#5B8DF0'
  if (score >= 40) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function vitaMessage(d: ReadinessData): string {
  if (!d.heeft_data) {
    return 'Vul je eerste check-in in — VITA leert jouw patroon kennen.'
  }
  const slaap = d.slaap_uren !== null ? Number(d.slaap_uren) : null
  const stress = d.stress_niveau
  const stemming = d.stemming_waarde
  const { score, streak } = d

  if (slaap !== null && slaap < 6) {
    return `Slaap van ${slaap.toFixed(1)}u — minder dan optimaal. Herstel staat centraal vandaag.`
  }
  if (stress !== null && stress >= 4) {
    return 'Hoog stressniveau gedetecteerd. Eén herstelmoment vandaag maakt het verschil.'
  }
  if (score >= 80) {
    if (streak >= 14) return `${streak} dagen consistentie. Jouw systeem reageert — patronen worden zichtbaar.`
    if (streak >= 7) return `${streak} dagen op rij. Het moeilijkste punt is al voorbij.`
    if (slaap !== null && slaap >= 8) return 'Uitstekende slaap. Perfecte dag voor een intensieve sessie.'
    return 'Alle signalen staan op groen. Dit is een krachtige dag.'
  }
  if (score >= 60) {
    if (slaap !== null && slaap >= 7) return 'Goed geslapen. Gebruik die energie vandaag doelbewust.'
    if (stemming !== null && stemming >= 4) return 'Positieve stemming — kleine acties vandaag bouwen morgen\'s resultaat.'
    return 'Je staat er goed voor. VITA houdt jouw patronen in de gaten.'
  }
  if (score >= 40) {
    return 'VITA monitort jouw signalen. Check je voortgang voor een persoonlijk inzicht.'
  }
  return 'Herstel heeft prioriteit vandaag. Bekijk je inzichten voor context.'
}

export default function VitaCompanion() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ReadinessData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isHidden = HIDDEN_ROUTES.some(r => pathname.startsWith(r))

  const load = useCallback(async () => {
    const cached = getCached()
    if (cached) { setData(cached); return }
    try {
      const res = await authFetch('/api/readiness')
      if (!res.ok) return
      const json = await res.json() as ReadinessData
      setData(json)
      setCache(json)
    } catch {}
  }, [])

  useEffect(() => {
    if (!isHidden) load()
  }, [isHidden, load])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (isHidden || !data) return null

  const color = orbColor(data.score)
  const intensity = orbIntensity(data.score)
  const label = scoreLabel(data.score)
  const accentColor = scoreColor(data.score)
  const message = vitaMessage(data)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 10,
      }}
    >
      {/* ── Expanded card ── */}
      {open && (
        <div
          style={{
            width: 292,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'vita-slide-up 0.22s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 16px 12px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flex: 1,
            }}>
              VITA
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                border: 'none',
                background: 'var(--bg-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-3)',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
              }}
              aria-label="Sluit VITA"
            >
              ✕
            </button>
          </div>

          {/* Orb + Score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px 12px',
          }}>
            <div style={{
              width: 80,
              height: 80,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <GlowOrb color={color} intensity={intensity + 0.1} size={90} rotate />
            </div>
            <div>
              <div style={{
                fontSize: 42,
                fontWeight: 900,
                color: 'var(--text-1)',
                letterSpacing: '-0.05em',
                lineHeight: 1,
              }}>
                {data.score}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: accentColor,
                marginTop: 3,
              }}>
                {label}
              </div>
              {data.streak > 0 && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-3)',
                  marginTop: 5,
                  fontWeight: 500,
                }}>
                  🔥 {data.streak} {data.streak === 1 ? 'dag' : 'dagen'} op rij
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div style={{
            margin: '0 14px 14px',
            padding: '11px 13px',
            background: 'var(--bg-subtle)',
            borderRadius: 12,
            fontSize: 13,
            color: 'var(--text-2)',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            "{message}"
          </div>

          {/* Chips */}
          {data.heeft_data && (
            <div style={{
              padding: '0 14px 14px',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}>
              {data.slaap_uren !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 100,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}>
                  😴 {Number(data.slaap_uren).toFixed(1)}u slaap
                </span>
              )}
              {data.stress_niveau !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 100,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}>
                  ⚡ Stress {data.stress_niveau}/5
                </span>
              )}
              {data.stemming_waarde !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 100,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}>
                  😊 Stemming {data.stemming_waarde}/5
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Orb trigger button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title="VITA — jouw gezondheidscompanion"
        aria-label="Open VITA gezondheidscompanion"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: `1.5px solid ${open ? accentColor : 'var(--border-strong)'}`,
          background: 'var(--bg-card)',
          boxShadow: open
            ? `0 8px 32px rgba(0,0,0,0.14), 0 0 24px ${accentColor}33`
            : '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          animation: 'vita-orb-appear 0.35s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <GlowOrb color={color} intensity={intensity} size={56} rotate />
      </button>
    </div>
  )
}
