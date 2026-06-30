'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Flame, Trophy, CalendarDays, Smile, Moon, Target, CheckCircle2,
  Sparkles, Sprout, Brain, Award, ChevronRight, type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Chart } from '@/components/ui/Chart'

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

/**
 * Bereken huidige + langste streak in één enkele pass over de
 * (aflopend gesorteerde) check-in datums. Vervangt de eerdere
 * dubbele O(n) lus met herhaalde Date-allocaties.
 */
function berekenStreaks(datumsAflopend: readonly string[]): StreakData {
  const totaal = datumsAflopend.length
  if (totaal === 0) return { huidige_streak: 0, langste_streak: 0, totaal_dagen: 0 }

  const vandaagStr = new Date().toISOString().slice(0, 10)
  const gisterStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const startTeltVoorHuidig = datumsAflopend[0] === vandaagStr || datumsAflopend[0] === gisterStr

  let langst = 1
  let lopend = 1
  let huidig = startTeltVoorHuidig ? 1 : 0
  let huidigNogActief = startTeltVoorHuidig

  for (let i = 1; i < totaal; i++) {
    const prevMs = new Date(datumsAflopend[i - 1]).getTime()
    const currMs = new Date(datumsAflopend[i]).getTime()
    const diff = Math.round((prevMs - currMs) / 86400000)

    if (diff <= 1) {
      lopend++
      if (huidigNogActief) huidig++
    } else {
      if (lopend > langst) langst = lopend
      lopend = 1
      huidigNogActief = false
    }
  }
  if (lopend > langst) langst = lopend

  return { huidige_streak: huidig, langste_streak: langst, totaal_dagen: totaal }
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

      // Streak berekening op basis van check-ins (één pass)
      const checkinDatums = checkins
        .map((c: { aangemaakt_op: string }) => c.aangemaakt_op.slice(0, 10))
        .sort()
        .reverse()

      setStreak(berekenStreaks(checkinDatums))

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
    { label: 'Check-ins', waarde: totalen.checkins, eenheid: 'keer', kleur: 'var(--mentaforce-primary)', bg: 'var(--mentaforce-primary-light)', href: '/checkin' },
    { label: 'Focus', waarde: totalen.focus_minuten, eenheid: 'min', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', href: '/focus' },
    { label: 'Dankbaar', waarde: totalen.dankbaarheid, eenheid: '×', kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', href: '/dankbaarheid' },
    { label: 'Stemming', waarde: totalen.stemming_logs, eenheid: 'logs', kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', href: '/stemming' },
    { label: 'Slaap', waarde: totalen.slaap_logs, eenheid: 'nachten', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', href: '/slaap' },
    { label: 'Stress', waarde: totalen.stress_logs, eenheid: 'logs', kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', href: '/stress' },
  ]

  const heeftData = totalen.checkins > 0 || totalen.stemming_logs > 0 || totalen.slaap_logs > 0

  // Trend-metrieken met label/icoon (niet kleur-only) + één-pass delta.
  const TRENDS: Array<{
    label: string
    Icon: LucideIcon
    eenheid: string
    kleur: string
    decimalen: boolean
    vals: (number | null)[]
    yMax: number
  }> = [
    { label: 'Stemming', Icon: Smile, eenheid: '/5', kleur: 'var(--mf-amber)', decimalen: true, vals: weekStats.map(w => w.stemming), yMax: 5 },
    { label: 'Slaap', Icon: Moon, eenheid: 'u', kleur: 'var(--mf-purple)', decimalen: true, vals: weekStats.map(w => w.slaap), yMax: 9 },
    { label: 'Focus', Icon: Target, eenheid: 'm', kleur: 'var(--mentaforce-primary)', decimalen: false, vals: weekStats.map(w => (w.focus as number | null)), yMax: 120 },
    { label: 'Check-ins', Icon: CheckCircle2, eenheid: '×', kleur: 'var(--mf-green)', decimalen: false, vals: weekStats.map(w => (w.checkins as number | null)), yMax: 7 },
  ]

  const STREAK_KAARTEN = streak ? [
    { label: 'Huidige streak', waarde: streak.huidige_streak, suffix: 'dagen', kleur: 'var(--mentaforce-primary)', Icon: Flame },
    { label: 'Langste streak', waarde: streak.langste_streak, suffix: 'dagen', kleur: 'var(--mf-amber)', Icon: Trophy },
    { label: 'Totaal actief', waarde: streak.totaal_dagen, suffix: 'dagen', kleur: 'var(--mf-purple)', Icon: CalendarDays },
  ] : []

  const QUICK_LINKS: Array<{ href: string; label: string; tekst: string; kleur: string; Icon: LucideIcon }> = [
    { href: '/inzichten', label: 'AI Inzichten', tekst: 'Persoonlijke analyse van jouw week', kleur: 'var(--mf-purple)', Icon: Sparkles },
    { href: '/groeiplan', label: 'Groeiplan', tekst: 'AI-gegenereerd persoonlijk groeiplan', kleur: 'var(--mentaforce-primary)', Icon: Sprout },
    { href: '/mentale-sterkte', label: 'Mentale sterkte', tekst: 'Quiz: hoe sterk ben jij mentaal?', kleur: 'var(--mf-purple)', Icon: Brain },
    { href: '/achievements', label: 'Achievements', tekst: 'Bekijk jouw behaalde badges', kleur: 'var(--mf-amber)', Icon: Award },
  ]

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 20px 72px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: streak && streak.huidige_streak > 0
                ? 'radial-gradient(circle, color-mix(in srgb, var(--mf-amber) 22%, transparent) 0%, transparent 70%)'
                : 'radial-gradient(circle, var(--mentaforce-primary-light) 0%, transparent 70%)',
            }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Mijn voortgang</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Jouw welzijns-statistieken van de afgelopen 30 dagen</p>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : !heeftData ? (
          /* ── Empty state ─────────────────────────────────── */
          <Card style={{
            borderRadius: 24, padding: '56px 32px',
            border: '2px dashed var(--border-strong)', textAlign: 'center',
            boxShadow: 'var(--shadow-xs)', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--mentaforce-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mentaforce-primary)' }}>
                <Sprout size={32} aria-hidden />
              </div>
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
              Je reis begint hier
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>
              Doe je eerste check-in en log je stemming, slaap en focus. Jouw voortgang verschijnt hier zodra je data hebt verzameld.
            </p>
            <Link href="/checkin" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--mentaforce-primary)',
              color: 'var(--bg-app)', fontWeight: 700, fontSize: 15,
              padding: '14px 32px', borderRadius: 'var(--radius-btn)', textDecoration: 'none',
            }}>
              Start je eerste check-in
              <ChevronRight size={16} aria-hidden />
            </Link>
          </Card>
        ) : (
          <>
            {/* Streak */}
            {streak && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                {STREAK_KAARTEN.map(item => (
                  <Card key={item.label} style={{ padding: '20px 22px', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', color: item.kleur }}><item.Icon size={18} aria-hidden /></span>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: item.kleur }}>{item.waarde}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.suffix}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Totalen grid */}
            <Card style={{ padding: '18px 22px', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 16 }}>
                Totaal gelogd (30 dagen)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {METRICS.map(m => (
                  <Link key={m.label} href={m.href} style={{ textDecoration: 'none', borderRadius: 'var(--radius-md)', padding: '14px 16px', background: m.bg, border: `1px solid color-mix(in srgb, ${m.kleur} 30%, transparent)`, display: 'block' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: m.kleur }}>{m.waarde} <span style={{ fontSize: 12, fontWeight: 500 }}>{m.eenheid}</span></p>
                    <p style={{ fontSize: 11, color: m.kleur, fontWeight: 600, marginTop: 2 }}>{m.label}</p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Weektrends — Chart-primitive (lazy + sr-only datatabel) */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
                Weektrend (4 weken)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {TRENDS.map(metric => {
                  const geldigVals = metric.vals.filter((v): v is number => v !== null && v > 0)
                  const latest = geldigVals[geldigVals.length - 1] ?? null
                  const vorig = geldigVals[geldigVals.length - 2] ?? null
                  const delta = latest !== null && vorig !== null ? latest - vorig : null
                  const deltaStr = delta !== null
                    ? `${delta >= 0 ? '+' : ''}${metric.decimalen ? delta.toFixed(1) : Math.round(delta)}`
                    : null
                  // Stress is hier niet aanwezig; hogere waarde = beter voor alle trends.
                  const deltaKleur = delta === null ? 'var(--text-4)' : (delta > 0 ? 'var(--mf-green)' : delta < 0 ? 'var(--mf-red)' : 'var(--text-4)')
                  const deltaArrow = delta === null ? '→' : delta > 0 ? '↑' : delta < 0 ? '↓' : '→'
                  const latestLabel = latest !== null ? `${metric.decimalen ? latest : Math.round(latest)}${metric.eenheid}` : '—'

                  const chartData = weekStats.map(w => {
                    const raw = metric.label === 'Stemming' ? w.stemming
                      : metric.label === 'Slaap' ? w.slaap
                      : metric.label === 'Focus' ? w.focus
                      : w.checkins
                    return { week: w.week, [metric.label]: raw }
                  })

                  return (
                    <Card key={metric.label} style={{ padding: '16px', boxShadow: 'var(--shadow-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
                          <span style={{ display: 'inline-flex', color: metric.kleur }}><metric.Icon size={14} aria-hidden /></span>
                          {metric.label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: metric.kleur }}>
                          {latestLabel}
                        </span>
                      </div>
                      <Chart
                        type="bar"
                        data={chartData}
                        xKey="week"
                        series={[{ key: metric.label, label: metric.label, color: metric.kleur }]}
                        summary={`${metric.label} per week over de laatste 4 weken${metric.eenheid ? `, in ${metric.eenheid}` : ''}.`}
                        yDomain={[0, metric.yMax]}
                        height={120}
                      />
                      {deltaStr && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: deltaKleur }}>{deltaArrow} {deltaStr}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-4)' }}>vs vorige week</span>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {QUICK_LINKS.map(item => (
                <Link key={item.href} href={item.href} className="mf-lift" style={{ textDecoration: 'none' }}>
                  <Card style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, ${item.kleur} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.kleur, flexShrink: 0 }}>
                      <item.Icon size={20} aria-hidden />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{item.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.tekst}</p>
                    </div>
                    <ChevronRight size={14} aria-hidden style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--text-4)' }} />
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
