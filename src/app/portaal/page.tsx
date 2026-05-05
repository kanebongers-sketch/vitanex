'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '@/components/Navbar'

type Checkin = {
  energie: number
  slaap: number
  fysiek_pijn: number
  fysiek_beweging: number
  werkdruk: number
  mentaal_focus: number
  mentaal_stress: number
  mentaal_balans: number
  motivatie: number
  sociaal_team: number
  sociaal_steun: number
  herstel: number
  created_at: string
}

type GewoontLog = { gewoonte: string; datum: string }

const GEWOONTES: { id: string; label: string; afk: string }[] = [
  { id: 'slaap', label: 'Goed geslapen', afk: 'S' },
  { id: 'beweging', label: 'Bewogen', afk: 'B' },
  { id: 'pauze', label: 'Pauzes genomen', afk: 'P' },
  { id: 'meditatie', label: 'Mindful moment', afk: 'M' },
  { id: 'water', label: 'Voldoende water', afk: 'W' },
]

function gem(arr: number[]) {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function scoreKleur(s: number) {
  if (s >= 4) return '#1D9E75'
  if (s >= 2.5) return '#BA7517'
  return '#E24B4A'
}

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
}

function berekenStreak(checkins: Checkin[]) {
  if (!checkins.length) return 0
  const weken = new Set(
    checkins.map(c => {
      const d = new Date(c.created_at)
      const start = new Date(d)
      start.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      return start.toISOString().slice(0, 10)
    })
  )
  const gesorteerd = [...weken].sort().reverse()
  let streak = 0
  const nu = new Date()
  const huidigeWeekStart = new Date(nu)
  huidigeWeekStart.setDate(nu.getDate() - ((nu.getDay() + 6) % 7))
  for (let i = 0; i < gesorteerd.length; i++) {
    const verwacht = new Date(huidigeWeekStart)
    verwacht.setDate(verwacht.getDate() - i * 7)
    if (gesorteerd[i] === verwacht.toISOString().slice(0, 10)) streak++
    else break
  }
  return streak
}

function berekenGewoontStreak(logs: GewoontLog[], gewoonte: string): number {
  const dagen = logs.filter(l => l.gewoonte === gewoonte).map(l => l.datum).sort().reverse()
  if (!dagen.length) return 0
  let streak = 0
  const nu = new Date()
  for (let i = 0; i < 60; i++) {
    const dag = new Date(nu)
    dag.setDate(nu.getDate() - i)
    const dagStr = dag.toISOString().slice(0, 10)
    if (dagen.includes(dagStr)) streak++
    else if (i === 0) continue // allow today to be empty
    else break
  }
  return streak
}

const categorieMetrics = [
  {
    label: 'Fysiek', kleur: '#1D9E75', licht: '#E1F5EE', donker: '#0F6E56',
    keys: ['energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging'] as (keyof Checkin)[],
    items: [
      { key: 'energie' as keyof Checkin, label: 'Energie' },
      { key: 'slaap' as keyof Checkin, label: 'Slaap' },
      { key: 'fysiek_pijn' as keyof Checkin, label: 'Fys. klachten' },
      { key: 'fysiek_beweging' as keyof Checkin, label: 'Beweging' },
    ],
  },
  {
    label: 'Mentaal', kleur: '#378ADD', licht: '#E6F1FB', donker: '#185FA5',
    keys: ['werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans'] as (keyof Checkin)[],
    items: [
      { key: 'werkdruk' as keyof Checkin, label: 'Werkdruk' },
      { key: 'mentaal_focus' as keyof Checkin, label: 'Focus' },
      { key: 'mentaal_stress' as keyof Checkin, label: 'Stress' },
      { key: 'mentaal_balans' as keyof Checkin, label: 'Balans' },
    ],
  },
  {
    label: 'Sociaal', kleur: '#8B5CF6', licht: '#EEEDFE', donker: '#3C3489',
    keys: ['motivatie', 'sociaal_team', 'sociaal_steun', 'herstel'] as (keyof Checkin)[],
    items: [
      { key: 'motivatie' as keyof Checkin, label: 'Motivatie' },
      { key: 'sociaal_team' as keyof Checkin, label: 'Teamwerk' },
      { key: 'sociaal_steun' as keyof Checkin, label: 'Steun' },
      { key: 'herstel' as keyof Checkin, label: 'Herstel' },
    ],
  },
]

