'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Avatar } from '@/components/Avatar'
import DocumentenSectie from '@/components/DocumentenSectie'
import GesprekkenTab from '@/components/GesprekkenTab'

type TeamTab = 'vitaliteit' | 'gesprekken' | 'dossier'

type Profiel = {
  id: string
  naam: string
  rol: string
  avatar_url: string | null
}

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
  toelichting: string | null
  created_at: string
}

function gem(arr: number[]) {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function scoreKleur(s: number) {
  if (s >= 4) return '#1D9E75'
  if (s >= 2.5) return '#BA7517'
  return '#E24B4A'
}

function catScore(checkins: Checkin[], keys: (keyof Checkin)[]) {
  return gem(keys.map(k => gem(checkins.map(c => c[k] as number))))
}

function initialen(naam: string) {
  const delen = naam.trim().split(' ')
  if (delen.length >= 2) return (delen[0][0] + delen[delen.length - 1][0]).toUpperCase()
  return naam.slice(0, 2).toUpperCase()
}

const rolBadge: Record<string, { label: string; bg: string; color: string }> = {
  hr: { label: 'HR', bg: '#E1F5EE', color: '#0F6E56' },
  admin: { label: 'Staff Vitanex', bg: '#EEEDFE', color: '#3C3489' },
  medewerker: { label: 'Medewerker', bg: '#E6F1FB', color: '#185FA5' },
}

const detailMetrics: { label: string; key: keyof Checkin }[] = [
  { label: 'Energie', key: 'energie' },
  { label: 'Slaap', key: 'slaap' },
  { label: 'Fys. klachten', key: 'fysiek_pijn' },
  { label: 'Beweging', key: 'fysiek_beweging' },
  { label: 'Werkdruk', key: 'werkdruk' },
  { label: 'Focus', key: 'mentaal_focus' },
  { label: 'Stress', key: 'mentaal_stress' },
  { label: 'Balans', key: 'mentaal_balans' },
  { label: 'Motivatie', key: 'motivatie' },
  { label: 'Teamwerk', key: 'sociaal_team' },
  { label: 'Steun', key: 'sociaal_steun' },
  { label: 'Herstel', key: 'herstel' },
]

export default function ProfielPagina() {
  const router = useRouter()
  const params = useParams()
  const profielId = params.id as string

  const [profiel, setProfiel] = useState<Profiel | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [mijnRol, setMijnRol] = useState('')
  const [mijnBedrijfId, setMijnBedrijfId] = useState('')
  const [mijnUserId, setMijnUserId] = useState('')
  const [laden, setLaden] = useState(true)
  const [nieGevonden, setNieGevonden] = useState(false)
  const [herinneringBezig, setHerinneringBezig] = useState(false)
  const [herinneringMelding, setHerinneringMelding] = useState<string | null>(null)
  const [actieveTab, setActieveTab] = useState<TeamTab>('vitaliteit')

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: mijnProfiel } = await supabase
        .from('profiles')
        .select('rol, bedrijf_id')
        .eq('id', user.id)
        .single()

      if (!mijnProfiel) { router.push('/login'); return }
      setMijnRol(mijnProfiel.rol)
      setMijnBedrijfId(mijnProfiel.bedrijf_id)
      setMijnUserId(user.id)

      const { data: doelProfiel } = await supabase
        .from('profiles')
        .select('id, naam, rol, avatar_url')
        .eq('id', profielId)
        .eq('bedrijf_id', mijnProfiel.bedrijf_id)
        .single()

      if (!doelProfiel) { setNieGevonden(true); setLaden(false); return }
      setProfiel(doelProfiel)

      if (mijnProfiel.rol === 'hr' || mijnProfiel.rol === 'admin') {
        const { data } = await supabase
          .from('checkins')
          .select('*')
          .eq('user_id', profielId)
          .order('created_at', { ascending: true })
          .limit(20)
        setCheckins(data || [])
      }

      setLaden(false)
    }
    laadData()
  }, [router, profielId])

  async function stuurHerinnering() {
    setHerinneringBezig(true)
    setHerinneringMelding(null)
    try {
      const res = await fetch('/api/herinnering-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profielId }),
      })
      const json = await res.json()
      if (res.ok) {
        setHerinneringMelding(`Herinnering verstuurd naar ${json.email}`)
      } else {
        setHerinneringMelding(`Fout: ${json.error}`)
      }
    } catch {
      setHerinneringMelding('Er ging iets mis.')
    }
    setHerinneringBezig(false)
  }

  const isHR = mijnRol === 'hr' || mijnRol === 'admin'
  const badge = rolBadge[profiel?.rol ?? 'medewerker'] ?? rolBadge.medewerker

  const fysiekScore = catScore(checkins, ['energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging'])
  const mentaalScore = catScore(checkins, ['werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans'])
  const sociaalScore = catScore(checkins, ['motivatie', 'sociaal_team', 'sociaal_steun', 'herstel'])
  const totaalScore = gem([fysiekScore, mentaalScore, sociaalScore])

  const trendData = checkins.map(c => ({
    datum: new Date(c.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }),
    Score: Math.round(((c.energie + c.slaap + c.fysiek_pijn + c.fysiek_beweging +
                        c.werkdruk + c.mentaal_focus + c.mentaal_stress + c.mentaal_balans +
                        c.motivatie + c.sociaal_team + c.sociaal_steun + c.herstel) / 60) * 100),
  }))

  const toelichtingen = checkins.filter(c => c.toelichting?.trim())

  if (laden) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto p-8 flex justify-center mt-16">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
      </main>
    </div>
  )

  if (nieGevonden) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto p-8 text-center mt-16">
        <p className="text-gray-400 text-sm">Profiel niet gevonden.</p>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline mt-4 inline-block">← Terug</Link>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto p-8">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition">
          ← Terug naar team
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Avatar naam={profiel?.naam || '?'} avatarUrl={profiel?.avatar_url} size={56} />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h1 className="text-xl font-medium text-gray-900">{profiel?.naam}</h1>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                {isHR ? (
                  checkins.length > 0
                    ? <p className="text-sm text-gray-500">{checkins.length} check-in{checkins.length !== 1 ? 's' : ''} gedaan · Laatste op {new Date(checkins[checkins.length - 1].created_at).toLocaleDateString('nl-BE')}</p>
                    : <p className="text-sm text-gray-400">Nog geen check-ins gedaan</p>
                ) : (
                  <p className="text-sm text-gray-400">Teamlid</p>
                )}
              </div>
            </div>
            {isHR && profiel?.rol === 'medewerker' && (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={stuurHerinnering}
                  disabled={herinneringBezig}
                  className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                >
                  {herinneringBezig ? 'Versturen...' : 'Stuur herinnering'}
                </button>
                {herinneringMelding && (
                  <p className="text-xs" style={{ color: herinneringMelding.startsWith('Fout') ? '#A32D2D' : '#0F6E56' }}>
                    {herinneringMelding}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs — alleen voor HR */}
        {isHR && (
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E7EB', marginBottom: 24 }}>
            {([
              ['vitaliteit', '📊 Vitaliteit'],
              ['gesprekken', '💬 Gesprekken'],
              ['dossier', '📁 Dossier'],
            ] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActieveTab(tab)} className="text-sm" style={{
                padding: '9px 16px', fontWeight: 600, border: 'none',
                background: 'transparent', cursor: 'pointer',
                borderBottom: `2px solid ${actieveTab === tab ? '#1D9E75' : 'transparent'}`,
                color: actieveTab === tab ? '#1D9E75' : '#6B7280',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
        )}

        {/* HR-only: scores + detail + trend + toelichtingen */}
        {isHR && actieveTab === 'vitaliteit' && checkins.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-app)', border: `2px solid ${scoreKleur(totaalScore)}` }}>
                <p className="text-xs text-gray-400 mb-1">Totaal</p>
                <p className="text-3xl font-medium" style={{ color: scoreKleur(totaalScore) }}>{totaalScore}/5</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: '#E1F5EE' }}>
                <p className="text-xs mb-1" style={{ color: '#0F6E56' }}>Fysiek</p>
                <p className="text-2xl font-medium" style={{ color: '#1D9E75' }}>{fysiekScore}/5</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: '#E6F1FB' }}>
                <p className="text-xs mb-1" style={{ color: '#185FA5' }}>Mentaal</p>
                <p className="text-2xl font-medium" style={{ color: '#378ADD' }}>{mentaalScore}/5</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: '#EEEDFE' }}>
                <p className="text-xs mb-1" style={{ color: '#3C3489' }}>Sociaal</p>
                <p className="text-2xl font-medium" style={{ color: '#8B5CF6' }}>{sociaalScore}/5</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-4">Scores per indicator</p>
              <div className="grid grid-cols-2 gap-3">
                {detailMetrics.map(m => {
                  const waarde = gem(checkins.map(c => c[m.key] as number))
                  return (
                    <div key={m.label} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'var(--bg-app)' }}>
                      <span className="text-sm text-gray-600">{m.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(waarde / 5) * 100}%`, background: scoreKleur(waarde) }} />
                        </div>
                        <span className="text-sm font-medium w-8 text-right" style={{ color: waarde > 0 ? scoreKleur(waarde) : '#ccc' }}>
                          {waarde > 0 ? waarde : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {checkins.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Vitaliteitstrend</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="datum" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="Score" stroke="var(--mentaforce-primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {toelichtingen.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Anonieme toelichtingen ({toelichtingen.length})</p>
                <div className="flex flex-col gap-3">
                  {toelichtingen.map(c => (
                    <div key={c.id} className="rounded-xl p-4" style={{ background: 'var(--bg-app)', borderLeft: '3px solid var(--mentaforce-primary)' }}>
                      <p className="text-sm text-gray-600 leading-relaxed">"{c.toelichting}"</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleDateString('nl-BE')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {isHR && actieveTab === 'vitaliteit' && checkins.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-6">
            <p className="text-gray-400 text-sm">Deze medewerker heeft nog geen check-ins gedaan.</p>
          </div>
        )}

        {/* Gesprekken tab */}
        {isHR && actieveTab === 'gesprekken' && mijnBedrijfId && mijnUserId && (
          <GesprekkenTab
            bedrijfId={mijnBedrijfId}
            hrUserId={mijnUserId}
            gefilterdOpMedewerker={profielId}
          />
        )}

        {/* Dossier tab */}
        {isHR && actieveTab === 'dossier' && (
          <div className="mt-2">
            <DocumentenSectie
              userId={profielId}
              isHR={true}
              naamMedewerker={profiel?.naam ?? undefined}
            />
          </div>
        )}

        {/* Dossier — altijd zichtbaar voor HR als geen tabs (fallback) */}
        {!isHR && (
          <div className="mt-2">
            <DocumentenSectie
              userId={profielId}
              isHR={false}
              naamMedewerker={profiel?.naam ?? undefined}
            />
          </div>
        )}

      </main>
    </div>
  )
}
