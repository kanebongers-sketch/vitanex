'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface WeekStats {
  week: string
  stemming: number | null
  slaap: number | null
  stress: number | null
  focus: number
  checkins: number
}

interface StreakData {
  huidige_streak: number
  langste_streak: number
  totaal_dagen: number
}

export default function VoortgangPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [weekStats, setWeekStats] = useState<WeekStats[]>([])
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [totalen, setTotalen] = useState({
    checkins: 0,
    focus_minuten: 0,
    dankbaarheid: 0,
    stemming_logs: 0,
    slaap_logs: 0,
    stress_logs: 0,
  })

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [stemmingRes, slaapRes, stressRes, focusRes, dankRes, checkinRes] = await Promise.all([
        authFetch('/api/stemming?limit=30'),
        authFetch('/api/slaap?limit=30'),
        authFetch('/api/stress?limit=30'),
        authFetch('/api/focus/log?limit=30'),
        authFetch('/api/dankbaarheid?limit=30'),
        supabase.from('checkin_sessies').select('aangemaakt_op').eq('user_id', user.id).order('aangemaakt_op', { ascending: false }).limit(30),
      ])

      const stemmingData = stemmingRes.ok ? (await stemmingRes.json() as { logs: { stemming: number; aangemaakt_op: string }[] }) : { logs: [] }
      const slaapData = slaapRes.ok ? (await slaapRes.json() as { logs: { uren_slaap: number; datum: string }[] }) : { logs: [] }
      const stressData = stressRes.ok ? (await stressRes.json() as { logs: { stress_niveau: number; aangemaakt_op: string }[] }) : { logs: [] }
      const focusData = focusRes.ok ? (await focusRes.json() as { logs: { duur_minuten: number; aangemaakt_op: string }[]; totaal_minuten?: number }) : { logs: [], totaal_minuten: 0 }
      const dankData = dankRes.ok ? (await dankRes.json() as { logs: unknown[] }) : { logs: [] }
      const checkins = checkinRes.data ?? []

      // Totalen
      setTotalen({
        checkins: checkins.length,
        focus_minuten: focusData.totaal_minuten ?? (focusData.logs ?? []).reduce((s, l) => s + l.duur_minuten, 0),
        dankbaarheid: (dankData.logs ?? []).length,
        stemming_logs: (stemmingData.logs ?? []).length,
        slaap_logs: (slaapData.logs ?? []).length,
        stress_logs: (stressData.logs ?? []).length,
      })

      // Streak berekening op basis van check-ins
      const checkinDatums = checkins
        .map((c: { aangemaakt_op: string }) => c.aangemaakt_op.slice(0, 10))
        .sort()
        .reverse()

      let huidig = 0
      let langst = 0
      let huidigTeller = 0
      const vandaagStr = new Date().toISOString().slice(0, 10)
      const gisterStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

      if (checkinDatums.length > 0 && (checkinDatums[0] === vandaagStr || checkinDatums[0] === gisterStr)) {
        huidigTeller = 1
        for (let i = 1; i < checkinDatums.length; i++) {
          const prev = new Date(checkinDatums[i - 1])
          const curr = new Date(checkinDatums[i])
          const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
          if (diff <= 1) huidigTeller++
          else break
        }
        huidig = huidigTeller
      }

      let tempStreak = 0
      for (let i = 0; i < checkinDatums.length; i++) {
        if (i === 0) { tempStreak = 1; continue }
        const prev = new Date(checkinDatums[i - 1])
        const curr = new Date(checkinDatums[i])
        const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
        if (diff <= 1) tempStreak++
        else { langst = Math.max(langst, tempStreak); tempStreak = 1 }
      }
      langst = Math.max(langst, tempStreak)

      setStreak({ huidige_streak: huidig, langste_streak: langst, totaal_dagen: checkinDatums.length })

      // Weekgemiddelden (laatste 4 weken)
      const weeks: WeekStats[] = []
      for (let w = 3; w >= 0; w--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - w * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        const ws = weekStart.toISOString().slice(0, 10)
        const we = weekEnd.toISOString().slice(0, 10)

        const stLogs = (stemmingData.logs ?? []).filter(l => l.aangemaakt_op.slice(0, 10) >= ws && l.aangemaakt_op.slice(0, 10) <= we)
        const slLogs = (slaapData.logs ?? []).filter(l => l.datum >= ws && l.datum <= we)
        const stressLogs = (stressData.logs ?? []).filter(l => l.aangemaakt_op.slice(0, 10) >= ws && l.aangemaakt_op.slice(0, 10) <= we)
        const focusLogs = (focusData.logs ?? []).filter(l => l.aangemaakt_op.slice(0, 10) >= ws && l.aangemaakt_op.slice(0, 10) <= we)
        const ciWeek = checkins.filter((c: { aangemaakt_op: string }) => c.aangemaakt_op.slice(0, 10) >= ws && c.aangemaakt_op.slice(0, 10) <= we)

        weeks.push({
          week: weekStart.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }),
          stemming: stLogs.length ? Math.round(stLogs.reduce((s, l) => s + l.stemming, 0) / stLogs.length * 10) / 10 : null,
          slaap: slLogs.length ? Math.round(slLogs.reduce((s, l) => s + l.uren_slaap, 0) / slLogs.length * 10) / 10 : null,
          stress: stressLogs.length ? Math.round(stressLogs.reduce((s, l) => s + l.stress_niveau, 0) / stressLogs.length * 10) / 10 : null,
          focus: focusLogs.reduce((s, l) => s + l.duur_minuten, 0),
          checkins: ciWeek.length,
        })
      }
      setWeekStats(weeks)
      setLaden(false)
    }
    laad()
  }, [router])

  const METRICS = [
    { label: 'Check-ins', waarde: totalen.checkins, eenheid: 'keer', kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)', href: '/checkin' },
    { label: 'Focus', waarde: totalen.focus_minuten, eenheid: 'min', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', href: '/focus' },
    { label: 'Dankbaar', waarde: totalen.dankbaarheid, eenheid: '×', kleur: 'var(--mf-rose)', bg: 'var(--mf-rose-light)', href: '/dankbaarheid' },
    { label: 'Stemming', waarde: totalen.stemming_logs, eenheid: 'logs', kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', href: '/stemming' },
    { label: 'Slaap', waarde: totalen.slaap_logs, eenheid: 'nachten', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', href: '/slaap' },
    { label: 'Stress', waarde: totalen.stress_logs, eenheid: 'logs', kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', href: '/stress' },
  ]

  const heeftData = totalen.checkins > 0 || totalen.stemming_logs > 0 || totalen.slaap_logs > 0

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '36px 20px 72px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: streak && streak.huidige_streak > 0
                ? 'radial-gradient(circle, rgba(243,99,12,0.18) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 70%)',
            }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Mijn voortgang</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Jouw welzijns-statistieken van de afgelopen 30 dagen</p>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : !heeftData ? (
          /* ── Empty state ─────────────────────────────────── */
          <div style={{
            background: 'var(--bg-card)', borderRadius: 24, padding: '56px 32px',
            border: '2px dashed var(--border)', textAlign: 'center',
            boxShadow: 'var(--shadow-xs)', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 70%)' }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
              Je reis begint hier
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>
              Doe je eerste check-in en log je stemming, slaap en focus. Jouw voortgang verschijnt hier zodra je data hebt verzameld.
            </p>
            <Link href="/checkin" style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, var(--mf-green-dark) 0%, var(--mf-green) 100%)',
              color: 'white', fontWeight: 700, fontSize: 15,
              padding: '14px 32px', borderRadius: 12, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
            }}>
              Start je eerste check-in →
            </Link>
          </div>
        ) : (
          <>
            {/* Streak */}
            {streak && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Huidige streak', waarde: streak.huidige_streak, suffix: 'dagen', kleur: 'var(--mf-green)', icon: '🔥' },
                  { label: 'Langste streak', waarde: streak.langste_streak, suffix: 'dagen', kleur: 'var(--mf-amber)', icon: '🏆' },
                  { label: 'Totaal actief', waarde: streak.totaal_dagen, suffix: 'dagen', kleur: 'var(--mf-purple)', icon: '📅' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: item.kleur }}>{item.waarde}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.suffix}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Totalen grid */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 22px', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 16 }}>
                Totaal gelogd (30 dagen)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {METRICS.map(m => (
                  <Link key={m.label} href={m.href} style={{ textDecoration: 'none', borderRadius: 12, padding: '14px 16px', background: m.bg, border: `1px solid ${m.kleur}20`, display: 'block' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: m.kleur }}>{m.waarde} <span style={{ fontSize: 12, fontWeight: 500 }}>{m.eenheid}</span></p>
                    <p style={{ fontSize: 11, color: m.kleur, fontWeight: 600, marginTop: 2 }}>{m.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Weektrends — visuele mini-charts */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
                Weektrend (4 weken)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  {
                    label: 'Stemming',
                    icon: '😊',
                    max: 5,
                    kleur: (v: number | null) => v === null ? 'var(--bg-subtle)' : v >= 4 ? 'var(--mf-green)' : v >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)',
                    fmt: (v: number | null) => v !== null ? `${v}/5` : '—',
                    vals: weekStats.map(w => w.stemming),
                    hMax: 5,
                  },
                  {
                    label: 'Slaap',
                    icon: '😴',
                    max: 9,
                    kleur: (v: number | null) => v === null ? 'var(--bg-subtle)' : v >= 7 ? 'var(--mf-green)' : v >= 5 ? 'var(--mf-amber)' : 'var(--mf-red)',
                    fmt: (v: number | null) => v !== null ? `${v}u` : '—',
                    vals: weekStats.map(w => w.slaap),
                    hMax: 9,
                  },
                  {
                    label: 'Focus',
                    icon: '🎯',
                    max: 120,
                    kleur: (v: number | null) => v === null ? 'var(--bg-subtle)' : v >= 60 ? 'var(--mf-purple)' : v > 0 ? 'var(--mf-amber)' : 'var(--bg-subtle)',
                    fmt: (v: number | null) => v !== null && v > 0 ? `${v}m` : '—',
                    vals: weekStats.map(w => w.focus as number | null),
                    hMax: 120,
                  },
                  {
                    label: 'Check-ins',
                    icon: '✅',
                    max: 7,
                    kleur: (v: number | null) => v === null ? 'var(--bg-subtle)' : v >= 5 ? 'var(--mf-green)' : v >= 3 ? 'var(--mf-amber)' : v > 0 ? 'var(--mf-red)' : 'var(--bg-subtle)',
                    fmt: (v: number | null) => v !== null ? `${v}×` : '—',
                    vals: weekStats.map(w => w.checkins as number | null),
                    hMax: 7,
                  },
                ].map(metric => {
                  const latest = [...metric.vals].reverse().find(v => v !== null) ?? null
                  const geldigVals = metric.vals.filter((v): v is number => v !== null && v > 0)
                  const huidig = geldigVals[geldigVals.length - 1] ?? null
                  const vorig = geldigVals[geldigVals.length - 2] ?? null
                  const delta = huidig !== null && vorig !== null ? huidig - vorig : null
                  const deltaStr = delta !== null
                    ? `${delta >= 0 ? '+' : ''}${metric.hMax <= 10 ? delta.toFixed(1) : Math.round(delta)}`
                    : null
                  const deltaKleur = delta === null ? 'var(--text-4)'
                    : metric.label === 'Stress' ? (delta < 0 ? 'var(--mf-green)' : 'var(--mf-red)')
                    : (delta > 0 ? 'var(--mf-green)' : 'var(--mf-red)')
                  const deltaArrow = delta === null ? '' : delta > 0 ? '↑' : delta < 0 ? '↓' : '→'
                  return (
                    <div key={metric.label} style={{
                      background: 'var(--bg-card)', borderRadius: 16,
                      border: '1px solid var(--border)', padding: '16px',
                      boxShadow: 'var(--shadow-xs)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
                          <span style={{ fontSize: 14 }}>{metric.icon}</span>{metric.label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: metric.kleur(latest) }}>
                          {metric.fmt(latest)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 40 }}>
                        {metric.vals.map((v, i) => {
                          const h = v !== null && v > 0 ? Math.max(4, (v / metric.hMax) * 36) : 4
                          const kleur = metric.kleur(v)
                          const isLatest = i === metric.vals.length - 1
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              <div style={{
                                width: '100%', height: h, borderRadius: 3,
                                background: v !== null && v > 0 ? kleur : 'var(--bg-subtle)',
                                opacity: isLatest ? 1 : v !== null && v > 0 ? 0.5 : 0.25,
                                transition: 'height 0.5s ease',
                              }} />
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                        {weekStats.map((w, i) => (
                          <span key={i} style={{ flex: 1, fontSize: 8, color: 'var(--text-4)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.week}</span>
                        ))}
                      </div>
                      {deltaStr && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: deltaKleur }}>{deltaArrow} {deltaStr}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-4)' }}>vs vorige week</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { href: '/inzichten', label: 'AI Inzichten', tekst: 'Persoonlijke analyse van jouw week', kleur: 'var(--mf-purple)', icon: '✨' },
                { href: '/groeiplan', label: 'Groeiplan', tekst: 'AI-gegenereerd persoonlijk groeiplan', kleur: 'var(--mf-green)', icon: '🌱' },
                { href: '/mentale-sterkte', label: 'Mentale sterkte', tekst: 'Quiz: hoe sterk ben jij mentaal?', kleur: 'var(--mf-purple)', icon: '🧠' },
                { href: '/achievements', label: 'Achievements', tekst: 'Bekijk jouw behaalde badges', kleur: 'var(--mf-amber)', icon: '🏅' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.kleur}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.tekst}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--text-4)' }}><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