const allKeys: (keyof Checkin)[] = [
  'energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging',
  'werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans',
  'motivatie', 'sociaal_team', 'sociaal_steun', 'herstel',
]

const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

const FEEDBACK_CATS = [
  'Werkdruk', 'Teamsfeer', 'Management', 'Faciliteiten', 'Communicatie', 'Overig',
]

export default function Portaal() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [laden, setLaden] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)

  // Habits
  const [gewoontLogs, setGewoontLogs] = useState<GewoontLog[]>([])
  const [vandaagLogs, setVandaagLogs] = useState<Set<string>>(new Set())

  // Anonymous feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTekst, setFeedbackTekst] = useState('')
  const [feedbackCat, setFeedbackCat] = useState(FEEDBACK_CATS[0])
  const [feedbackBezig, setFeedbackBezig] = useState(false)
  const [feedbackVerstuurd, setFeedbackVerstuurd] = useState(false)

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      const { data } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(24)

      setCheckins(data || [])

      // Load habit logs (last 60 days)
      const zestigDagenGeleden = new Date()
      zestigDagenGeleden.setDate(zestigDagenGeleden.getDate() - 60)
      const { data: logs } = await supabase
        .from('gewoonte_logs')
        .select('gewoonte, datum')
        .eq('user_id', user.id)
        .gte('datum', zestigDagenGeleden.toISOString().slice(0, 10))

      const logData = (logs || []) as GewoontLog[]
      setGewoontLogs(logData)

      const vandaag = new Date().toISOString().slice(0, 10)
      setVandaagLogs(new Set(logData.filter(l => l.datum === vandaag).map(l => l.gewoonte)))

      setLaden(false)
    }
    laadData()
  }, [router])

  async function toggleGewoonte(id: string) {
    if (!userId) return
    const vandaag = new Date().toISOString().slice(0, 10)
    const actief = vandaagLogs.has(id)
    if (actief) {
      await supabase.from('gewoonte_logs').delete()
        .eq('user_id', userId).eq('gewoonte', id).eq('datum', vandaag)
      setVandaagLogs(prev => { const s = new Set(prev); s.delete(id); return s })
      setGewoontLogs(prev => prev.filter(l => !(l.gewoonte === id && l.datum === vandaag)))
    } else {
      await supabase.from('gewoonte_logs').insert({ user_id: userId, gewoonte: id, datum: vandaag })
      setVandaagLogs(prev => new Set([...prev, id]))
      setGewoontLogs(prev => [...prev, { gewoonte: id, datum: vandaag }])
    }
  }

  async function stuurFeedback() {
    if (!feedbackTekst.trim() || !bedrijfId) return
    setFeedbackBezig(true)
    await supabase.from('feedback_hr').insert({
      bedrijf_id: bedrijfId,
      inhoud: feedbackTekst.trim(),
      categorie: feedbackCat,
    })
    setFeedbackBezig(false)
    setFeedbackVerstuurd(true)
    setFeedbackTekst('')
    setTimeout(() => { setFeedbackOpen(false); setFeedbackVerstuurd(false) }, 2000)
  }

  const laatste = checkins[checkins.length - 1]
  const voorlaatste = checkins[checkins.length - 2]
  const totaalScore = laatste
    ? Math.round((allKeys.reduce((sum, k) => sum + (laatste[k] as number), 0) / 60) * 100)
    : 0
  const streak = berekenStreak(checkins)

  function catGem(c: Checkin, keys: (keyof Checkin)[]) {
    return gem(keys.map(k => c[k] as number))
  }
  function delta(key: keyof Checkin) {
    if (!laatste || !voorlaatste) return null
    return (laatste[key] as number) - (voorlaatste[key] as number)
  }
  function catDelta(keys: (keyof Checkin)[]) {
    if (!laatste || !voorlaatste) return null
    return Math.round((catGem(laatste, keys) - catGem(voorlaatste, keys)) * 10) / 10
  }

  const grafiekData = checkins.map(c => ({
    datum: formatDatum(c.created_at),
    Fysiek: catGem(c, categorieMetrics[0].keys),
    Mentaal: catGem(c, categorieMetrics[1].keys),
    Sociaal: catGem(c, categorieMetrics[2].keys),
  }))

  // Personal insights: average per day-of-week
  function berekenInzichten() {
    if (checkins.length < 4) return null
    const perDag: Record<number, number[]> = {}
    for (const c of checkins) {
      const dag = new Date(c.created_at).getDay()
      const totaal = allKeys.reduce((s, k) => s + (c[k] as number), 0) / allKeys.length
      if (!perDag[dag]) perDag[dag] = []
      perDag[dag].push(totaal)
    }
    const gemPerDag = Object.entries(perDag)
      .map(([dag, scores]) => ({ dag: parseInt(dag), gem: gem(scores) }))
      .filter(d => d.gem > 0)
    if (gemPerDag.length < 2) return null
    const beste = gemPerDag.reduce((a, b) => b.gem > a.gem ? b : a)
    const slechtste = gemPerDag.reduce((a, b) => b.gem < a.gem ? b : a)

    // Trend: last 4 vs previous 4
    const recent = checkins.slice(-4)
    const eerder = checkins.slice(-8, -4)
    const recentGem = gem(recent.map(c => allKeys.reduce((s, k) => s + (c[k] as number), 0) / allKeys.length))
    const eerderGem = gem(eerder.map(c => allKeys.reduce((s, k) => s + (c[k] as number), 0) / allKeys.length))
    const trend = eerder.length >= 2 ? Math.round((recentGem - eerderGem) * 10) / 10 : null

    // Best metric overall
    const metricGems = allKeys.map(k => ({ k, gem: gem(checkins.map(c => c[k] as number)) }))
    const beste_metric = metricGems.reduce((a, b) => b.gem > a.gem ? b : a)
    const slechtste_metric = metricGems.reduce((a, b) => b.gem < a.gem ? b : a)

    return { beste, slechtste, trend, beste_metric, slechtste_metric }
  }

  const inzichten = berekenInzichten()

  const metricLabels: Partial<Record<keyof Checkin, string>> = {
    energie: 'Energie', slaap: 'Slaap', fysiek_pijn: 'Fys. klachten', fysiek_beweging: 'Beweging',
    werkdruk: 'Werkdruk', mentaal_focus: 'Focus', mentaal_stress: 'Stress', mentaal_balans: 'Balans',
    motivatie: 'Motivatie', sociaal_team: 'Teamwerk', sociaal_steun: 'Steun', herstel: 'Herstel',
  }

  function tip() {
    if (!laatste) return null
    const laagst = allKeys.reduce((best, k) =>
      (laatste[k] as number) < (laatste[best] as number) ? k : best
    )
    const score = laatste[laagst] as number
    if (score > 3) return 'Je vitaliteit ziet er goed uit. Blijf dit ritme vasthouden!'
    const tips: Partial<Record<keyof Checkin, string>> = {
      energie: 'Je energie is laag. Plan bewust herstelmomenten in en zorg voor regelmaat.',
      slaap: 'Je slaapkwaliteit kan beter. Een vast slaapritme helpt je herstel.',
      fysiek_pijn: 'Je hebt fysieke klachten. Controleer je werkhouding en neem regelmatig pauze.',
      fysiek_beweging: 'Je beweegt weinig. Korte looppauzes of een lunchwandeling helpen al.',
      werkdruk: 'Je werkdruk is hoog. Bespreek dit met je leidinggevende of gebruik de coach.',
      mentaal_focus: 'Je focus schiet tekort. Probeer de focus timer in de Focus tool.',
      mentaal_stress: 'Je stress is verhoogd. De ademhalingsoefeningen kunnen snel helpen.',
      mentaal_balans: 'Je werk-privébalans is scheef. Stel grenzen aan je beschikbaarheid.',
      motivatie: 'Je motivatie is laag. Bespreek wat je energie geeft met de Vitanex Coach.',
      sociaal_team: 'De teamsamenwerking ervaart spanningen. Een open gesprek kan helpen.',
      sociaal_steun: 'Je voelt je weinig gesteund. Bespreek dit met je leidinggevende.',
      herstel: 'Je herstelt moeilijk na het werk. Maak je avondroutine bewuster.',
    }
    return tips[laagst] ?? 'Blijf je check-ins bijhouden voor inzicht over tijd.'
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Mijn portaal</h1>
            <p className="text-gray-500 text-sm mt-0.5">Jouw persoonlijke vitaliteitstrend</p>
          </div>
          <Link href="/checkin" className="text-sm font-medium text-white px-4 py-2 rounded-xl transition"
            style={{ background: 'var(--vitanex-primary)' }}>
            Check-in doen
          </Link>
        </div>

        {/* Quick tool links */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { href: '/coach',   afk: 'AI',  kleur: '#378ADD', bg: '#E6F1FB', label: 'Coach' },
            { href: '/focus',   afk: 'F',   kleur: '#1D9E75', bg: '#E1F5EE', label: 'Focus' },
            { href: '/journal', afk: 'J',   kleur: '#8B5CF6', bg: '#EEEDFE', label: 'Journal' },
            { href: '/burnout', afk: 'BO',  kleur: '#E24B4A', bg: '#FCEBEB', label: 'Burn-out' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-gray-200 hover:shadow-sm transition text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: t.bg, color: t.kleur }}>{t.afk}</div>
              <span className="text-xs text-gray-600 font-medium leading-tight">{t.label}</span>
            </Link>
          ))}
        </div>

        {laden ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--vitanex-primary)' }} />
          </div>
        ) : checkins.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Nog geen check-ins gedaan.</p>
            <Link href="/checkin" className="text-sm font-medium text-white px-5 py-3 rounded-xl inline-block"
              style={{ background: 'var(--vitanex-primary)' }}>
              Doe je eerste check-in
            </Link>
          </div>
        ) : (
          <>
            {/* Top scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5"
                style={{ borderTop: `3px solid ${totaalScore >= 70 ? '#1D9E75' : totaalScore >= 50 ? '#BA7517' : '#E24B4A'}` }}>
                <p className="text-xs text-gray-400 mb-1">Vitaliteitsscore</p>
                <p className="text-4xl font-medium"
                  style={{ color: totaalScore >= 70 ? '#1D9E75' : totaalScore >= 50 ? '#BA7517' : '#E24B4A' }}>
                  {totaalScore}%
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs text-gray-400 mb-1">Weken op rij</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-4xl font-medium text-gray-900">{streak}</p>
                  <p className="text-xs text-gray-400 font-medium">weken</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs text-gray-400 mb-1">Totaal check-ins</p>
                <p className="text-4xl font-medium text-gray-900">{checkins.length}</p>
              </div>
            </div>

            {/* Tip */}
            {tip() && (
              <div className="rounded-2xl p-4 text-sm mb-4 leading-relaxed"
                style={{ background: '#E6F1FB', borderLeft: '3px solid #378ADD', color: '#185FA5' }}>
                {tip()}
              </div>
            )}

            {/* Burn-out risicosignaal */}
            {(() => {
              if (checkins.length < 3) return null
              const recente = checkins.slice(-4)
              const avgStress = gem(recente.map(c => c.mentaal_stress as number))
              const avgEnergie = gem(recente.map(c => c.energie as number))
              const avgHerstel = gem(recente.map(c => c.herstel as number))
              const risico = (avgStress <= 2 ? 1 : 0) + (avgEnergie <= 2 ? 1 : 0) + (avgHerstel <= 2 ? 1 : 0)
              if (risico === 0) return null
              const niveau = risico >= 3 ? 'hoog' : risico === 2 ? 'matig' : 'laag'
              const config = {
                hoog: { bg: '#FCEBEB', border: '#E24B4A', color: '#A32D2D', label: 'Verhoogd burn-out risico', tekst: 'Meerdere signalen wijzen op mogelijke overbelasting. Neem rust serieus en overweeg een gesprek met de coach.' },
                matig: { bg: '#FAEEDA', border: '#BA7517', color: '#854F0B', label: 'Aandachtspunt', tekst: 'Sommige signalen verdienen aandacht. Gebruik de focus tools of chat met de coach.' },
                laag: { bg: '#FAEEDA', border: '#BA7517', color: '#854F0B', label: 'Let op', tekst: 'Eén indicator vraagt aandacht. Houd je ritme in de gaten en doe volgende week opnieuw een check-in.' },
              }[niveau]
              return (
                <div className="rounded-2xl p-4 mb-4"
                  style={{ background: config.bg, borderLeft: `4px solid ${config.border}` }}>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: config.color }}>{config.label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: config.color }}>{config.tekst}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {avgStress <= 2 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.6)', color: config.color }}>Stress ↓</span>}
                      {avgEnergie <= 2 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.6)', color: config.color }}>Energie ↓</span>}
                      {avgHerstel <= 2 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.6)', color: config.color }}>Herstel ↓</span>}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Category scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {categorieMetrics.map(cat => {
                const score = laatste ? catGem(laatste, cat.keys) : 0
                const d = catDelta(cat.keys)
                return (
                  <div key={cat.label} className="bg-white rounded-2xl border border-gray-100 p-5"
                    style={{ borderTop: `3px solid ${cat.kleur}` }}>
                    <p className="text-xs mb-1" style={{ color: cat.donker }}>{cat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-medium" style={{ color: cat.kleur }}>{score}/5</p>
                      {d !== null && d !== 0 && (
                        <span className="text-xs font-medium" style={{ color: d > 0 ? '#1D9E75' : '#E24B4A' }}>
                          {d > 0 ? `+${d}` : d}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-3">
                      {cat.items.map(item => {
                        const waarde = laatste ? (laatste[item.key] as number) : 0
                        const itemDelta = delta(item.key)
                        return (
                          <div key={item.key as string} className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400 w-16 truncate">{item.label}</span>
                            <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${(waarde / 5) * 100}%`, background: scoreKleur(waarde) }} />
                            </div>
                            <span className="text-xs font-medium w-4 text-right" style={{ color: scoreKleur(waarde) }}>{waarde}</span>
                            {itemDelta !== null && itemDelta !== 0 && (
                              <span className="text-xs w-5" style={{ color: itemDelta > 0 ? '#1D9E75' : '#E24B4A' }}>
                                {itemDelta > 0 ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Habit tracker */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-700">Gewoontes vandaag</p>
                <p className="text-xs text-gray-400">{vandaagLogs.size}/{GEWOONTES.length} voltooid</p>
              </div>
              <div className="flex flex-col gap-2">
                {GEWOONTES.map(g => {
                  const actief = vandaagLogs.has(g.id)
                  const s = berekenGewoontStreak(gewoontLogs, g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGewoonte(g.id)}
                      className="flex items-center gap-3 p-3 rounded-xl transition text-left"
                      style={{ background: actief ? 'var(--vitanex-primary-light)' : '#F8F9FA' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition"
                        style={{
                          background: actief ? 'var(--vitanex-primary)' : '#e5e7eb',
                          color: actief ? 'white' : '#9ca3af',
                        }}
                      >
                        {actief ? '✓' : g.afk}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700">{g.label}</span>
                      {s > 1 && (
                        <span className="text-xs font-medium" style={{ color: '#BA7517' }}>
                          {s}x
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Personal insights */}
            {inzichten && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Persoonlijke inzichten</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3" style={{ background: '#E1F5EE' }}>
                    <p className="text-xs text-gray-500 mb-0.5">Beste dag</p>
                    <p className="text-sm font-semibold capitalize" style={{ color: '#0F6E56' }}>
                      {DAGEN[inzichten.beste.dag]}
                    </p>
                    <p className="text-xs" style={{ color: '#1D9E75' }}>gem. {inzichten.beste.gem}/5</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: '#FCEBEB' }}>
                    <p className="text-xs text-gray-500 mb-0.5">Moeilijkste dag</p>
                    <p className="text-sm font-semibold capitalize" style={{ color: '#A32D2D' }}>
                      {DAGEN[inzichten.slechtste.dag]}
                    </p>
                    <p className="text-xs" style={{ color: '#E24B4A' }}>gem. {inzichten.slechtste.gem}/5</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: '#E6F1FB' }}>
                    <p className="text-xs text-gray-500 mb-0.5">Sterkste punt</p>
                    <p className="text-sm font-semibold" style={{ color: '#185FA5' }}>
                      {metricLabels[inzichten.beste_metric.k]}
                    </p>
                    <p className="text-xs" style={{ color: '#378ADD' }}>gem. {inzichten.beste_metric.gem}/5</p>
                  </div>
                  {inzichten.trend !== null && (
                    <div className="rounded-xl p-3" style={{ background: inzichten.trend >= 0 ? '#E1F5EE' : '#FCEBEB' }}>
                      <p className="text-xs text-gray-500 mb-0.5">Trend (4 weken)</p>
                      <p className="text-sm font-semibold" style={{ color: inzichten.trend >= 0 ? '#0F6E56' : '#A32D2D' }}>
                        {inzichten.trend > 0 ? '↑ Stijgend' : inzichten.trend < 0 ? '↓ Dalend' : '→ Stabiel'}
                      </p>
                      <p className="text-xs" style={{ color: inzichten.trend >= 0 ? '#1D9E75' : '#E24B4A' }}>
                        {inzichten.trend > 0 ? '+' : ''}{inzichten.trend} vs vorige periode
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trend chart */}
            {checkins.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Trend per categorie</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={grafiekData}>
                    <XAxis dataKey="datum" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Line type="monotone" dataKey="Fysiek" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Mentaal" stroke="#378ADD" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Sociaal" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3 justify-center">
                  {[{ label: 'Fysiek', kleur: '#1D9E75' }, { label: 'Mentaal', kleur: '#378ADD' }, { label: 'Sociaal', kleur: '#8B5CF6' }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded-full" style={{ background: l.kleur }} />
                      <span className="text-xs text-gray-400">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anonymous feedback */}
            <div className="mb-6">
              {!feedbackOpen ? (
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="w-full py-3 rounded-2xl border border-dashed border-gray-300 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition"
                >
                  Anonieme feedback sturen naar HR
                </button>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Anonieme feedback</p>
                    <button onClick={() => setFeedbackOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  </div>
                  {feedbackVerstuurd ? (
                    <div className="text-center py-4">
                      <p className="text-sm font-medium mb-1" style={{ color: '#0F6E56' }}>Feedback verstuurd.</p>
                      <p className="text-xs text-gray-400">Bedankt voor je bijdrage.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-3">Jouw naam wordt nooit gedeeld met HR. Volledig anoniem.</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {FEEDBACK_CATS.map(c => (
                          <button key={c} onClick={() => setFeedbackCat(c)}
                            className="text-xs px-3 py-1.5 rounded-full border transition"
                            style={{
                              background: feedbackCat === c ? 'var(--vitanex-primary-light)' : 'transparent',
                              borderColor: feedbackCat === c ? 'var(--vitanex-primary)' : '#e5e7eb',
                              color: feedbackCat === c ? 'var(--vitanex-primary)' : '#6b7280',
                            }}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        value={feedbackTekst}
                        onChange={e => setFeedbackTekst(e.target.value)}
                        placeholder="Schrijf je feedback..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
                      />
                      <button
                        onClick={stuurFeedback}
                        disabled={!feedbackTekst.trim() || feedbackBezig}
                        className="w-full mt-3 py-2.5 rounded-xl text-white text-sm font-medium transition disabled:opacity-40"
                        style={{ background: 'var(--vitanex-primary)' }}
                      >
                        {feedbackBezig ? 'Versturen...' : 'Verstuur anoniem'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {laatste && (
              <p className="text-xs text-gray-400 text-center">
                Laatste check-in: {new Date(laatste.created_at).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
