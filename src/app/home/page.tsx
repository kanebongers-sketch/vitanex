'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'
import { laadXPData, pasDecayToe, berekenLevel, xpVoortgang, LEVEL_NAMEN, LEVEL_KLEUREN, LEVEL_BG, ALLE_ACHIEVEMENTS, type XPData } from '@/lib/xp'

type ScoresNieuw = { e: number; m: number; w: number; s: number; g: number; t: number }

function berekenScore(s: ScoresNieuw) { return Math.round((s.t / 5) * 100) }

function ScoreRing({ score }: { score: number }) {
  const r = 44, circ = 2 * Math.PI * r
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#F3F4F6" strokeWidth="9" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={kleur} strokeWidth="9"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="55" y="51" textAnchor="middle" fontSize="22" fontWeight="800" fill={kleur}>{score}</text>
      <text x="55" y="66" textAnchor="middle" fontSize="11" fill="#9CA3AF">/100</text>
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [laden, setLaden]                   = useState(true)
  const [naam, setNaam]                     = useState('')
  const [scores, setScores]                 = useState<ScoresNieuw | null>(null)
  const [checkInDezeWeek, setCheckInDezeWeek] = useState(false)
  const [recentCheckins, setRecentCheckins] = useState(0)
  const [xpData, setXpData]                 = useState<XPData | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('naam').eq('id', user.id).single()
      setNaam(profiel?.naam ?? '')

      // Laatste vitaliteitsscore
      const { data: analyse } = await supabase
        .from('checkin_analyses').select('scores')
        .eq('user_id', user.id).order('aangemaakt_op', { ascending: false })
        .limit(1).maybeSingle()
      if (analyse?.scores) setScores(analyse.scores as ScoresNieuw)

      // Check-in deze week (maandag = start)
      const nu = new Date()
      const dag = nu.getDay() === 0 ? 6 : nu.getDay() - 1
      const weekStart = new Date(nu)
      weekStart.setDate(nu.getDate() - dag)
      weekStart.setHours(0, 0, 0, 0)
      const { count: weekCount } = await supabase.from('checkin_sessies')
        .select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .gte('aangemaakt_op', weekStart.toISOString())
      setCheckInDezeWeek((weekCount ?? 0) > 0)

      // Check-ins afgelopen 4 weken
      const { count } = await supabase.from('checkin_sessies')
        .select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .gte('aangemaakt_op', new Date(Date.now() - 28 * 86400000).toISOString())
      setRecentCheckins(count ?? 0)

      setLaden(false)

      try {
        let xp = laadXPData()
        xp = pasDecayToe(xp)
        setXpData(xp)
      } catch { /* non-critical */ }
    }
    laad()
  }, [router])

  const score      = scores ? berekenScore(scores) : null
  const scoreKleur = !score ? '#9CA3AF' : score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const scoreLabel = !score ? '' : score >= 70 ? 'Goed op weg' : score >= 45 ? 'Aandacht nodig' : 'Zorg voor jezelf'
  const scoreTekst = !score ? '' : score >= 70
    ? 'Je scoort bovengemiddeld. Blijf zo doorgaan!'
    : score >= 45
    ? 'Sommige gebieden verdienen extra aandacht.'
    : 'Je score is laag. Praat met de AI Coach voor advies.'

  const dagtijd = (() => { const h = new Date().getHours(); return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond' })()
  const datum   = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

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
      <main style={{ padding: '36px 40px 72px' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 2 }}>
            {dagtijd}, {naam.split(' ')[0]}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 14, textTransform: 'capitalize' }}>{datum}</p>
        </div>

        {/* ── PRIMAIRE ZONE: check-in CTA of score ── */}
        {!checkInDezeWeek ? (
          /* Geen check-in deze week → grote uitnodiging */
          <div style={{
            background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)',
            borderRadius: 20, padding: '32px 36px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            boxShadow: '0 4px 24px rgba(29,158,117,0.25)',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Jouw wekelijkse check-in
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.3 }}>
                Hoe gaat het met je deze week?
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20, maxWidth: 480 }}>
                In 3 minuten krijg je een persoonlijk AI-rapport over je vitaliteit, met concrete tips voor energie, focus en werkplezier.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/checkin" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'white', color: '#0F6E56',
                  borderRadius: 12, padding: '12px 24px',
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}>
                  Start check-in
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>+75 XP na voltooiing</span>
              </div>
            </div>
            {/* Illustratie */}
            <div style={{ flexShrink: 0, opacity: 0.15 }}>
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
          </div>
        ) : (
          /* Check-in gedaan → toon score */
          <div style={{
            background: 'white', borderRadius: 20, padding: '28px 32px', marginBottom: 28,
            border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: 28,
          }}>
            {score && <ScoreRing score={score} />}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Vitaliteitsscore deze week
              </p>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: scoreKleur, marginBottom: 6, letterSpacing: '-0.02em' }}>
                {scoreLabel}
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 18, lineHeight: 1.6 }}>{scoreTekst}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/rapport" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#1D9E75', color: 'white',
                  borderRadius: 10, padding: '10px 18px',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}>
                  Bekijk rapport
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
                <Link href="/coach" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#F0F9FF', color: '#185FA5',
                  border: '1.5px solid #185FA5',
                  borderRadius: 10, padding: '10px 18px',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}>
                  Praat met AI Coach
                </Link>
                <Link href="/checkin" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#F9FAFB', color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: 10, padding: '10px 18px',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}>
                  Nieuwe check-in
                </Link>
              </div>
            </div>
            {/* Score breakdown */}
            {scores && (
              <div style={{ minWidth: 200, flexShrink: 0 }}>
                {[
                  { label: 'Energie',      v: scores.e, c: '#1D9E75' },
                  { label: 'Mentaal',      v: scores.m, c: '#378ADD' },
                  { label: 'Werk',         v: scores.w, c: '#8B5CF6' },
                  { label: 'Samenwerking', v: scores.s, c: '#B45309' },
                  { label: 'Groei',        v: scores.g, c: '#059669' },
                ].filter(d => d.v > 0).map(d => (
                  <div key={d.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{d.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: d.c }}>{d.v.toFixed(1)}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: d.c, width: `${(d.v / 5) * 100}%`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STATS + FIT LEVEL ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 14, marginBottom: 28 }}>

          {/* Check-ins */}
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Check-ins (4 weken)</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: '#185FA5', letterSpacing: '-0.03em' }}>{recentCheckins}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>van 4 mogelijk</p>
          </div>

          {/* Streak */}
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Huidige streak</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.03em' }}>{Math.min(recentCheckins, 7)}×</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>weken actief</p>
          </div>

          {/* Vitaalscore */}
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Vitaalscore</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: scoreKleur, letterSpacing: '-0.03em' }}>{score ?? '—'}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{score ? 'van 100' : 'nog geen data'}</p>
          </div>

          {/* Fit Level */}
          {xpData ? (() => {
            const level = berekenLevel(xpData.xp)
            const kleur = LEVEL_KLEUREN[level]
            const bg    = LEVEL_BG[level]
            const vrt   = xpVoortgang(xpData.xp, level)
            return (
              <Link href="/niveau" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 14, padding: '20px 22px',
                  border: `1.5px solid ${kleur}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', gap: 14, height: '100%',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: bg,
                    border: `2px solid ${kleur}40`, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: kleur, letterSpacing: '0.08em' }}>LVL</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: kleur, lineHeight: 1 }}>{level}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 3 }}>
                      Fit Level {level} — {LEVEL_NAMEN[level]}
                    </p>
                    <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: kleur, width: `${vrt.pct}%`, transition: 'width 1s ease' }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {level < 10 ? `${vrt.nodig} XP tot niveau ${level + 1} · ${xpData.xp} XP totaal` : 'Maximum bereikt!'}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            )
          })() : (
            <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Fit Level</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: '#9CA3AF' }}>—</p>
            </div>
          )}
        </div>

        {/* ── WAT KUN JE DOEN ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
            Verken de app
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              {
                href: '/doelen',
                kleur: '#7C3AED', bg: '#EDE9FE', label: 'Persoonlijke doelen',
                omschrijving: 'Stel gezondheids- en werkdoelen in en houd je voortgang bij.',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
              },
              {
                href: '/uitdagingen',
                kleur: '#B45309', bg: '#FEF3C7', label: 'Uitdagingen',
                omschrijving: 'Doe mee aan wellness-uitdagingen en bouw goede gewoonten op.',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
              },
              {
                href: '/journal',
                kleur: '#0369A1', bg: '#E0F2FE', label: 'Persoonlijk journal',
                omschrijving: 'Reflecteer op je week en schrijf je gedachten en gevoelens op.',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
              },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 16, padding: '24px',
                  border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.15s, transform 0.15s', height: '100%',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.kleur, marginBottom: 14 }}>
                    {item.icon}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{item.label}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{item.omschrijving}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── CRISIS ── */}
        <CrisisButton />

      </main>
    </div>
  )
}
