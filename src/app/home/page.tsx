'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'
import MoodPulse from '@/components/MoodPulse'
import { laadXPData, pasDecayToe, berekenLevel, xpVoortgang, LEVEL_NAMEN, LEVEL_KLEUREN, LEVEL_BG, type XPData } from '@/lib/xp'
import { laadWeekSelectie, vandaag as weekVandaag, type WeekSelectie } from '@/lib/weekdoelen'
import { CAT } from '@/lib/doelen-config'

// Domain codes — sum of these 4 scale questions = 4-20 per domain
const DOMEIN_CODES: Record<string, string[]> = {
  slaap:    ['slaap_kwaliteit', 'slaap_uren', 'slaap_fris', 'slaap_loslaten'],
  stress:   ['stress_niveau', 'stress_piekeren', 'stress_controle', 'stress_ontspanning'],
  energie:  ['energie_niveau', 'energie_beweging', 'energie_voeding', 'energie_dip'],
  focus:    ['focus_concentratie', 'focus_helderheid', 'focus_aanwezig', 'focus_flow'],
  balans:   ['balans_werk_prive', 'balans_grenzen', 'balans_tijd', 'balans_herstel'],
  motivatie:['motivatie_werk', 'motivatie_zinvol', 'motivatie_enthousiasme', 'motivatie_waardering'],
}

const VLAK_KLEUR: Record<string, string> = {
  slaap: '#8B5CF6', stress: '#E24B4A', energie: '#BA7517',
  focus: '#1D9E75', balans: '#378ADD', motivatie: '#9D174D',
}

function fmtDatum(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function berekenVitaalScore(domeinScores: Record<string, number>): number {
  const vals = Object.values(domeinScores).filter(v => v > 0)
  if (!vals.length) return 0
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(((avg - 4) / 16) * 100)
}

function ScoreRing({ score }: { score: number }) {
  const r = 36, circ = 2 * Math.PI * r
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }} role="img" aria-label={`Vitaliteitsscore: ${score} van 100`}>
      <circle cx="45" cy="45" r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={kleur} strokeWidth="7"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 45 45)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="45" y="41" textAnchor="middle" fontSize="19" fontWeight="800" fill={kleur}>{score}</text>
      <text x="45" y="55" textAnchor="middle" fontSize="10" fill="#9CA3AF">/100</text>
    </svg>
  )
}

