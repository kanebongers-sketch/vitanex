'use client'

// ─── Voortgang — het lange-termijnbeeld ───────────────────────────────────────
// Waar /niveau over déze week en je niveau gaat, is dit de plek voor het
// grotere verhaal: trends over 4 weken en totalen over 30 dagen. Volgorde is
// bewust: eerst de samenvatting in één blik (actieve dagen + richting), dan de
// weektrends per metriek, dan de totalen als naslag, dan verdieping.

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, Sprout, Brain, Award, ChevronRight, type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import SectieKop from './SectieKop'
import TrendOverzicht from './TrendOverzicht'
import WeekTrends from './WeekTrends'
import { berekenStreaks, berekenWeekStats, type StreakData, type WeekStats } from './trend'

interface Totalen {
  checkins: number
  focus_minuten: number
  dankbaarheid: number
  stemming_logs: number
  slaap_logs: number
  stress_logs: number
}

const LEGE_TOTALEN: Totalen = {
  checkins: 0, focus_minuten: 0, dankbaarheid: 0,
  stemming_logs: 0, slaap_logs: 0, stress_logs: 0,
}

const QUICK_LINKS: Array<{ href: string; label: string; tekst: string; kleur: string; Icon: LucideIcon }> = [
  { href: '/inzichten', label: 'AI Inzichten', tekst: 'Persoonlijke analyse van jouw week', kleur: 'var(--mf-purple)', Icon: Sparkles },
  { href: '/groeiplan', label: 'Groeiplan', tekst: 'AI-gegenereerd persoonlijk groeiplan', kleur: 'var(--mentaforce-primary)', Icon: Sprout },
  { href: '/mentale-sterkte', label: 'Mentale sterkte', tekst: 'Quiz: hoe sterk ben jij mentaal?', kleur: 'var(--mf-purple)', Icon: Brain },
  { href: '/achievements', label: 'Achievements', tekst: 'Bekijk jouw behaalde badges', kleur: 'var(--mf-amber)', Icon: Award },
]

/** Skeleton met dezelfde bloklayout als de geladen pagina — geen layout-shift. */
function LaadStaat() {
  const blokken = [
    { hoogte: 210, label: 'trend' },
    { hoogte: 440, label: 'grafieken' },
    { hoogte: 180, label: 'totalen' },
    { hoogte: 150, label: 'links' },
  ]
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">Je voortgang wordt geladen.</p>
      {blokken.map(blok => (
        <div key={blok.label} className="vg-skelet" aria-hidden="true"
          style={{ height: blok.hoogte, marginBottom: 20 }} />
      ))}
    </div>
  )
}

export default function VoortgangPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [weekStats, setWeekStats] = useState<WeekStats[]>([])
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [totalen, setTotalen] = useState<Totalen>(LEGE_TOTALEN)
  // Balkvullingen starten op 0 en vullen pas ná de eerste paint — zachte inloop.
  const [animKlaar, setAnimKlaar] = useState(false)

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
      setWeekStats(berekenWeekStats({
        stemming: stemmingData.logs ?? [],
        slaap: slaapData.logs ?? [],
        stress: stressData.logs ?? [],
        focus: focusData.logs ?? [],
        checkinDatums: checkins.map((c: { aangemaakt_op: string }) => c.aangemaakt_op),
      }))
      setLaden(false)
    }
    laad()
  }, [router])

  useEffect(() => {
    if (laden || animKlaar) return
    // Dubbele rAF: eerst de 0-staat laten schilderen, dan pas vullen.
    let binnenste = 0
    const buitenste = requestAnimationFrame(() => {
      binnenste = requestAnimationFrame(() => setAnimKlaar(true))
    })
    return () => {
      cancelAnimationFrame(buitenste)
      cancelAnimationFrame(binnenste)
    }
  }, [laden, animKlaar])

  const METRICS = [
    { label: 'Check-ins', waarde: totalen.checkins, eenheid: 'keer', kleur: 'var(--mentaforce-primary)', bg: 'var(--mentaforce-primary-light)', href: '/checkin' },
    { label: 'Focus', waarde: totalen.focus_minuten, eenheid: 'min', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', href: '/focus' },
    { label: 'Dankbaar', waarde: totalen.dankbaarheid, eenheid: '×', kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', href: '/dankbaarheid' },
    { label: 'Stemming', waarde: totalen.stemming_logs, eenheid: 'logs', kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', href: '/stemming' },
    { label: 'Slaap', waarde: totalen.slaap_logs, eenheid: 'nachten', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', href: '/slaap' },
    { label: 'Stress', waarde: totalen.stress_logs, eenheid: 'logs', kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', href: '/stress' },
  ]

  const heeftData = totalen.checkins > 0 || totalen.stemming_logs > 0 || totalen.slaap_logs > 0

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 20px 72px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Mijn voortgang</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Het lange-termijnbeeld: trends over 4 weken en totalen over 30 dagen.
          </p>
        </div>

        {laden ? (
          <LaadStaat />
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
            <Link href="/checkin" className="vg-cta" style={{
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
            {/* 1. Het grote plaatje — de lange termijn in één blik */}
            {streak && <TrendOverzicht streak={streak} weekStats={weekStats} animKlaar={animKlaar} />}

            {/* 2. Weektrends per metriek */}
            <WeekTrends weekStats={weekStats} />

            {/* 3. Totalen — naslag over de hele periode */}
            <Card style={{ padding: '18px 22px', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
              <SectieKop style={{ marginBottom: 4 }}>Totaal gelogd (30 dagen)</SectieKop>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
                Alles wat je in deze periode logde — tik op een tegel om direct verder te gaan.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {METRICS.map(m => (
                  <Link key={m.label} href={m.href} className="vg-tegel" style={{ textDecoration: 'none', borderRadius: 'var(--radius-md)', padding: '14px 16px', background: m.bg, border: `1px solid color-mix(in srgb, ${m.kleur} 30%, transparent)`, display: 'block' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: m.kleur, fontVariantNumeric: 'tabular-nums' }}>{m.waarde} <span style={{ fontSize: 12, fontWeight: 500 }}>{m.eenheid}</span></p>
                    <p style={{ fontSize: 11, color: m.kleur, fontWeight: 600, marginTop: 2 }}>{m.label}</p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* 4. Verdieping */}
            <section>
              <SectieKop>Verder verdiepen</SectieKop>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {QUICK_LINKS.map(item => (
                  <Link key={item.href} href={item.href} className="mf-lift" style={{ textDecoration: 'none', display: 'block', borderRadius: 'var(--radius-card)' }}>
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
            </section>
          </>
        )}
        <style>{paginaStijl}</style>
      </main>
    </div>
  )
}

const paginaStijl = `
.vg-skelet {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  animation: vg-pols 1.8s var(--ease) infinite;
}
@keyframes vg-pols {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.85; }
}
.vg-tegel {
  transition: transform 0.18s var(--ease), box-shadow 0.18s var(--ease);
}
.vg-tegel:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
.vg-tegel:active { transform: translateY(0); }
.vg-tegel:focus-visible,
.vg-cta:focus-visible {
  outline: 2px solid var(--mentaforce-primary);
  outline-offset: 2px;
}
.vg-cta { transition: transform 0.15s var(--ease), opacity 0.15s var(--ease); }
.vg-cta:hover { transform: translateY(-1px); opacity: 0.9; }
.vg-cta:active { transform: translateY(0); opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .vg-skelet { animation: none; }
  .vg-tegel, .vg-cta { transition: none; }
}
`
