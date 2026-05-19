'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'
import { laadXPData, pasDecayToe, berekenLevel, xpVoortgang, LEVEL_NAMEN, LEVEL_KLEUREN, LEVEL_BG, ALLE_ACHIEVEMENTS, type XPData } from '@/lib/xp'

type CheckIn = {
  energie: number
  slaap: number
  mentaal_focus: number
  mentaal_balans: number
  motivatie: number
}

function berekenScore(ci: CheckIn): number {
  const w = [ci.energie, ci.slaap, ci.mentaal_focus, ci.mentaal_balans, ci.motivatie]
  return Math.round((w.reduce((a, b) => a + b, 0) / w.length) * 20)
}

function ScoreRing({ score }: { score: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={kleur} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill={kleur}>{score}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#9CA3AF">/100</text>
    </svg>
  )
}

function StatCard({ label, value, color, bg, icon }: { label: string; value: string | number; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '16px 18px',
      border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null)
  const [recentCheckins, setRecentCheckins] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xpData, setXpData] = useState<XPData | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('naam, rol, bedrijf_id').eq('id', user.id).single()

      setNaam(profiel?.naam ?? '')

      // Laatste check-in
      const { data: ci } = await supabase
        .from('checkins').select('energie, slaap, mentaal_focus, mentaal_balans, motivatie')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
      if (ci) setCheckIn(ci as CheckIn)

      // Afgelopen 4 weken check-ins
      const { count } = await supabase.from('checkins')
        .select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
      setRecentCheckins(count ?? 0)
      setStreak(Math.min(count ?? 0, 7))

      setLaden(false)

      // Load XP from localStorage (client-only)
      try {
        let xp = laadXPData()
        xp = pasDecayToe(xp)
        setXpData(xp)
      } catch { /* XP is non-critical */ }
    }
    laad()
  }, [router])

  const score = checkIn ? berekenScore(checkIn) : null
  const scoreKleur = !score ? '#9CA3AF' : score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const scoreLabel = !score ? 'Geen data' : score >= 70 ? 'Goed op weg!' : score >= 45 ? 'Aandacht nodig' : 'Zorg voor jezelf'

  const dagtijd = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond'
  })()

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>

        {/* ── GREETING ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
            {dagtijd}, {naam.split(' ')[0]}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 3 }}>
            Hier is je vitaliteitsoverzicht van vandaag.
          </p>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard
            label="Vitaalscore"
            value={score ?? '—'}
            color={scoreKleur}
            bg={!score ? '#F3F4F6' : score >= 70 ? '#E1F5EE' : score >= 45 ? '#FEF3C7' : '#FEE2E2'}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          />
          <StatCard label="Check-ins (4w)" value={recentCheckins} color="#185FA5" bg="#EFF6FF" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>} />
          <StatCard label="Week streak" value={`${streak}x`} color="#7C3AED" bg="#EDE9FE" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>} />
        </div>

        {/* ── FIT LEVEL WIDGET ── */}
        {xpData && (() => {
          const level = berekenLevel(xpData.xp)
          const kleur = LEVEL_KLEUREN[level]
          const bg    = LEVEL_BG[level]
          const vrt   = xpVoortgang(xpData.xp, level)
          const behaald = (xpData.achievements ?? []).length
          const recentAch = ALLE_ACHIEVEMENTS.filter(a => (xpData.achievements ?? []).includes(a.id)).slice(-3)
          return (
            <Link href="/niveau" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
              <div style={{
                background: 'white', borderRadius: 16, border: `1.5px solid ${kleur}30`,
                padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'box-shadow 0.15s',
              }}>
                {/* Level badge */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: bg,
                  border: `2px solid ${kleur}40`, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: kleur, letterSpacing: '0.08em' }}>LVL</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: kleur, lineHeight: 1 }}>{level}</span>
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      Fit Level {level} — {LEVEL_NAMEN[level]}
                    </p>
                    <span style={{ fontSize: 11, color: kleur, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                      {xpData.xp.toLocaleString('nl-NL')} XP
                    </span>
                  </div>
                  {/* XP bar */}
                  {level < 10 ? (
                    <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: kleur, width: `${vrt.pct}%`, transition: 'width 1s ease' }} />
                    </div>
                  ) : (
                    <div style={{ height: 6, borderRadius: 3, background: kleur, marginBottom: 6 }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {level < 10 ? `${vrt.nodig} XP tot niveau ${level + 1}` : 'Maximum bereikt!'}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {behaald}/{ALLE_ACHIEVEMENTS.length} achievements
                    </p>
                  </div>
                </div>
                {/* Arrow */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
          )
        })()}

        {/* ── MAIN CONTENT: score kaart + vitaliteit tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>

          {/* Score card */}
          <div style={{
            background: 'white', borderRadius: 16, padding: '24px',
            border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 16 }}>
              Vitaliteitsscore
            </p>
            {score ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ScoreRing score={score} />
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: scoreKleur, marginBottom: 6 }}>{scoreLabel}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginBottom: 12 }}>
                    {score < 50
                      ? 'Je score is laag. Overweeg de AI Coach te raadplegen voor persoonlijk advies.'
                      : 'Je staat er goed voor deze week. Blijf lekker zo doorgaan!'}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/rapport" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#1D9E75', color: 'white',
                      borderRadius: 8, padding: '8px 14px',
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}>
                      Bekijk rapport
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                    <Link href="/checkin" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#F0FDF8', color: '#1D9E75',
                      border: '1.5px solid #1D9E75',
                      borderRadius: 8, padding: '8px 14px',
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}>
                      Nieuwe check-in
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 16, background: '#F0FDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D9E75', flexShrink: 0 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Nog geen check-in gedaan</p>
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Doe je eerste check-in en ontdek je vitaliteitsscore.</p>
                  <Link href="/checkin" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#1D9E75', color: 'white',
                    borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}>
                    Start check-in →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Score per dimensie */}
          {checkIn && (
            <div style={{
              background: 'white', borderRadius: 16, padding: '20px',
              border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
                Per dimensie
              </p>
              {[
                { label: 'Energie',   value: checkIn.energie,        color: '#F59E0B', bg: '#FEF3C7' },
                { label: 'Slaap',     value: checkIn.slaap,          color: '#185FA5', bg: '#EFF6FF' },
                { label: 'Focus',     value: checkIn.mentaal_focus,  color: '#7C3AED', bg: '#EDE9FE' },
                { label: 'Balans',    value: checkIn.mentaal_balans, color: '#1D9E75', bg: '#E1F5EE' },
                { label: 'Motivatie', value: checkIn.motivatie,      color: '#EF4444', bg: '#FEE2E2' },
              ].map(d => (
                <div key={d.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{d.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}/5</p>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: d.color, width: `${(d.value / 5) * 100}%`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SNELLE ACTIES ── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
            Snelle acties
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {([
              { href: '/checkin',     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, label: 'Check-in',    color: '#1D9E75', bg: '#E1F5EE' },
              { href: '/coach',       icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>, label: 'AI Coach',    color: '#185FA5', bg: '#EFF6FF' },
              { href: '/doelen',      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, label: 'Doelen',      color: '#7C3AED', bg: '#EDE9FE' },
              { href: '/uitdagingen', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>, label: 'Uitdagingen', color: '#B45309', bg: '#FEF3C7' },
              { href: '/journal',     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>, label: 'Journal',     color: '#0369A1', bg: '#E0F2FE' },
              { href: '/burnout',     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.657 18.657A8 8 0 0 1 6.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0 1 20 13a7.975 7.975 0 0 1-2.343 5.657z"/><path d="M9.879 16.121A3 3 0 1 0 12.99 12L11 14"/></svg>, label: 'Burn-out',    color: '#DC2626', bg: '#FEE2E2' },
              { href: '/focus',       icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>, label: 'Focus',       color: '#065F46', bg: '#ECFDF5' },
              { href: '/rapport',     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/></svg>, label: 'Rapport',     color: '#374151', bg: '#F3F4F6' },
            ] as { href: string; icon: React.ReactNode; label: string; color: string; bg: string }[]).map(item => (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'white', borderRadius: 12, padding: '16px 8px',
                border: '1px solid #E5E7EB', textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  {item.icon}
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{item.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Crisis */}
        <div style={{ maxWidth: 400 }}>
          <CrisisButton />
        </div>

      </main>
    </div>
  )
}
