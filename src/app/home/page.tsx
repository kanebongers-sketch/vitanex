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

const VLAK_KLEUR: Record<string, string> = {
  slaap: '#8B5CF6', stress: '#E24B4A', energie: '#BA7517',
  focus: '#1D9E75', balans: '#378ADD', motivatie: '#9D174D',
}

function fmtDatum(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function WeekKalender({ weekSelectie, vandaagStr }: { weekSelectie: WeekSelectie; vandaagStr: string }) {
  const aantalDoelen = weekSelectie.doelen.length

  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekSelectie.weekStart)
    d.setDate(d.getDate() + i)
    const datum   = fmtDatum(d)
    const dagKort = d.toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '').slice(0, 2)
    const dagNr   = d.getDate()

    const gehaaldCount = weekSelectie.doelen.filter(doel =>
      doel.logs.some(l => l.datum === datum && l.gehaald)
    ).length
    const gelogdCount = weekSelectie.doelen.filter(doel =>
      doel.logs.some(l => l.datum === datum)
    ).length

    const isVandaag   = datum === vandaagStr
    const isVerleden  = datum < vandaagStr

    let accentKleur = '#D1D5DB'
    let accentBg    = 'transparent'
    let accentTekst = '#9CA3AF'
    if (aantalDoelen > 0 && gehaaldCount === aantalDoelen) {
      accentKleur = '#1D9E75'; accentBg = '#E1F5EE'; accentTekst = '#0F6E56'
    } else if (gehaaldCount > 0) {
      accentKleur = '#F59E0B'; accentBg = '#FEF3C7'; accentTekst = '#854F0B'
    } else if (gelogdCount > 0) {
      accentKleur = '#E24B4A'; accentBg = '#FEF2F2'; accentTekst = '#A32D2D'
    } else if (isVerleden && aantalDoelen > 0) {
      accentKleur = '#E5E7EB'; accentBg = 'transparent'; accentTekst = '#D1D5DB'
    }

    return { datum, dagKort, dagNr, gehaaldCount, gelogdCount, isVandaag, isVerleden, accentKleur, accentBg, accentTekst }
  })

  const eindDatum = new Date(weekSelectie.weekStart)
  eindDatum.setDate(eindDatum.getDate() + 6)
  const startD    = new Date(weekSelectie.weekStart)
  const weekLabel = `${startD.getDate()} – ${eindDatum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}`

  const totaalGehaald = weekSelectie.doelen.reduce((acc, doel) =>
    acc + doel.logs.filter(l => l.gehaald).length, 0)
  const maxMogelijk = aantalDoelen * 7

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 13px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF', marginBottom: 1 }}>Week overzicht</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{weekLabel}</p>
        </div>
        {maxMogelijk > 0 && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#1D9E75', lineHeight: 1 }}>{totaalGehaald}</p>
            <p style={{ fontSize: 10, color: '#9CA3AF' }}>van {maxMogelijk} doelen</p>
          </div>
        )}
      </div>

      {/* Day strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '16px 10px 14px', gap: 4 }}>
        {dagen.map(dag => (
          <div key={dag.datum} style={{
            textAlign: 'center',
            padding: '10px 3px 11px',
            borderRadius: 14,
            background: dag.isVandaag ? dag.accentBg || '#F0FAF6' : dag.accentBg,
            border: dag.isVandaag ? `2px solid ${dag.accentKleur === '#D1D5DB' ? '#1D9E75' : dag.accentKleur}` : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: dag.isVandaag ? (dag.accentKleur === '#D1D5DB' ? '#1D9E75' : dag.accentKleur) : '#B0B7C3', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {dag.dagKort}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: dag.isVandaag ? '#111827' : dag.isVerleden && dag.gehaaldCount === 0 && dag.gelogdCount === 0 ? '#D1D5DB' : '#374151', marginBottom: 8 }}>
              {dag.dagNr}
            </p>
            {/* Completion dots — one per goal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              {aantalDoelen > 0 ? weekSelectie.doelen.map((doel, di) => {
                const log    = doel.logs.find(l => l.datum === dag.datum)
                const gehaald = log?.gehaald === true
                const gelogd  = !!log
                const kleur   = VLAK_KLEUR[doel.vlak] ?? '#9CA3AF'
                return (
                  <div key={di} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: gehaald ? kleur : gelogd ? '#FEE2E2' : '#F3F4F6',
                    border: gelogd && !gehaald ? `1px solid ${kleur}60` : 'none',
                    transition: 'background 0.2s',
                  }} />
                )
              }) : (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F3F4F6' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Goal progress bars */}
      {aantalDoelen > 0 && (
        <div style={{ padding: '14px 18px 18px', borderTop: '1px solid #F3F4F6' }}>
          {weekSelectie.doelen.map((doel, idx) => {
            const kleur        = VLAK_KLEUR[doel.vlak] ?? '#9CA3AF'
            const aantalGehaald = doel.logs.filter(l => l.gehaald).length
            const pct          = (aantalGehaald / 7) * 100
            return (
              <div key={doel.vlak} style={{ marginBottom: idx < weekSelectie.doelen.length - 1 ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: kleur, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{doel.doel_titel}</p>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: aantalGehaald > 0 ? kleur : '#9CA3AF', flexShrink: 0, marginLeft: 8 }}>{aantalGehaald}/7</p>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: kleur, width: `${pct}%`, transition: 'width 1s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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

        {/* ── WEEK KALENDER ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
              Doelen & progressie
            </p>
            <Link href="/doelen" style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>
              Loggen →
            </Link>
          </div>
          {weekSelectie ? (
            <WeekKalender weekSelectie={weekSelectie} vandaagStr={weekVandaag()} />
          ) : (
            <Link href="/checkin" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', borderRadius: 16, padding: '18px 20px',
                border: '2px dashed #E5E7EB',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#1D9E75' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Start je eerste check-in</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>Vul je check-in in — kies dan je weekdoelen</p>
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
