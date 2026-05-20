'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'
import { laadXPData, pasDecayToe, berekenLevel, xpVoortgang, LEVEL_NAMEN, LEVEL_KLEUREN, LEVEL_BG, type XPData } from '@/lib/xp'
import { laadWeekSelectie, isVandaagGelogd, vandaag as weekVandaag, type WeekSelectie } from '@/lib/weekdoelen'
import { CAT } from '@/lib/doelen-config'

function berekenScore(s: Record<string, number>) {
  const vals = Object.values(s).filter(v => v > 0)
  if (!vals.length) return 0
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(((avg - 4) / 16) * 100)
}

function ScoreRing({ score }: { score: number }) {
  const r = 36, circ = 2 * Math.PI * r
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
      <circle cx="45" cy="45" r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={kleur} strokeWidth="7"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 45 45)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="45" y="41" textAnchor="middle" fontSize="19" fontWeight="800" fill={kleur}>{score}</text>
      <text x="45" y="55" textAnchor="middle" fontSize="10" fill="#9CA3AF">/100</text>
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [laden, setLaden]                   = useState(true)
  const [naam, setNaam]                     = useState('')
  const [scores, setScores]                 = useState<Record<string, number> | null>(null)
  const [checkInDezeWeek, setCheckInDezeWeek] = useState(false)
  const [recentCheckins, setRecentCheckins] = useState(0)
  const [xpData, setXpData]                 = useState<XPData | null>(null)
  const [weekSelectie, setWeekSelectie]     = useState<WeekSelectie | null>(null)
  const [vlakScores, setVlakScores]         = useState<Record<string, number> | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('naam').eq('id', user.id).single()
      setNaam(profiel?.naam ?? '')

      const { data: analyse } = await supabase
        .from('checkin_analyses').select('scores, analyse_json')
        .eq('user_id', user.id).order('aangemaakt_op', { ascending: false })
        .limit(1).maybeSingle()
      if (analyse?.scores) {
        const s = analyse.scores as Record<string, number>
        setScores(s)
        if (Object.values(s).some(v => v > 0)) setVlakScores(s)
      }

      const zevenDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: weekCount } = await supabase.from('checkin_sessies')
        .select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .gte('aangemaakt_op', zevenDagenGeleden)
      if ((weekCount ?? 0) === 0) { router.push('/checkin'); return }
      setCheckInDezeWeek(true)

      const { count } = await supabase.from('checkin_sessies')
        .select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .gte('aangemaakt_op', new Date(Date.now() - 28 * 86400000).toISOString())
      setRecentCheckins(count ?? 0)

      setLaden(false)

      try { let xp = laadXPData(); xp = pasDecayToe(xp); setXpData(xp) } catch { /* non-critical */ }
      try { setWeekSelectie(laadWeekSelectie()) } catch { /* non-critical */ }
    }
    laad()
  }, [router])

  const score       = scores ? berekenScore(scores) : null
  const scoreKleur  = !score ? '#9CA3AF' : score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const scoreLabelStr = !score ? 'Nog geen score' : score >= 70 ? 'Goed op weg' : score >= 45 ? 'Aandacht nodig' : 'Zorg voor jezelf'
  const dagtijd    = (() => { const h = new Date().getHours(); return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond' })()
  const datum      = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

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
      <main style={{ padding: '28px 40px 72px' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>
            {dagtijd}, {naam.split(' ')[0]}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 13, textTransform: 'capitalize' }}>{datum}</p>
        </div>

        {/* ── PRIMAIRE ACTIE ── */}
        {!checkInDezeWeek ? (
          <div style={{
            background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)',
            borderRadius: 20, padding: '24px 28px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
            boxShadow: '0 4px 20px rgba(29,158,117,0.25)',
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Wekelijkse check-in
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 14 }}>
                Hoe gaat het met je deze week?
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link href="/checkin" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'white', color: '#0F6E56',
                  borderRadius: 10, padding: '10px 20px',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}>
                  Start check-in
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>+75 XP</span>
              </div>
            </div>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 20, padding: '20px 24px', marginBottom: 20,
            border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 20,
          }}>
            {score && <ScoreRing score={score} />}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                Vitaliteitsscore
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: scoreKleur, marginBottom: 14, letterSpacing: '-0.02em' }}>
                {scoreLabelStr}
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/rapport" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1D9E75', color: 'white', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Bekijk rapport
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
                <Link href="/coach" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E6F1FB', color: '#185FA5', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  AI Coach
                </Link>
                <Link href="/checkin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Nieuwe check-in
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Check-ins</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#185FA5' }}>{recentCheckins}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>afgelopen 4 weken</p>
          </div>
          <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Vitaalscore</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: scoreKleur }}>{score ?? '—'}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{score ? 'van 100' : 'nog geen data'}</p>
          </div>
          <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Doelen</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#7C3AED' }}>{weekSelectie ? weekSelectie.doelen.length : 0}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>actief deze week</p>
          </div>
          {xpData ? (() => {
            const level = berekenLevel(xpData.xp)
            const kleur = LEVEL_KLEUREN[level]
            const bg    = LEVEL_BG[level]
            const vrt   = xpVoortgang(xpData.xp, level)
            return (
              <Link href="/niveau" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${kleur}30`, height: '100%', boxSizing: 'border-box' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fit Level</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `2px solid ${kleur}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: kleur, lineHeight: 1 }}>{level}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{LEVEL_NAMEN[level]}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: kleur, width: `${vrt.pct}%`, transition: 'width 1s ease' }} />
                  </div>
                </div>
              </Link>
            )
          })() : (
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fit Level</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#9CA3AF' }}>—</p>
            </div>
          )}
        </div>

        {/* ── WELZIJN PER VLAK ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
              Welzijn per vlak
            </p>
            <Link href="/rapport" style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>Volledig rapport →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {Object.entries(CAT).map(([vlak, c]) => {
              const score = vlakScores?.[vlak] ?? 0
              const pct = score > 0 ? Math.round(((score - 4) / 16) * 100) : 0
              const bar = score >= 16 ? '#1D9E75' : score >= 12 ? '#B45309' : score >= 8 ? '#E26B4A' : score > 0 ? '#E24B4A' : '#E5E7EB'
              return (
                <Link key={vlak} href="/doelen" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white', borderRadius: 14, padding: '12px 8px',
                    border: `1.5px solid ${score > 0 ? bar + '30' : '#E5E7EB'}`,
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: score > 0 ? c.bg : '#F9FAFB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: score > 0 ? c.kleur : '#D1D5DB', margin: '0 auto 6px',
                    }}>
                      <span style={{ transform: 'scale(0.75)', display: 'flex' }}>{c.icon}</span>
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#374151', marginBottom: 5 }}>{c.label}</p>
                    <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: bar, width: `${pct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                    {score > 0
                      ? <span style={{ fontSize: 9, fontWeight: 700, color: bar }}>{score}/20</span>
                      : <span style={{ fontSize: 9, color: '#D1D5DB' }}>—</span>
                    }
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── DOELEN DEZE WEEK ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
              Doelen deze week
            </p>
            <Link href="/doelen" style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>
              {weekSelectie ? 'Bekijk alles →' : 'Doe check-in →'}
            </Link>
          </div>
          {weekSelectie ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {weekSelectie.doelen.map(doel => {
                const c = CAT[doel.vlak]
                const gelogd = isVandaagGelogd(doel)
                const log = doel.logs.find(l => l.datum === weekVandaag())
                const gehaald = log?.gehaald === true
                const weekDagen = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(weekSelectie.weekStart)
                  d.setDate(d.getDate() + i)
                  return d.toISOString().slice(0, 10)
                })
                const aantalGehaald = weekDagen.filter(dag => {
                  const l = doel.logs.find(x => x.datum === dag)
                  return l?.gehaald === true
                }).length
                return (
                  <Link key={doel.vlak} href="/doelen" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'white', borderRadius: 16,
                      border: `2px solid ${gelogd ? c.kleur + '50' : '#E5E7EB'}`,
                      padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.kleur }}>
                            <span style={{ transform: 'scale(0.7)', display: 'flex' }}>{c.icon}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.kleur }}>{c.label}</span>
                        </div>
                        {gelogd && (
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: gehaald ? c.kleur : '#F3F4F6', border: `2px solid ${gehaald ? c.kleur : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={gehaald ? 'white' : '#9CA3AF'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8, lineHeight: 1.3 }}>{doel.doel_titel}</p>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {weekDagen.map((dag, i) => {
                          const l = doel.logs.find(x => x.datum === dag)
                          const ok = l?.gehaald === true
                          const isVandaagDag = dag === weekVandaag()
                          return (
                            <div key={i} style={{
                              flex: 1, height: 5, borderRadius: 2,
                              background: ok ? c.kleur : '#F3F4F6',
                              border: isVandaagDag && !gelogd ? `1px solid ${c.kleur}` : 'none',
                            }} />
                          )
                        })}
                      </div>
                      <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{aantalGehaald}/7 dagen</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Link href="/doelen" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', borderRadius: 16, padding: '18px 20px',
                border: '2px dashed #E5E7EB',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#1D9E75' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Nog geen doelen voor deze week</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>Doe een check-in — de AI kiest je doelen</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>
          )}
        </div>

        {/* ── SNELLE ACTIES ── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
            Snelle acties
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { href: '/coach',       kleur: '#185FA5', bg: '#E6F1FB', label: 'AI Coach',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/></svg> },
              { href: '/journal',     kleur: '#0369A1', bg: '#E0F2FE', label: 'Journal',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
              { href: '/uitdagingen', kleur: '#B45309', bg: '#FEF3C7', label: 'Uitdagingen', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
              { href: '/surveys',     kleur: '#7C3AED', bg: '#EDE9FE', label: 'Surveys',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg> },
              { href: '/focus',       kleur: '#059669', bg: '#D1FAE5', label: 'Focus',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
              { href: '/nieuws',      kleur: '#6B7280', bg: '#F3F4F6', label: 'Nieuws',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg> },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', flex: 1 }}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: '12px 10px',
                  border: '1px solid #E5E7EB', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.kleur }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{item.label}</span>
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