function WeekKalender({ weekSelectie, vandaagStr }: { weekSelectie: WeekSelectie; vandaagStr: string }) {
  const aantalDoelen = weekSelectie.doelen.length
  const [wy, wm, wd] = weekSelectie.weekStart.split('-').map(Number)
  const weekBasis = new Date(wy, wm - 1, wd)

  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekBasis)
    d.setDate(weekBasis.getDate() + i)
    const datum   = fmtDatum(d)
    const dagKort = d.toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '').slice(0, 2)
    const dagNr   = d.getDate()
    const gehaaldCount = weekSelectie.doelen.filter(doel => doel.logs.some(l => l.datum === datum && l.gehaald)).length
    const gelogdCount  = weekSelectie.doelen.filter(doel => doel.logs.some(l => l.datum === datum)).length
    const isVandaag  = datum === vandaagStr
    const isVerleden = datum < vandaagStr
    let accentKleur = '#D1D5DB', accentBg = 'transparent'
    if (aantalDoelen > 0 && gehaaldCount === aantalDoelen) { accentKleur = '#1D9E75'; accentBg = '#E1F5EE' }
    else if (gehaaldCount > 0)                             { accentKleur = '#F59E0B'; accentBg = '#FEF3C7' }
    else if (gelogdCount > 0)                              { accentKleur = '#E24B4A'; accentBg = '#FEF2F2' }
    return { datum, dagKort, dagNr, gehaaldCount, gelogdCount, isVandaag, isVerleden, accentKleur, accentBg }
  })

  const eindDatum = new Date(weekBasis); eindDatum.setDate(weekBasis.getDate() + 6)
  const weekLabel = `${weekBasis.getDate()} – ${eindDatum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}`
  const totaalGehaald = weekSelectie.doelen.reduce((acc, d) => acc + d.logs.filter(l => l.gehaald).length, 0)
  const maxMogelijk = aantalDoelen * 7

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '16px 10px 14px', gap: 4 }}>
        {dagen.map(dag => (
          <div key={dag.datum} style={{
            textAlign: 'center', padding: '10px 3px 11px', borderRadius: 14,
            background: dag.isVandaag ? dag.accentBg || '#F0FAF6' : dag.accentBg,
            border: dag.isVandaag ? `2px solid ${dag.accentKleur === '#D1D5DB' ? '#1D9E75' : dag.accentKleur}` : '2px solid transparent',
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: dag.isVandaag ? (dag.accentKleur === '#D1D5DB' ? '#1D9E75' : dag.accentKleur) : '#B0B7C3', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {dag.dagKort}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: dag.isVandaag ? '#111827' : dag.isVerleden && dag.gehaaldCount === 0 && dag.gelogdCount === 0 ? '#D1D5DB' : '#374151', marginBottom: 8 }}>
              {dag.dagNr}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              {aantalDoelen > 0 ? weekSelectie.doelen.map((doel) => {
                const log = doel.logs.find(l => l.datum === dag.datum)
                const kleur = VLAK_KLEUR[doel.vlak] ?? '#9CA3AF'
                return (
                  <div key={doel.vlak} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: log?.gehaald ? kleur : log ? '#FEE2E2' : '#F3F4F6',
                    border: log && !log.gehaald ? `1px solid ${kleur}60` : 'none',
                  }} />
                )
              }) : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F3F4F6' }} />}
            </div>
          </div>
        ))}
      </div>
      {aantalDoelen > 0 && (
        <div style={{ padding: '14px 18px 18px', borderTop: '1px solid #F3F4F6' }}>
          {weekSelectie.doelen.map((doel) => {
            const kleur = VLAK_KLEUR[doel.vlak] ?? '#9CA3AF'
            const aantalGehaald = doel.logs.filter(l => l.gehaald).length
            const pct = (aantalGehaald / 7) * 100
            return (
              <Link key={doel.vlak} href="/doelen" style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: kleur, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{doel.doel_titel}</p>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: aantalGehaald > 0 ? kleur : '#9CA3AF' }}>{aantalGehaald}/7</p>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: '#F3F4F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${kleur}cc, ${kleur})`, width: `${pct}%`, transition: 'width 1s ease' }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [laden, setLaden]               = useState(true)
  const [naam, setNaam]                 = useState('')
  const [userId, setUserId]             = useState<string | null>(null)
  const [sessieId, setSessieId]         = useState<string | null>(null)
  const [vlakScores, setVlakScores]     = useState<Record<string, number> | null>(null)
  const [recentCheckins, setRecentCheckins] = useState(0)
  const [xpData, setXpData]             = useState<XPData | null>(null)
  const [weekSelectie, setWeekSelectie] = useState<WeekSelectie | null>(null)
  const [aiSamenvatting, setAiSamenvatting] = useState<string | null>(null)
  const [discProfiel, setDiscProfiel]       = useState<{ primair: string } | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Profile — check onboarding
      const { data: profiel } = await supabase
        .from('profiles').select('naam, onboarding_voltooid').eq('id', user.id).single()

      if (!profiel?.onboarding_voltooid) {
        router.replace('/onboarding')
        return
      }

      setNaam(profiel?.naam ?? '')

      // Most recent session (7 days) — if none, send to check-in
      const zevenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: sessie } = await supabase
        .from('checkin_sessies')
        .select('id')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', zevenGeleden)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!sessie) { router.push('/checkin'); return }
      setSessieId(sessie.id)

      // Count check-ins in last 28 days
      const { count } = await supabase
        .from('checkin_sessies')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('aangemaakt_op', new Date(Date.now() - 28 * 86400000).toISOString())
      setRecentCheckins(count ?? 0)

      // Load domain scores from checkin_antwoorden — always available after check-in
      const { data: antwoorden } = await supabase
        .from('checkin_antwoorden')
        .select('vraag_code, waarde_schaal')
        .eq('sessie_id', sessie.id)
        .not('waarde_schaal', 'is', null)

      if (antwoorden?.length) {
        const codeMap: Record<string, number> = {}
        for (const r of antwoorden) {
          if (r.waarde_schaal != null) codeMap[r.vraag_code] = Number(r.waarde_schaal)
        }
        const domeinScores: Record<string, number> = {}
        for (const [domein, codes] of Object.entries(DOMEIN_CODES)) {
          domeinScores[domein] = codes.reduce((acc, c) => acc + (codeMap[c] ?? 0), 0)
        }
        if (Object.values(domeinScores).some(v => v > 0)) {
          setVlakScores(domeinScores)
        }
      }

      setLaden(false)

      // XP (localStorage)
      try { let xp = laadXPData(); xp = pasDecayToe(xp); setXpData(xp) } catch { /* ok */ }

      // Week goals (localStorage)
      try { setWeekSelectie(laadWeekSelectie()) } catch { /* ok */ }

      // AI summary from checkin_analyses (bonus, non-blocking)
      try {
        const { data: analyse } = await supabase
          .from('checkin_analyses')
          .select('analyse_json')
          .eq('user_id', user.id)
          .order('aangemaakt_op', { ascending: false })
          .limit(1)
          .maybeSingle()
        const aj = analyse?.analyse_json as { samenvatting?: string } | null
        if (aj?.samenvatting) setAiSamenvatting(aj.samenvatting)
      } catch { /* ok */ }

      // DISC profiel (bonus, non-blocking)
      try {
        const { data: disc } = await supabase
          .from('disc_inzendingen')
          .select('primair')
          .eq('user_id', user.id)
          .order('aangemaakt_op', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (disc?.primair) setDiscProfiel({ primair: disc.primair as string })
      } catch { /* ok */ }
    }
    laad()
  }, [router])

  const vitaalScore  = vlakScores ? berekenVitaalScore(vlakScores) : null
  const scoreKleur   = !vitaalScore ? '#9CA3AF' : vitaalScore >= 70 ? '#1D9E75' : vitaalScore >= 45 ? '#F59E0B' : '#EF4444'
  const scoreLabelStr = !vitaalScore ? '—' : vitaalScore >= 70 ? 'Goed op weg' : vitaalScore >= 45 ? 'Aandacht nodig' : 'Zorg voor jezelf'
  const dagtijd = (() => { const h = new Date().getHours(); return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond' })()
  const datum   = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  // Bereken huidige streak van dagelijkse doellog events uit XP history
  const huidigeStreak = (() => {
    if (!xpData?.history?.length) return 0
    const vandaagStr = weekVandaag()
    const gelogdeDagen = new Set(
      xpData.history
        .filter(e => e.type === 'goal' && e.xp > 0)
        .map(e => e.datum)
    )
    let streak = 0
    const d = new Date(vandaagStr)
    while (true) {
      const key = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
      if (!gelogdeDagen.has(key)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  })()

  // Check-in CTA: heeft de gebruiker vandaag al doelen gelogd?
  const heeftVandaagGelogd = (() => {
    if (!weekSelectie?.doelen.length) return false
    const vd = weekVandaag()
    return weekSelectie.doelen.some(d => d.logs.some(l => l.datum === vd))
  })()

  // Weken-streak: aaneengesloten weken met minimaal 1 check-in
  const wekenStreak = (() => {
    if (!xpData?.history?.length) return 0
    const checkinDagen = new Set(
      xpData.history.filter(e => e.type === 'checkin').map(e => e.datum.slice(0, 10))
    )
    let weken = 0
    const nu = new Date(weekVandaag())
    while (weken < 52) {
      const dag = nu.getDay()
      const maandag = new Date(nu)
      maandag.setDate(nu.getDate() - (dag === 0 ? 6 : dag - 1) - weken * 7)
      const weekDagen = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(maandag); d.setDate(maandag.getDate() + i)
        return fmtDatum(d)
      })
      if (!weekDagen.some(d => checkinDagen.has(d))) break
      weken++
    }
    return weken
  })()

  // Build doelkeuze URL for when goals haven't been selected yet
  const doelkeuzeUrl = vlakScores && sessieId
    ? `/doelkeuze?${new URLSearchParams({ ...Object.fromEntries(Object.entries(vlakScores).map(([k, v]) => [k, String(v)])), sid: sessieId }).toString()}`
    : '/checkin'

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
      <main className="mf-page-main" style={{ padding: '24px 20px 88px', maxWidth: 900, margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>
              {dagtijd}, {naam.split(' ')[0]}
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: 13, textTransform: 'capitalize', marginTop: 2 }}>{datum}</p>
            {vitaalScore !== null && (
              <p style={{ fontSize: 12, color: scoreKleur, fontWeight: 600, marginTop: 4 }}>
                {vitaalScore >= 70 ? 'Je bent lekker bezig — houd het vast!' : vitaalScore >= 45 ? 'Je bent er bijna — een klein zetje maakt het verschil.' : 'Vandaag is een goed moment om voor jezelf te zorgen.'}
              </p>
            )}
          </div>
          {huidigeStreak >= 2 && (
            <Link href="/doelen" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: huidigeStreak >= 7 ? '#FEF3C7' : '#FFF7ED',
                border: `1.5px solid ${huidigeStreak >= 7 ? '#F59E0B' : '#FB923C'}`,
                borderRadius: 12, padding: '7px 13px',
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>🔥</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: huidigeStreak >= 7 ? '#B45309' : '#C2410C' }}>
                  {huidigeStreak} {huidigeStreak === 1 ? 'dag' : 'dagen'} op rij
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* ── QUICK CHECK-IN CTA ── */}
        {weekSelectie && weekSelectie.doelen.length > 0 && !heeftVandaagGelogd && (
          <Link href="/doelen" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
            <div style={{
              background: 'linear-gradient(135deg, #E1F5EE 0%, #D1FAE5 100%)',
              borderRadius: 16, padding: '16px 20px',
              border: '1.5px solid #6EE7B7',
              display: 'flex', alignItems: 'center', gap: 14,
              animation: 'pulse-border 2s ease-in-out infinite',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#065F46', marginBottom: 2 }}>Log je doelen van vandaag</p>
                <p style={{ fontSize: 12, color: '#059669' }}>Je hebt {weekSelectie.doelen.length} actieve weekdoel{weekSelectie.doelen.length !== 1 ? 'en' : ''} — even inchecken!</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </Link>
        )}

        {/* ── VITALITEITSSCORE KAART ── */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '20px 24px', marginBottom: 20,
          border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {vitaalScore !== null && <ScoreRing score={vitaalScore} />}
          {vitaalScore === null && (
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#F9FAFB', border: '2px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 22, color: '#D1D5DB' }}>—</span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Vitaliteitsscore
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: scoreKleur, marginBottom: 4, letterSpacing: '-0.02em' }}>
              {scoreLabelStr}
            </h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
              {vitaalScore !== null
                ? vitaalScore >= 70 ? 'Je doet het goed. Blijf op koers!'
                  : vitaalScore >= 45 ? 'Een paar vlakken verdienen wat aandacht.'
                  : 'Besteed extra zorg aan je welzijn deze week.'
                : 'Vul je check-in in om je score te zien.'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
              <Link href="/rapport" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1D9E75', color: 'white', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'transform 0.1s ease, opacity 0.1s ease' }}
                onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'}
                onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>
                Bekijk rapport
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
              <Link href="/coach" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E6F1FB', color: '#185FA5', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'transform 0.1s ease' }}
                onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'}
                onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>
                AI Coach
              </Link>
              <Link href="/checkin" style={{ display: 'none' }}>
                Nieuwe check-in
              </Link>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="mf-stat-card" style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB', transition: 'transform 0.18s ease, box-shadow 0.18s ease', cursor: 'default' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Check-ins</p>
            <p style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, #1D4ED8, #185FA5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{recentCheckins}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>afgelopen 4 weken</p>
          </div>
          <div className="mf-stat-card" style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB', transition: 'transform 0.18s ease, box-shadow 0.18s ease', cursor: 'default' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Vitaalscore</p>
            <p style={{ fontSize: 26, fontWeight: 800, ...(vitaalScore !== null ? { background: `linear-gradient(135deg, ${scoreKleur}cc, ${scoreKleur})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: '#9CA3AF' }) }}>{vitaalScore ?? '—'}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{vitaalScore !== null ? 'van 100' : 'nog geen data'}</p>
          </div>
          <div className="mf-stat-card" style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB', transition: 'transform 0.18s ease, box-shadow 0.18s ease', cursor: 'default' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Doelen</p>
            <p style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, #9333EA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{weekSelectie?.doelen.length ?? 0}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>actief deze week</p>
          </div>
          {xpData ? (() => {
            const level = berekenLevel(xpData.xp)
            const kleur = LEVEL_KLEUREN[level]
            const bg    = LEVEL_BG[level]
            const vrt   = xpVoortgang(xpData.xp, level)
            return (
              <Link href="/niveau" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${kleur}30`, height: '100%', boxSizing: 'border-box', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fit Level</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `2px solid ${kleur}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: kleur, lineHeight: 1 }}>{level}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{LEVEL_NAMEN[level]}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 9999, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${kleur}99, ${kleur})`, width: `${vrt.pct}%`, transition: 'width 1s ease' }} />
                  </div>
                  {wekenStreak >= 2 && (
                    <p style={{ fontSize: 9, color: kleur, fontWeight: 700, marginTop: 4, textAlign: 'right' }}>
                      🔥 {wekenStreak}w streak
                    </p>
                  )}
                </div>
              </Link>
            )
          })() : (
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fit Level</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#9CA3AF' }}>—</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>doe een check-in</p>
            </div>
          )}
        </div>

        {/* ── DAGELIJKSE PULSE ── */}
        {userId && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
              Dagelijkse pulse
            </p>
            <MoodPulse userId={userId} />
          </div>
        )}

        {/* ── WELZIJN PER VLAK ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
              Welzijn per vlak
            </p>
            <Link href="/rapport" style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>Volledig rapport →</Link>
          </div>

          {aiSamenvatting && (
            <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #E5E7EB', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.55, flex: 1 }}>{aiSamenvatting}</p>
            </div>
          )}

          <div className="domein-grid">
            {Object.entries(CAT).map(([vlak, c]) => {
              const s = vlakScores?.[vlak] ?? 0
              const pct = s > 0 ? Math.round(((s - 4) / 16) * 100) : 0
              const domeinKleur = VLAK_KLEUR[vlak] ?? '#9CA3AF'
              const bar = s > 0 ? domeinKleur : '#E5E7EB'
              const label = s >= 16 ? 'Goed' : s >= 12 ? 'Matig' : s > 0 ? 'Laag' : null
              return (
                <Link key={vlak} href="/rapport" style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', borderRadius: 14, padding: '12px 8px', border: `1.5px solid ${s > 0 ? bar + '30' : '#E5E7EB'}`, textAlign: 'center', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: s > 0 ? c.bg : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s > 0 ? c.kleur : '#D1D5DB', margin: '0 auto 6px' }}>
                      <span style={{ transform: 'scale(0.75)', display: 'flex' }}>{c.icon}</span>
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#374151', marginBottom: 5 }}>{c.label}</p>
                    <div style={{ height: 4, borderRadius: 9999, background: '#F3F4F6', overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', borderRadius: 9999, background: s > 0 ? `linear-gradient(90deg, ${bar}99, ${bar})` : bar, width: `${pct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                    {s > 0
                      ? <span style={{ fontSize: 9, fontWeight: 700, color: bar }}>{label}</span>
                      : <span style={{ fontSize: 9, color: '#D1D5DB' }}>—</span>
                    }
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── DOELEN & PROGRESSIE ── */}
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
            <Link href={doelkeuzeUrl} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: 20, padding: '32px 24px', border: '2px dashed #E5E7EB', textAlign: 'center', transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = '#1D9E75' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#1D9E75' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                  {vlakScores ? 'Kies je weekdoelen' : 'Start je eerste check-in'}
                </p>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 18, lineHeight: 1.5 }}>
                  {vlakScores ? 'Je check-in is gedaan. Stel nu je 3 doelen in voor deze week.' : 'Vul je check-in in om je welzijn te meten en weekdoelen te kiezen.'}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1D9E75', color: 'white', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600 }}>
                  {vlakScores ? 'Doelen instellen' : 'Check-in starten'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
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
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', flex: 1 }}
                onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'}
                onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>
                <div style={{ background: 'white', borderRadius: 12, padding: '12px 10px', border: '1px solid #E5E7EB', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.kleur }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── DISC PROFIEL ── */}
        {discProfiel && (() => {
          const discKleuren: Record<string, { kleur: string; bg: string; label: string }> = {
            D: { kleur: '#E24B4A', bg: '#FCEBEB22', label: 'Dominant' },
            I: { kleur: '#F59E0B', bg: '#FEF3C722', label: 'Invloedrijk' },
            S: { kleur: '#1D9E75', bg: '#E1F5EE22', label: 'Stabiel' },
            C: { kleur: '#185FA5', bg: '#E6F1FB22', label: 'Consciëntieus' },
          }
          const d = discKleuren[discProfiel.primair] ?? discKleuren['S']
          return (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
                DISC profiel
              </p>
              <Link href="/disc" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: 'white', borderRadius: 16, padding: '16px 20px',
                  border: `1.5px solid ${d.kleur}30`,
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: d.bg, border: `2px solid ${d.kleur}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: d.kleur, lineHeight: 1 }}>{discProfiel.primair}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Primair profiel</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: d.kleur, letterSpacing: '-0.02em' }}>{d.label}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Bekijk je volledige DISC analyse →</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={d.kleur} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            </div>
          )
        })()}

        {/* ── CRISIS ── */}
        <CrisisButton />

      </main>
    </div>
  )
}
