'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/Navbar'
import { Avatar } from '@/components/Avatar'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const WAARSCHUWING_GRENS = 2.5

type Checkin = {
  id: string
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

type TeamLid = {
  id: string
  naam: string
  deze_week_ingevuld: boolean
  laatste_score: number | null
  laatste_checkin: string | null
  avatar_url?: string | null
}

type FeedbackItem = {
  id: string
  inhoud: string
  categorie: string
  aangemaakt_op: string
}

type UserCheckin = Checkin & { user_id: string }

type VerlofHR = {
  id: string
  user_id: string
  type: string
  datum_van: string
  datum_tot: string
  reden: string
  status: 'aangevraagd' | 'goedgekeurd' | 'afgewezen'
  reviewer_notitie?: string | null
  created_at: string
  naam?: string
}

type DeclaratieHR = {
  id: string
  user_id: string
  datum: string
  bedrag: number
  categorie: string
  beschrijving: string
  status: 'ingediend' | 'goedgekeurd' | 'afgewezen'
  reviewer_notitie?: string | null
  created_at: string
  naam?: string
}

function gemiddelde(arr: number[]) {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function scoreKleur(score: number) {
  if (score >= 4) return '#1D9E75'
  if (score >= 2.5) return '#BA7517'
  return '#E24B4A'
}

function scoreBadge(score: number) {
  if (score >= 4) return { bg: '#E1F5EE', color: '#0F6E56', label: 'Goed' }
  if (score >= 2.5) return { bg: '#FAEEDA', color: '#854F0B', label: 'Matig' }
  return { bg: '#FCEBEB', color: '#A32D2D', label: 'Laag' }
}

// ── AI Insights component ────────────────────────────────────────────────────

function AIInsightCard({
  vitaliteitscore,
  teamGrootte,
  ingevuld,
  laagsteMetrics,
  signaalCount,
  checkinCount,
}: {
  vitaliteitscore: number
  teamGrootte: number
  ingevuld: number
  laagsteMetrics: { label: string; score: number }[]
  signaalCount: number
  checkinCount: number
}) {
  const [inzicht, setInzicht] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)

  async function genereer() {
    setLaden(true)
    try {
      const risicos = laagsteMetrics.slice(0, 3).map(m => `${m.label} (${m.score}/5)`).join(', ')
      const resp = await authFetch('/api/coach', {
        method: 'POST',
        body: JSON.stringify({
          maxTokens: 200,
          systeem: `Je bent een HR-analist die bondig advies geeft aan HR-managers. Geef altijd 2-3 concrete, actiegerichte zinnen in het Nederlands. Geen jargon, geen opsommingstekens — gewone alinea.`,
          berichten: [{
            role: 'user',
            content: `Analyseer deze teamdata en geef een kort HR-advies:
- Teamgrootte: ${teamGrootte} medewerkers
- Vitaliteitsscore: ${vitaliteitscore > 0 ? `${vitaliteitscore}/5` : 'geen data'}
- Check-ins deze week: ${ingevuld}/${teamGrootte}
- Totaal check-ins: ${checkinCount}
- Risicosignalen: ${signaalCount}
- Laagste scores: ${risicos || 'onvoldoende data'}

Geef 2-3 zinnen concreet advies. Wat moet HR nu doen?`,
          }],
        }),
      })
      const data = await resp.json()
      setInzicht(data.tekst || 'Geen inzicht beschikbaar.')
    } catch {
      setInzicht('Kon het inzicht niet laden. Probeer opnieuw.')
    }
    setLaden(false)
  }

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ background: '#1a1a2e', borderColor: '#2d2d4e' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(29,158,117,0.3)', color: '#4ECBA5' }}>AI</span>
          <p className="text-sm font-semibold text-white">Teamanalyse</p>
        </div>
        <button
          onClick={genereer}
          disabled={laden}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
        >
          {laden ? (
            <>
              <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin inline-block" />
              Analyseren...
            </>
          ) : (
            inzicht ? 'Vernieuwen' : 'Analyseer team'
          )}
        </button>
      </div>

      {inzicht ? (
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {inzicht}
        </p>
      ) : (
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Klik op "Genereer inzicht" voor een AI-analyse van jouw teamdata.
        </p>
      )}
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [team, setTeam] = useState<TeamLid[]>([])
  const [laden, setLaden] = useState(true)
  const [email, setEmail] = useState('')
  const [actieveTab, setActieveTab] = useState<'overzicht' | 'team' | 'trends' | 'signalen' | 'verlof' | 'declaraties'>('overzicht')
  const [teamZoekterm, setTeamZoekterm] = useState('')
  const [teamFilter, setTeamFilter] = useState<'alle' | 'ingevuld' | 'niet_ingevuld' | 'laag'>('alle')
  const [teamSorteer, setTeamSorteer] = useState<'naam' | 'score'>('naam')
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [userCheckinsMap, setUserCheckinsMap] = useState<Map<string, UserCheckin[]>>(new Map())
  const [verlofAanvragen, setVerlofAanvragen] = useState<VerlofHR[]>([])
  const [declaratiesHR, setDeclaratiesHR] = useState<DeclaratieHR[]>([])

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')

      const { data: profiel } = await supabase
        .from('profiles')
        .select('bedrijf_id, rol')
        .eq('id', user.id)
        .single()

      if (!profiel?.bedrijf_id) { setLaden(false); return }

      const { data: checkinData } = await supabase
        .from('checkins')
        .select('*, profiles!inner(bedrijf_id)')
        .eq('profiles.bedrijf_id', profiel.bedrijf_id)
        .order('created_at', { ascending: true })
        .limit(100)

      setCheckins(checkinData || [])

      const [{ data: teamData }, { data: avatarData }] = await Promise.all([
        supabase.from('checkin_status').select('*').eq('bedrijf_id', profiel.bedrijf_id),
        supabase.from('profiles').select('id, avatar_url').eq('bedrijf_id', profiel.bedrijf_id),
      ])

      const avatarMap = new Map((avatarData ?? []).map(p => [p.id, p.avatar_url as string | null]))
      setTeam((teamData ?? []).map(lid => ({ ...lid, avatar_url: avatarMap.get(lid.id) ?? null })))

      const { data: perUserData } = await supabase
        .from('checkins')
        .select('*, profiles!inner(bedrijf_id)')
        .eq('profiles.bedrijf_id', profiel.bedrijf_id)
        .order('created_at', { ascending: false })
        .limit(200)

      const ucMap = new Map<string, UserCheckin[]>()
      for (const c of (perUserData ?? []) as UserCheckin[]) {
        if (!ucMap.has(c.user_id)) ucMap.set(c.user_id, [])
        const arr = ucMap.get(c.user_id)!
        if (arr.length < 4) arr.push(c)
      }
      setUserCheckinsMap(ucMap)

      const { data: fb } = await supabase
        .from('feedback_hr')
        .select('id, inhoud, categorie, aangemaakt_op')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .order('aangemaakt_op', { ascending: false })
        .limit(50)
      setFeedback(fb || [])

      // Verlof aanvragen
      try {
        const { data: verlofData } = await supabase
          .from('verlof_aanvragen')
          .select('*, profiles!user_id(naam)')
          .eq('bedrijf_id', profiel.bedrijf_id)
          .order('created_at', { ascending: false })
          .limit(100)
        if (verlofData) {
          setVerlofAanvragen((verlofData as unknown as (VerlofHR & { profiles: { naam: string } | null })[]).map(v => ({
            ...v,
            naam: v.profiles?.naam ?? 'Onbekend',
          })))
        }
      } catch { /* table may not exist yet */ }

      // Declaraties
      try {
        const { data: declData } = await supabase
          .from('declaraties')
          .select('*, profiles!user_id(naam)')
          .eq('bedrijf_id', profiel.bedrijf_id)
          .order('created_at', { ascending: false })
          .limit(100)
        if (declData) {
          setDeclaratiesHR((declData as unknown as (DeclaratieHR & { profiles: { naam: string } | null })[]).map(d => ({
            ...d,
            naam: d.profiles?.naam ?? 'Onbekend',
          })))
        }
      } catch { /* table may not exist yet */ }

      setLaden(false)
    }
    laadData()
  }, [router])

  const metricCards = [
    { label: 'Energie', key: 'energie' },
    { label: 'Slaap', key: 'slaap' },
    { label: 'Werkdruk', key: 'werkdruk' },
    { label: 'Motivatie', key: 'motivatie' },
    { label: 'Herstel', key: 'herstel' },
  ]

  const allMetricKeys = [
    'energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging',
    'werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans',
    'motivatie', 'sociaal_team', 'sociaal_steun', 'herstel',
  ] as const

  const metricLabels: Record<string, string> = {
    energie: 'Energie', slaap: 'Slaap', fysiek_pijn: 'Fys. klachten',
    fysiek_beweging: 'Beweging', werkdruk: 'Werkdruk', mentaal_focus: 'Focus',
    mentaal_stress: 'Stress', mentaal_balans: 'Balans', motivatie: 'Motivatie',
    sociaal_team: 'Teamwerk', sociaal_steun: 'Steun', herstel: 'Herstel',
  }

  const vitaliteitscore = gemiddelde(
    allMetricKeys.map(k => gemiddelde(checkins.map(c => c[k])))
  )

  // Week trend
  const weekMap = new Map<string, number[]>()
  for (const c of checkins) {
    const d = new Date(c.created_at)
    const dag = d.getDay() === 0 ? 6 : d.getDay() - 1
    const maandag = new Date(d)
    maandag.setDate(d.getDate() - dag)
    const weekKey = maandag.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
    const score = Math.round((allMetricKeys.reduce((sum, k) => sum + c[k], 0) / 60) * 100)
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, [])
    weekMap.get(weekKey)!.push(score)
  }
  const trendData = [...weekMap.entries()].map(([week, scores]) => ({
    week,
    Score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }))

  const vergelijkingData = allMetricKeys.map(k => ({
    metric: metricLabels[k] ?? k,
    Gemiddelde: gemiddelde(checkins.map(c => c[k])),
  }))

  const laagsteMetrics = [...vergelijkingData]
    .filter(d => d.Gemiddelde > 0)
    .sort((a, b) => a.Gemiddelde - b.Gemiddelde)

  const waarschuwingen = team.filter(l => l.laatste_score !== null && l.laatste_score < WAARSCHUWING_GRENS)
  const nietIngevuld = team.filter(l => !l.deze_week_ingevuld)
  const ingevuld = team.filter(l => l.deze_week_ingevuld)

  const gefilterdTeam = team
    .filter(l => l.naam?.toLowerCase().includes(teamZoekterm.toLowerCase()))
    .filter(l => {
      if (teamFilter === 'ingevuld') return l.deze_week_ingevuld
      if (teamFilter === 'niet_ingevuld') return !l.deze_week_ingevuld
      if (teamFilter === 'laag') return l.laatste_score !== null && l.laatste_score < WAARSCHUWING_GRENS
      return true
    })
    .sort((a, b) => {
      if (teamSorteer === 'score') return (a.laatste_score ?? -1) - (b.laatste_score ?? -1)
      return (a.naam || '').localeCompare(b.naam || '', 'nl')
    })

  // Signalen
  const allKeys2 = ['energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging', 'werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans', 'motivatie', 'sociaal_team', 'sociaal_steun', 'herstel'] as const
  type MetricKey = typeof allKeys2[number]

  function checkinScore(c: UserCheckin) {
    return Math.round((allKeys2.reduce((s, k) => s + c[k], 0) / 60) * 100)
  }

  const signalen: { lid: TeamLid; reden: string; ernst: 'hoog' | 'matig' }[] = []
  for (const lid of team) {
    const recents = userCheckinsMap.get(lid.id) ?? []
    if (recents.length >= 2) {
      const scores = recents.slice(0, 2).map(checkinScore)
      const daling = scores[1] - scores[0]
      if (daling >= 15) {
        signalen.push({ lid, reden: `Score daalde ${daling}pt in laatste 2 check-ins`, ernst: daling >= 25 ? 'hoog' : 'matig' })
        continue
      }
    }
    if (recents.length >= 1) {
      const laagsteKey = allKeys2.reduce((best: MetricKey, k: MetricKey) =>
        recents[0][k] < recents[0][best] ? k : best, allKeys2[0])
      const laagsteScore = recents[0][laagsteKey]
      if (laagsteScore <= 1.5) {
        const label = metricLabels[laagsteKey] ?? laagsteKey
        signalen.push({ lid, reden: `${label} staat kritiek laag (${laagsteScore}/5)`, ernst: 'hoog' })
        continue
      }
    }
    if (lid.laatste_checkin) {
      const dagenGeleden = Math.floor((Date.now() - new Date(lid.laatste_checkin).getTime()) / (1000 * 60 * 60 * 24))
      if (dagenGeleden >= 14) {
        signalen.push({ lid, reden: `${dagenGeleden} dagen geen check-in`, ernst: 'matig' })
      }
    }
  }
  signalen.sort((a, b) => (a.ernst === 'hoog' ? -1 : 1) - (b.ernst === 'hoog' ? -1 : 1))

  const pendingVerlof = verlofAanvragen.filter(v => v.status === 'aangevraagd').length
  const pendingDeclaraties = declaratiesHR.filter(d => d.status === 'ingediend').length

  const tabs = [
    { key: 'overzicht', label: 'Overzicht' },
    { key: 'team', label: `Team (${team.length})` },
    { key: 'trends', label: 'Trends' },
    { key: 'signalen', label: `Signalen${signalen.length > 0 ? ` (${signalen.length})` : ''}` },
    { key: 'verlof', label: `Verlof${pendingVerlof > 0 ? ` (${pendingVerlof})` : ''}` },
    { key: 'declaraties', label: `Declaraties${pendingDeclaraties > 0 ? ` (${pendingDeclaraties})` : ''}` },
  ]

  // Participation rate
  const participatieRate = team.length > 0 ? Math.round((ingevuld.length / team.length) * 100) : 0
  const burnoutRisico = team.length > 0
    ? Math.round((waarschuwingen.length / team.length) * 100)
    : 0

  return (
    <div className="min-h-screen" style={{ background: '#F0F4FF' }}>
      <Navbar />

      {/* HR portal identity banner */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid #1e293b' }}>
        <div className="px-6 sm:px-8 py-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: '#185FA5' }}>HR</div>
          <p className="text-sm font-medium text-white">HR Portaal</p>
          <span className="text-gray-500 text-xs">—</span>
          <p className="text-xs text-gray-400">Teamwelzijn en vitaliteitsdata van jouw organisatie</p>
        </div>
      </div>

      <main className="p-6 sm:p-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">HR-dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">{email}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 text-center">
              <p className="text-lg font-semibold text-gray-900">{participatieRate}%</p>
              <p className="text-xs text-gray-400">Participatie</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 text-center">
              <p className="text-lg font-semibold text-gray-900">{ingevuld.length}/{team.length}</p>
              <p className="text-xs text-gray-400">Check-ins week</p>
            </div>
            {signalen.length > 0 && (
              <div className="rounded-xl border px-4 py-2.5 text-center"
                style={{ background: '#FCEBEB', borderColor: '#F09595' }}>
                <p className="text-lg font-semibold" style={{ color: '#A32D2D' }}>{signalen.length}</p>
                <p className="text-xs" style={{ color: '#A32D2D' }}>Signalen</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActieveTab(t.key as typeof actieveTab)}
              className="px-4 py-2 rounded-lg text-sm transition whitespace-nowrap"
              style={{
                background: actieveTab === t.key ? 'white' : 'transparent',
                color: actieveTab === t.key ? '#111' : '#888',
                fontWeight: actieveTab === t.key ? 500 : 400,
                boxShadow: actieveTab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {laden ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-gray-200 animate-spin"
              style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
          </div>
        ) : (
          <>
            {actieveTab === 'overzicht' && (
              <>
                {/* AI Insights */}
                <AIInsightCard
                  vitaliteitscore={vitaliteitscore}
                  teamGrootte={team.length}
                  ingevuld={ingevuld.length}
                  laagsteMetrics={laagsteMetrics.map(m => ({ label: m.metric, score: m.Gemiddelde }))}
                  signaalCount={signalen.length}
                  checkinCount={checkins.length}
                />

                {/* Risk alerts */}
                {waarschuwingen.length > 0 && (
                  <div className="rounded-2xl p-5 mb-4" style={{ background: '#FCEBEB', borderLeft: '4px solid #E24B4A' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#A32D2D' }}>
                      Lage vitaliteitscore — {burnoutRisico}% van het team
                    </p>
                    <p className="text-sm" style={{ color: '#A32D2D' }}>
                      {waarschuwingen.length} medewerker{waarschuwingen.length > 1 ? 's scoren' : ' scoort'} onder 2.5/5.
                      Overweeg een persoonlijk gesprek of check de signalen-tab.
                    </p>
                  </div>
                )}

                {nietIngevuld.length > 0 && (
                  <div className="rounded-2xl p-5 mb-6" style={{ background: '#FAEEDA', borderLeft: '4px solid #BA7517' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#854F0B' }}>
                      Check-in herinnering
                    </p>
                    <p className="text-sm" style={{ color: '#854F0B' }}>
                      {nietIngevuld.length} medewerker{nietIngevuld.length > 1 ? 's hebben' : ' heeft'} de check-in nog niet ingevuld deze week.
                    </p>
                  </div>
                )}

                {/* Scores grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div
                    className="bg-white rounded-2xl border border-gray-100 p-6 col-span-2 sm:col-span-1"
                    style={{ borderTop: '3px solid var(--mentaforce-primary)' }}
                  >
                    <p className="text-xs text-gray-400 mb-1">Vitaliteitsscore</p>
                    <p className="text-5xl font-medium" style={{ color: vitaliteitscore > 0 ? scoreKleur(vitaliteitscore) : '#ccc' }}>
                      {vitaliteitscore > 0 ? `${vitaliteitscore}/5` : '—'}
                    </p>
                    {checkins.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">{checkins.length} check-ins totaal</p>
                    )}
                  </div>
                  {metricCards.map(m => {
                    const waarde = gemiddelde(checkins.map(c => c[m.key as keyof Checkin] as number))
                    const badge = waarde > 0 ? scoreBadge(waarde) : null
                    return (
                      <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                        <p className="text-2xl font-medium" style={{ color: waarde > 0 ? scoreKleur(waarde) : '#ccc' }}>
                          {waarde > 0 ? waarde : '—'}
                        </p>
                        {badge && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                            style={{ background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Participation visual */}
                {team.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-gray-700">Participatie deze week</p>
                      <span className="text-sm font-semibold" style={{ color: participatieRate >= 70 ? '#1D9E75' : participatieRate >= 40 ? '#BA7517' : '#E24B4A' }}>
                        {ingevuld.length}/{team.length}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${participatieRate}%`,
                          background: participatieRate >= 70 ? '#1D9E75' : participatieRate >= 40 ? '#BA7517' : '#E24B4A',
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {participatieRate >= 80 ? 'Uitstekende participatie' :
                        participatieRate >= 50 ? 'Goede participatie, ruimte voor verbetering' :
                          'Lage participatie — overweeg een herinnering te sturen'}
                    </p>
                  </div>
                )}

                {checkins.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mt-4">
                    <p className="text-gray-400 text-sm">Nog geen check-ins. Nodig medewerkers uit via de Team-pagina.</p>
                  </div>
                )}
              </>
            )}

            {actieveTab === 'team' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                  <p className="text-sm font-medium text-gray-700 flex-1">Teamoverzicht</p>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Zoek op naam..."
                      value={teamZoekterm}
                      onChange={e => setTeamZoekterm(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-gray-400 w-36"
                    />
                    <select
                      value={teamFilter}
                      onChange={e => setTeamFilter(e.target.value as typeof teamFilter)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gray-400 bg-white"
                    >
                      <option value="alle">Alle</option>
                      <option value="ingevuld">Ingevuld</option>
                      <option value="niet_ingevuld">Niet ingevuld</option>
                      <option value="laag">Lage score</option>
                    </select>
                    <select
                      value={teamSorteer}
                      onChange={e => setTeamSorteer(e.target.value as typeof teamSorteer)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gray-400 bg-white"
                    >
                      <option value="naam">Sorteer: naam</option>
                      <option value="score">Sorteer: score</option>
                    </select>
                  </div>
                </div>
                {team.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nog geen medewerkers.</p>
                ) : gefilterdTeam.length === 0 ? (
                  <p className="text-gray-400 text-sm">Geen leden gevonden.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {gefilterdTeam.map(lid => {
                      const badge = lid.laatste_score !== null ? scoreBadge(lid.laatste_score) : null
                      return (
                        <Link
                          key={lid.id}
                          href={`/team/${lid.id}`}
                          className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-xl px-2 -mx-2 transition"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar naam={lid.naam || '?'} avatarUrl={lid.avatar_url} size={32} />
                            <div>
                              <p className="text-sm font-medium text-gray-700">{lid.naam || 'Onbekend'}</p>
                              <p className="text-xs text-gray-400">
                                {lid.laatste_checkin
                                  ? `Laatst: ${new Date(lid.laatste_checkin).toLocaleDateString('nl-BE')}`
                                  : 'Nog nooit ingevuld'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {badge && (
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ background: badge.bg, color: badge.color }}>
                                {lid.laatste_score}/5
                              </span>
                            )}
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                              style={{
                                background: lid.deze_week_ingevuld ? '#E1F5EE' : '#FAEEDA',
                                color: lid.deze_week_ingevuld ? '#0F6E56' : '#854F0B',
                              }}>
                              {lid.deze_week_ingevuld ? '✓' : '○'}
                            </span>
                            <span className="text-gray-300 text-sm">›</span>
                          </div>
                        </Link>
                      )
                    })}
                    {(teamZoekterm || teamFilter !== 'alle') && (
                      <p className="text-xs text-gray-400 pt-2">{gefilterdTeam.length} van {team.length} leden</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {actieveTab === 'signalen' && (
              <>
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Vroege waarschuwingssignalen</p>
                  {signalen.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                      <p className="text-sm text-gray-500">Geen alarmsignalen gedetecteerd.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {signalen.map(({ lid, reden, ernst }) => (
                        <div key={lid.id} className="bg-white rounded-2xl border p-4 flex items-center gap-4"
                          style={{ borderColor: ernst === 'hoog' ? '#F09595' : '#FAC775', borderLeft: `4px solid ${ernst === 'hoog' ? '#E24B4A' : '#BA7517'}` }}>
                          <div
                            className="flex-shrink-0 w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: ernst === 'hoog' ? '#E24B4A' : '#BA7517' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Avatar naam={lid.naam || '?'} avatarUrl={lid.avatar_url} size={22} />
                              <p className="text-sm font-medium text-gray-800">{lid.naam}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: ernst === 'hoog' ? '#FCEBEB' : '#FAEEDA',
                                  color: ernst === 'hoog' ? '#A32D2D' : '#854F0B',
                                }}>
                                {ernst === 'hoog' ? 'Hoog risico' : 'Let op'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{reden}</p>
                          </div>
                          <Link
                            href={`/team/${lid.id}`}
                            className="flex-shrink-0 text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition"
                          >
                            Profiel
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous feedback */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Anonieme feedback ({feedback.length})
                  </p>
                  {feedback.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                      <p className="text-sm text-gray-400">Nog geen anonieme feedback.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {feedback.map(f => (
                        <div key={f.id} className="bg-white rounded-2xl border border-gray-100 p-4"
                          style={{ borderLeft: '3px solid var(--mentaforce-primary)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                              style={{ background: '#E6F1FB', color: '#185FA5' }}>
                              {f.categorie}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(f.aangemaakt_op).toLocaleDateString('nl-BE')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">"{f.inhoud}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {actieveTab === 'trends' && (
              <>
                {checkins.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <p className="text-sm text-gray-400">Nog geen data voor trends.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-4">Vitaliteitstrend over tijd</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                          <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                          <Line type="monotone" dataKey="Score" stroke="var(--mentaforce-primary)" strokeWidth={2.5}
                            dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-4">Gemiddelde score per metric</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={vergelijkingData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => [`${v}/5`, 'Gemiddelde']} />
                          <Bar dataKey="Gemiddelde" radius={[6, 6, 0, 0]}
                            fill="var(--mentaforce-primary)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Top 3 aandachtspunten */}
                    {laagsteMetrics.length >= 3 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { label: '🔴 Meeste aandacht nodig', items: laagsteMetrics.slice(0, 3), kleur: '#E24B4A', bg: '#FCEBEB' },
                          { label: '🟡 Kan beter', items: laagsteMetrics.slice(3, 6), kleur: '#BA7517', bg: '#FAEEDA' },
                          { label: '🟢 Gaat goed', items: [...laagsteMetrics].reverse().slice(0, 3), kleur: '#1D9E75', bg: '#E1F5EE' },
                        ].map(groep => (
                          <div key={groep.label} className="rounded-2xl p-4" style={{ background: groep.bg }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: groep.kleur }}>{groep.label}</p>
                            {groep.items.map(item => (
                              <div key={item.metric} className="flex items-center justify-between py-1">
                                <span className="text-xs text-gray-700">{item.metric}</span>
                                <span className="text-xs font-bold" style={{ color: groep.kleur }}>{item.Gemiddelde}/5</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {actieveTab === 'verlof' && (
              <VerlofTab
                aanvragen={verlofAanvragen}
                onUpdate={(id, status, notitie) => {
                  setVerlofAanvragen(prev => prev.map(v => v.id === id ? { ...v, status, reviewer_notitie: notitie } : v))
                }}
              />
            )}

            {actieveTab === 'declaraties' && (
              <DeclaratiesTab
                declaraties={declaratiesHR}
                onUpdate={(id, status, notitie) => {
                  setDeclaratiesHR(prev => prev.map(d => d.id === id ? { ...d, status, reviewer_notitie: notitie } : d))
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ── Verlof Tab ───────────────────────────────────────────────────────────────

type VerlofTabProps = {
  aanvragen: VerlofHR[]
  onUpdate: (id: string, status: 'goedgekeurd' | 'afgewezen', notitie: string) => void
}

const VERLOF_TYPE_LABELS: Record<string, string> = {
  vakantie: '🌴 Vakantie', ziekte: '🤒 Ziekte', bijzonder: '⭐ Bijzonder',
  onbetaald: '💼 Onbetaald', overig: '📋 Overig',
}

function VerlofTab({ aanvragen, onUpdate }: VerlofTabProps) {
  const [notities, setNotities] = useState<Record<string, string>>({})
  const [verwerking, setVerwerking] = useState<string | null>(null)

  async function behandel(id: string, status: 'goedgekeurd' | 'afgewezen') {
    setVerwerking(id)
    const { error } = await supabase.from('verlof_aanvragen').update({
      status,
      reviewer_notitie: notities[id]?.trim() || null,
    }).eq('id', id)
    if (!error) onUpdate(id, status, notities[id]?.trim() || '')
    setVerwerking(null)
  }

  const pending = aanvragen.filter(v => v.status === 'aangevraagd')
  const behandeld = aanvragen.filter(v => v.status !== 'aangevraagd')

  function dagenTekst(van: string, tot: string) {
    const d = Math.max(1, Math.round((new Date(tot).getTime() - new Date(van).getTime()) / 86400000) + 1)
    return `${d} dag${d !== 1 ? 'en' : ''}`
  }

  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">In behandeling ({pending.length})</p>
          <div className="flex flex-col gap-3">
            {pending.map(v => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4"
                style={{ borderLeft: '4px solid #BA7517' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{v.naam}</p>
                    <p className="text-xs text-gray-500">
                      {VERLOF_TYPE_LABELS[v.type] ?? v.type} ·{' '}
                      {new Date(v.datum_van).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                      {v.datum_van !== v.datum_tot ? ` – ${new Date(v.datum_tot).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}` : ''}
                      {' '}· {dagenTekst(v.datum_van, v.datum_tot)}
                    </p>
                    {v.reden && <p className="text-xs text-gray-400 mt-1">"{v.reden}"</p>}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: '#FAEEDA', color: '#854F0B' }}>In behandeling</span>
                </div>
                <input
                  type="text"
                  placeholder="Optionele notitie voor medewerker..."
                  value={notities[v.id] ?? ''}
                  onChange={e => setNotities(prev => ({ ...prev, [v.id]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={() => behandel(v.id, 'goedgekeurd')}
                    disabled={verwerking === v.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                    style={{ background: '#1D9E75' }}>
                    ✓ Goedkeuren
                  </button>
                  <button onClick={() => behandel(v.id, 'afgewezen')}
                    disabled={verwerking === v.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                    style={{ background: '#E24B4A' }}>
                    ✗ Afwijzen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {behandeld.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Behandeld ({behandeld.length})</p>
          <div className="flex flex-col gap-2">
            {behandeld.map(v => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{v.naam}</p>
                  <p className="text-xs text-gray-400">
                    {VERLOF_TYPE_LABELS[v.type] ?? v.type} ·{' '}
                    {new Date(v.datum_van).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                    {v.datum_van !== v.datum_tot ? ` – ${new Date(v.datum_tot).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={v.status === 'goedgekeurd'
                    ? { background: '#E1F5EE', color: '#0F6E56' }
                    : { background: '#FCEBEB', color: '#A32D2D' }}>
                  {v.status === 'goedgekeurd' ? '✓ Goedgekeurd' : '✗ Afgewezen'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {aanvragen.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-3xl mb-2">🌴</p>
          <p className="text-sm text-gray-400">Geen verlofaanvragen.</p>
        </div>
      )}
    </div>
  )
}

// ── Declaraties Tab ──────────────────────────────────────────────────────────

type DeclaratiesTabProps = {
  declaraties: DeclaratieHR[]
  onUpdate: (id: string, status: 'goedgekeurd' | 'afgewezen', notitie: string) => void
}

const DECL_CAT_LABELS: Record<string, string> = {
  reiskosten: '🚗 Reiskosten', maaltijd: '🍽️ Maaltijd', materiaal: '📦 Materiaal',
  training: '🎓 Training', representatie: '🤝 Representatie', overig: '💰 Overig',
}

function DeclaratiesTab({ declaraties, onUpdate }: DeclaratiesTabProps) {
  const [notities, setNotities] = useState<Record<string, string>>({})
  const [verwerking, setVerwerking] = useState<string | null>(null)

  async function behandel(id: string, status: 'goedgekeurd' | 'afgewezen') {
    setVerwerking(id)
    const { error } = await supabase.from('declaraties').update({
      status,
      reviewer_notitie: notities[id]?.trim() || null,
    }).eq('id', id)
    if (!error) onUpdate(id, status, notities[id]?.trim() || '')
    setVerwerking(null)
  }

  const pending = declaraties.filter(d => d.status === 'ingediend')
  const behandeld = declaraties.filter(d => d.status !== 'ingediend')
  const totaalOpenstaand = pending.reduce((s, d) => s + d.bedrag, 0)

  return (
    <div>
      {totaalOpenstaand > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex items-center justify-between">
          <p className="text-sm text-gray-600">Totaal openstaand</p>
          <p className="text-lg font-bold" style={{ color: '#8B5CF6' }}>
            €{totaalOpenstaand.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">In behandeling ({pending.length})</p>
          <div className="flex flex-col gap-3">
            {pending.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4"
                style={{ borderLeft: '4px solid #8B5CF6' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{d.naam}</p>
                    <p className="text-xs text-gray-500">
                      {DECL_CAT_LABELS[d.categorie] ?? d.categorie} ·{' '}
                      {new Date(d.datum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.beschrijving}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 flex-shrink-0">
                    €{d.bedrag.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Optionele notitie..."
                  value={notities[d.id] ?? ''}
                  onChange={e => setNotities(prev => ({ ...prev, [d.id]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={() => behandel(d.id, 'goedgekeurd')}
                    disabled={verwerking === d.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                    style={{ background: '#1D9E75' }}>
                    ✓ Goedkeuren
                  </button>
                  <button onClick={() => behandel(d.id, 'afgewezen')}
                    disabled={verwerking === d.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                    style={{ background: '#E24B4A' }}>
                    ✗ Afwijzen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {behandeld.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Behandeld ({behandeld.length})</p>
          <div className="flex flex-col gap-2">
            {behandeld.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{d.naam}</p>
                  <p className="text-xs text-gray-400">
                    {DECL_CAT_LABELS[d.categorie] ?? d.categorie} · {d.beschrijving}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-700">€{d.bedrag.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}</p>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={d.status === 'goedgekeurd'
                      ? { background: '#E1F5EE', color: '#0F6E56' }
                      : { background: '#FCEBEB', color: '#A32D2D' }}>
                    {d.status === 'goedgekeurd' ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {declaraties.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-3xl mb-2">💰</p>
          <p className="text-sm text-gray-400">Geen declaraties ingediend.</p>
        </div>
      )}
    </div>
  )
}
