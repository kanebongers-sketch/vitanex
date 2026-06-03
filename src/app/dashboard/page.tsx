'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/Navbar'
import { Avatar } from '@/components/Avatar'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import GesprekkenTab from '@/components/GesprekkenTab'

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

type Gesprek = {
  id: string
  medewerker_naam: string
  datum: string
  type: string
}

type BedrijfInfo = {
  id: string
  naam: string
  hr_code: string
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
          Klik op &quot;Analyseer team&quot; voor een AI-analyse van jouw teamdata.
        </p>
      )}
    </div>
  )
}

// ── KPI Cards row ────────────────────────────────────────────────────────────

function KPICards({
  participatieRate,
  ingevuld,
  teamGrootte,
  signaalCount,
  pendingVerlof,
  pendingDeclaraties,
  onTabSwitch,
}: {
  participatieRate: number
  ingevuld: number
  teamGrootte: number
  signaalCount: number
  pendingVerlof: number
  pendingDeclaraties: number
  onTabSwitch: (tab: string) => void
}) {
  const kpis = [
    {
      label: 'Participatie',
      value: `${participatieRate}%`,
      sub: `${ingevuld}/${teamGrootte} check-ins`,
      color: participatieRate >= 70 ? '#1D9E75' : participatieRate >= 40 ? '#BA7517' : '#E24B4A',
      bg: participatieRate >= 70 ? '#E1F5EE' : participatieRate >= 40 ? '#FAEEDA' : '#FCEBEB',
      tab: null,
    },
    {
      label: 'Actieve signalen',
      value: String(signaalCount),
      sub: signaalCount === 0 ? 'Geen aandachtspunten' : `${signaalCount} risico${signaalCount !== 1 ? 's' : ''}`,
      color: signaalCount > 0 ? '#E24B4A' : '#1D9E75',
      bg: signaalCount > 0 ? '#FCEBEB' : '#E1F5EE',
      tab: 'signalen',
    },
    {
      label: 'Open verlof',
      value: String(pendingVerlof),
      sub: pendingVerlof === 0 ? 'Alles behandeld' : `${pendingVerlof} te behandelen`,
      color: pendingVerlof > 0 ? '#BA7517' : '#1D9E75',
      bg: pendingVerlof > 0 ? '#FAEEDA' : '#E1F5EE',
      tab: 'verlof',
    },
    {
      label: 'Open declaraties',
      value: String(pendingDeclaraties),
      sub: pendingDeclaraties === 0 ? 'Alles behandeld' : `${pendingDeclaraties} te behandelen`,
      color: pendingDeclaraties > 0 ? '#8B5CF6' : '#1D9E75',
      bg: pendingDeclaraties > 0 ? '#EDE9FE' : '#E1F5EE',
      tab: 'declaraties',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {kpis.map(kpi => (
        <div
          key={kpi.label}
          onClick={() => kpi.tab && onTabSwitch(kpi.tab)}
          className="bg-white rounded-2xl border border-gray-100 p-4"
          style={{ cursor: kpi.tab ? 'pointer' : 'default', borderTop: `3px solid ${kpi.color}` }}
        >
          <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
          <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          <p className="text-xs mt-1" style={{ color: kpi.color }}>{kpi.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ── Snelkoppelingen row ──────────────────────────────────────────────────────

function Snelkoppelingen({
  hrCode,
  onTabSwitch,
  onNieuwMedewerker,
}: {
  hrCode: string
  onTabSwitch: (tab: string) => void
  onNieuwMedewerker: () => void
}) {
  const [gekopieerd, setGekopieerd] = useState(false)

  function kopieerCode() {
    navigator.clipboard.writeText(hrCode).then(() => {
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 2000)
    })
  }

  const acties = [
    {
      icon: '💬',
      label: 'Nieuw gesprek',
      sub: 'Plannen',
      onClick: () => onTabSwitch('gesprekken'),
      color: '#185FA5',
      bg: '#E6F1FB',
    },
    {
      icon: '🔔',
      label: 'Herinnering',
      sub: 'Stuur naar team',
      onClick: () => onTabSwitch('team'),
      color: '#BA7517',
      bg: '#FAEEDA',
    },
    {
      icon: '📅',
      label: 'Nieuw rooster',
      sub: 'Plannen',
      onClick: () => onTabSwitch('roosters'),
      color: '#8B5CF6',
      bg: '#EDE9FE',
    },
    {
      icon: '🔑',
      label: hrCode ? `Code: ${hrCode}` : 'HR Code',
      sub: gekopieerd ? 'Gekopieerd!' : 'Klik om te kopieren',
      onClick: kopieerCode,
      color: '#1D9E75',
      bg: '#E1F5EE',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {acties.map(actie => (
        <button
          key={actie.label}
          onClick={actie.onClick}
          className="rounded-2xl p-4 text-left transition hover:opacity-80"
          style={{ background: actie.bg, border: `1px solid ${actie.color}20` }}
        >
          <span className="text-2xl block mb-2">{actie.icon}</span>
          <p className="text-sm font-semibold" style={{ color: actie.color }}>{actie.label}</p>
          <p className="text-xs mt-0.5" style={{ color: actie.color, opacity: 0.7 }}>{actie.sub}</p>
        </button>
      ))}
    </div>
  )
}

// ── Aankomende Gesprekken Widget ─────────────────────────────────────────────

function AankomendeGesprekken({ gesprekken }: { gesprekken: Gesprek[] }) {
  const aankomend = gesprekken
    .filter(g => new Date(g.datum) >= new Date())
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
    .slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-sm font-medium text-gray-700 mb-3">Aankomende gesprekken</p>
      {aankomend.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">Geen geplande gesprekken.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {aankomend.map(g => (
            <div key={g.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: '#E6F1FB' }}>
                <span className="text-xs font-bold leading-none" style={{ color: '#185FA5' }}>
                  {new Date(g.datum).getDate()}
                </span>
                <span className="text-[9px] leading-none" style={{ color: '#185FA5' }}>
                  {new Date(g.datum).toLocaleDateString('nl-BE', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{g.medewerker_naam}</p>
                <p className="text-xs text-gray-400">{g.type}</p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">
                {new Date(g.datum).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Verlof Kalender Mini Widget ──────────────────────────────────────────────

function VerlofKalenderWidget({ verlofAanvragen }: { verlofAanvragen: VerlofHR[] }) {
  const now = new Date()
  const jaar = now.getFullYear()
  const maand = now.getMonth()
  const eerstedag = new Date(jaar, maand, 1).getDay()
  const offset = eerstedag === 0 ? 6 : eerstedag - 1
  const aantalDagenInMaand = new Date(jaar, maand + 1, 0).getDate()

  const goedgekeurdVerlof = verlofAanvragen.filter(v => v.status === 'goedgekeurd')

  function heeftVerlof(dag: number) {
    const datum = new Date(jaar, maand, dag)
    return goedgekeurdVerlof.some(v => {
      const van = new Date(v.datum_van)
      const tot = new Date(v.datum_tot)
      return datum >= van && datum <= tot
    })
  }

  const dagletters = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-sm font-medium text-gray-700 mb-3">
        Verlofkalender — {now.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dagletters.map(d => (
          <p key={d} className="text-center text-[10px] font-medium text-gray-400">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`leeg-${i}`} />
        ))}
        {Array.from({ length: aantalDagenInMaand }).map((_, i) => {
          const dag = i + 1
          const isVandaag = dag === now.getDate()
          const isVerlof = heeftVerlof(dag)
          return (
            <div
              key={dag}
              className="aspect-square flex items-center justify-center rounded-md text-[11px] font-medium"
              style={{
                background: isVerlof ? '#E1F5EE' : isVandaag ? '#0F172A' : 'transparent',
                color: isVerlof ? '#1D9E75' : isVandaag ? 'white' : '#6b7280',
              }}
            >
              {dag}
            </div>
          )
        })}
      </div>
      {goedgekeurdVerlof.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {goedgekeurdVerlof.length} goedgekeurd verlof{goedgekeurdVerlof.length !== 1 ? 'en' : ''} actief
        </p>
      )}
    </div>
  )
}

// ── Bulk Acties Component (voor Team tab) ────────────────────────────────────

function BulkActies({
  team,
  gefilterdTeam,
  onHerinnering,
}: {
  team: TeamLid[]
  gefilterdTeam: TeamLid[]
  onHerinnering: (leden: TeamLid[]) => void
}) {
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())
  const [uitgevouwen, setUitgevouwen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const laagScorendeLeden = team.filter(l => l.laatste_score !== null && l.laatste_score < WAARSCHUWING_GRENS)
  const nietIngevuld = team.filter(l => !l.deze_week_ingevuld)

  function selecteerGroep(leden: TeamLid[]) {
    setGeselecteerd(new Set(leden.map(l => l.id)))
  }

  function toggleLid(id: string) {
    setGeselecteerd(prev => {
      const volgende = new Set(prev)
      if (volgende.has(id)) volgende.delete(id)
      else volgende.add(id)
      return volgende
    })
  }

  async function stuurHerinnering() {
    const doelwitten = gefilterdTeam.filter(l => geselecteerd.has(l.id))
    if (doelwitten.length === 0) return
    setBezig(true)
    // In werkelijkheid: API call naar /api/herinnering met user IDs
    await new Promise(r => setTimeout(r, 800))
    onHerinnering(doelwitten)
    setFeedback(`Herinnering verstuurd naar ${doelwitten.length} medewerker${doelwitten.length !== 1 ? 's' : ''}.`)
    setGeselecteerd(new Set())
    setBezig(false)
    setTimeout(() => setFeedback(null), 4000)
  }

  function exporteerCSV() {
    const rijen = [
      ['Naam', 'Score', 'Laatste check-in', 'Deze week ingevuld'],
      ...gefilterdTeam.map(l => [
        l.naam || 'Onbekend',
        l.laatste_score !== null ? String(l.laatste_score) : '-',
        l.laatste_checkin ? new Date(l.laatste_checkin).toLocaleDateString('nl-BE') : 'Nooit',
        l.deze_week_ingevuld ? 'Ja' : 'Nee',
      ]),
    ]
    const csv = rijen.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <button
          onClick={exporteerCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 transition"
          style={{ color: '#374151' }}
        >
          ↓ Exporteer CSV
        </button>
        <button
          onClick={() => setUitgevouwen(u => !u)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
          style={{
            background: uitgevouwen ? '#0F172A' : 'white',
            color: uitgevouwen ? 'white' : '#374151',
            borderColor: uitgevouwen ? '#0F172A' : '#e5e7eb',
          }}
        >
          Bulk acties {geselecteerd.size > 0 ? `(${geselecteerd.size})` : ''}
        </button>
        {laagScorendeLeden.length > 0 && (
          <button
            onClick={() => { selecteerGroep(laagScorendeLeden); setUitgevouwen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F09595' }}
          >
            Selecteer lage scores ({laagScorendeLeden.length})
          </button>
        )}
        {nietIngevuld.length > 0 && (
          <button
            onClick={() => { selecteerGroep(nietIngevuld); setUitgevouwen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ background: '#FAEEDA', color: '#854F0B', border: '1px solid #FAC775' }}
          >
            Selecteer niet ingevuld ({nietIngevuld.length})
          </button>
        )}
      </div>

      {uitgevouwen && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">
              {geselecteerd.size} medewerker{geselecteerd.size !== 1 ? 's' : ''} geselecteerd
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setGeselecteerd(new Set(gefilterdTeam.map(l => l.id)))}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Alles
              </button>
              <button
                onClick={() => setGeselecteerd(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Wis
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 max-h-28 overflow-y-auto">
            {gefilterdTeam.map(lid => (
              <button
                key={lid.id}
                onClick={() => toggleLid(lid.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition"
                style={{
                  background: geselecteerd.has(lid.id) ? '#0F172A' : 'white',
                  color: geselecteerd.has(lid.id) ? 'white' : '#374151',
                  border: `1px solid ${geselecteerd.has(lid.id) ? '#0F172A' : '#e5e7eb'}`,
                }}
              >
                {lid.naam}
              </button>
            ))}
          </div>
          <button
            onClick={stuurHerinnering}
            disabled={geselecteerd.size === 0 || bezig}
            className="w-full py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition"
            style={{ background: '#BA7517' }}
          >
            {bezig ? 'Versturen...' : `Stuur herinnering (${geselecteerd.size})`}
          </button>
        </div>
      )}

      {feedback && (
        <div className="rounded-xl p-3 text-xs font-medium mb-3" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
          {feedback}
        </div>
      )}
    </div>
  )
}

// ── Medewerker uitnodigen modal ──────────────────────────────────────────────

function MedewerkerUitnodigenModal({ onSluit, hrCode }: { onSluit: () => void; hrCode: string }) {
  const [emailInput, setEmailInput] = useState('')
  const [naamInput, setNaamInput] = useState('')
  const [bezig, setBezig] = useState(false)
  const [resultaat, setResultaat] = useState<{ ok: boolean; bericht: string } | null>(null)

  async function stuurUitnodiging(e: React.FormEvent) {
    e.preventDefault()
    if (!emailInput.trim()) return
    setBezig(true)
    try {
      // In werkelijkheid: POST /api/uitnodiging met email, naam, hrCode
      await new Promise(r => setTimeout(r, 800))
      setResultaat({ ok: true, bericht: `Uitnodiging verstuurd naar ${emailInput}` })
    } catch {
      setResultaat({ ok: false, bericht: 'Kon uitnodiging niet versturen. Probeer opnieuw.' })
    }
    setBezig(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-900">Medewerker uitnodigen</p>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {resultaat ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-3">{resultaat.ok ? '✉️' : '❌'}</p>
            <p className="text-sm text-gray-700">{resultaat.bericht}</p>
            {resultaat.ok && (
              <p className="text-xs text-gray-400 mt-2">
                De medewerker ontvangt een e-mail met HR-code <strong>{hrCode}</strong> om in te loggen.
              </p>
            )}
            <button
              onClick={onSluit}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: '#1D9E75' }}
            >
              Sluiten
            </button>
          </div>
        ) : (
          <form onSubmit={stuurUitnodiging}>
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 block mb-1">Naam</label>
              <input
                type="text"
                value={naamInput}
                onChange={e => setNaamInput(e.target.value)}
                placeholder="Jan de Vries"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 block mb-1">E-mailadres *</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="jan@bedrijf.nl"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
              HR-code: <strong>{hrCode || 'Laden...'}</strong> — wordt meegestuurd in de e-mail.
            </div>
            <button
              type="submit"
              disabled={bezig || !emailInput.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: '#1D9E75' }}
            >
              {bezig ? 'Versturen...' : 'Stuur uitnodiging'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Bedrijf Tab ──────────────────────────────────────────────────────────────

function BedrijfTab({
  bedrijf,
  teamGrootte,
  onCodeVernieuwd,
}: {
  bedrijf: BedrijfInfo | null
  teamGrootte: number
  onCodeVernieuwd: (nieuweCode: string) => void
}) {
  const [gekopieerd, setGekopieerd] = useState(false)
  const [vernieuwBezig, setVernieuwBezig] = useState(false)
  const [bewerkenActief, setBewerkenActief] = useState(false)
  const [bedrijfsnaam, setBedrijfsnaam] = useState(bedrijf?.naam || '')
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [opslaanFeedback, setOpslaanFeedback] = useState<string | null>(null)

  function kopieerCode() {
    if (!bedrijf?.hr_code) return
    navigator.clipboard.writeText(bedrijf.hr_code).then(() => {
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 2000)
    })
  }

  async function vernieuwCode() {
    if (!bedrijf?.id) return
    setVernieuwBezig(true)
    const nieuweCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabase
      .from('bedrijven')
      .update({ hr_code: nieuweCode })
      .eq('id', bedrijf.id)
    if (!error) onCodeVernieuwd(nieuweCode)
    setVernieuwBezig(false)
  }

  async function slaaNaamOp(e: React.FormEvent) {
    e.preventDefault()
    if (!bedrijf?.id || !bedrijfsnaam.trim()) return
    setOpslaanBezig(true)
    const { error } = await supabase
      .from('bedrijven')
      .update({ naam: bedrijfsnaam.trim() })
      .eq('id', bedrijf.id)
    if (!error) {
      setOpslaanFeedback('Naam opgeslagen.')
      setBewerkenActief(false)
      setTimeout(() => setOpslaanFeedback(null), 3000)
    }
    setOpslaanBezig(false)
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {/* HR Code card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-sm font-semibold text-gray-700 mb-1">HR-code</p>
        <p className="text-xs text-gray-400 mb-4">
          Medewerkers gebruiken deze code om lid te worden van jouw bedrijf in MentaForce.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-center">
            <p className="text-3xl font-bold tracking-widest" style={{ color: '#1D9E75', fontFamily: 'monospace' }}>
              {bedrijf?.hr_code || '......'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={kopieerCode}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition"
            style={{ background: '#E1F5EE', color: '#0F6E56' }}
          >
            {gekopieerd ? 'Gekopieerd!' : 'Kopieer code'}
          </button>
          <button
            onClick={vernieuwCode}
            disabled={vernieuwBezig}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40"
            style={{ color: '#6b7280' }}
          >
            {vernieuwBezig ? '...' : 'Vernieuwen'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Let op: bij vernieuwen werkt de oude code niet meer.
        </p>
      </div>

      {/* Bedrijfsinfo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Bedrijfsinformatie</p>
          <button
            onClick={() => setBewerkenActief(a => !a)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            style={{ color: '#6b7280' }}
          >
            {bewerkenActief ? 'Annuleren' : 'Bewerken'}
          </button>
        </div>

        {bewerkenActief ? (
          <form onSubmit={slaaNaamOp}>
            <label className="text-xs font-medium text-gray-500 block mb-1">Bedrijfsnaam</label>
            <input
              value={bedrijfsnaam}
              onChange={e => setBedrijfsnaam(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 mb-3"
            />
            <button
              type="submit"
              disabled={opslaanBezig}
              className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: '#1D9E75' }}
            >
              {opslaanBezig ? 'Opslaan...' : 'Opslaan'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400">Naam</span>
              <span className="text-sm font-medium text-gray-700">{bedrijf?.naam || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400">Actieve medewerkers</span>
              <span className="text-sm font-medium text-gray-700">{teamGrootte}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-400">Bedrijf-ID</span>
              <span className="text-xs font-mono text-gray-400">{bedrijf?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        )}

        {opslaanFeedback && (
          <div className="mt-3 rounded-xl p-2 text-xs font-medium" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
            {opslaanFeedback}
          </div>
        )}
      </div>
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
  const [actieveTab, setActieveTab] = useState<'overzicht' | 'team' | 'trends' | 'signalen' | 'verlof' | 'declaraties' | 'gesprekken' | 'bedrijf'>('overzicht')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [hrUserId, setHrUserId] = useState<string | null>(null)
  const [teamZoekterm, setTeamZoekterm] = useState('')
  const [teamFilter, setTeamFilter] = useState<'alle' | 'ingevuld' | 'niet_ingevuld' | 'laag'>('alle')
  const [teamSorteer, setTeamSorteer] = useState<'naam' | 'score'>('naam')
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [userCheckinsMap, setUserCheckinsMap] = useState<Map<string, UserCheckin[]>>(new Map())
  const [verlofAanvragen, setVerlofAanvragen] = useState<VerlofHR[]>([])
  const [declaratiesHR, setDeclaratiesHR] = useState<DeclaratieHR[]>([])
  const [bedrijf, setBedrijf] = useState<BedrijfInfo | null>(null)
  const [gesprekken] = useState<Gesprek[]>([]) // Wordt gevuld zodra gesprekken-tabel beschikbaar is
  const [uitnodigenOpen, setUitnodigenOpen] = useState(false)

  const switchTab = useCallback((tab: string) => {
    setActieveTab(tab as typeof actieveTab)
  }, [])

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      setHrUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles')
        .select('bedrijf_id, rol')
        .eq('id', user.id)
        .single()

      if (!profiel?.bedrijf_id) { setLaden(false); return }
      setBedrijfId(profiel.bedrijf_id)

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

      // Bedrijf info
      try {
        const { data: bedrijfData } = await supabase
          .from('bedrijven')
          .select('id, naam, hr_code')
          .eq('id', profiel.bedrijf_id)
          .single()
        if (bedrijfData) setBedrijf(bedrijfData as BedrijfInfo)
      } catch { /* bedrijven tabel kan anders heten */ }

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
  const participatieRate = team.length > 0 ? Math.round((ingevuld.length / team.length) * 100) : 0
  const burnoutRisico = team.length > 0 ? Math.round((waarschuwingen.length / team.length) * 100) : 0

  type TabKey = 'overzicht' | 'team' | 'trends' | 'signalen' | 'verlof' | 'declaraties' | 'gesprekken' | 'bedrijf'

  const tabs: { key: TabKey; label: string; badge?: number; badgeKleur?: string }[] = [
    { key: 'overzicht', label: 'Overzicht' },
    { key: 'team', label: `Team (${team.length})` },
    { key: 'trends', label: 'Trends' },
    {
      key: 'signalen',
      label: 'Signalen',
      badge: signalen.length > 0 ? signalen.length : undefined,
      badgeKleur: '#E24B4A',
    },
    {
      key: 'verlof',
      label: 'Verlof',
      badge: pendingVerlof > 0 ? pendingVerlof : undefined,
      badgeKleur: '#BA7517',
    },
    {
      key: 'declaraties',
      label: 'Declaraties',
      badge: pendingDeclaraties > 0 ? pendingDeclaraties : undefined,
      badgeKleur: '#8B5CF6',
    },
    { key: 'gesprekken', label: 'Gesprekken' },
    { key: 'bedrijf', label: 'Bedrijf' },
  ]

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

        {/* Tabs — scrollable on mobile with badges */}
        <div
          className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActieveTab(t.key)}
              className="px-4 py-2 rounded-lg text-sm transition whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
              style={{
                background: actieveTab === t.key ? 'white' : 'transparent',
                color: actieveTab === t.key ? '#111' : '#888',
                fontWeight: actieveTab === t.key ? 500 : 400,
                boxShadow: actieveTab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
              {t.badge !== undefined && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white min-w-[18px] text-center leading-none"
                  style={{ background: t.badgeKleur ?? '#E24B4A' }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {laden ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-gray-200 animate-spin"
              style={{ borderTopColor: '#1D9E75' }} />
          </div>
        ) : (
          <>
            {/* ── OVERZICHT TAB ── */}
            {actieveTab === 'overzicht' && (
              <>
                {/* Snelkoppelingen */}
                <Snelkoppelingen
                  hrCode={bedrijf?.hr_code ?? ''}
                  onTabSwitch={switchTab}
                  onNieuwMedewerker={() => setUitnodigenOpen(true)}
                />

                {/* KPI Cards */}
                <KPICards
                  participatieRate={participatieRate}
                  ingevuld={ingevuld.length}
                  teamGrootte={team.length}
                  signaalCount={signalen.length}
                  pendingVerlof={pendingVerlof}
                  pendingDeclaraties={pendingDeclaraties}
                  onTabSwitch={switchTab}
                />

                {/* Two column widgets row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <AankomendeGesprekken gesprekken={gesprekken} />
                  <VerlofKalenderWidget verlofAanvragen={verlofAanvragen} />
                </div>

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
                    style={{ borderTop: '3px solid #1D9E75' }}
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

            {/* ── TEAM TAB ── */}
            {actieveTab === 'team' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <p className="text-sm font-medium text-gray-700 flex-1">Teamoverzicht</p>
                  <button
                    onClick={() => setUitnodigenOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition"
                    style={{ background: '#1D9E75' }}
                  >
                    + Medewerker uitnodigen
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
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

                <BulkActies
                  team={team}
                  gefilterdTeam={gefilterdTeam}
                  onHerinnering={() => {}}
                />

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

            {/* ── SIGNALEN TAB ── */}
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
                            className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
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
                          style={{ borderLeft: '3px solid #1D9E75' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                              style={{ background: '#E6F1FB', color: '#185FA5' }}>
                              {f.categorie}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(f.aangemaakt_op).toLocaleDateString('nl-BE')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">&quot;{f.inhoud}&quot;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TRENDS TAB ── */}
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
                          <Line type="monotone" dataKey="Score" stroke="#1D9E75" strokeWidth={2.5}
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
                          <Bar dataKey="Gemiddelde" radius={[6, 6, 0, 0]} fill="#1D9E75" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {laagsteMetrics.length >= 3 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { label: 'Meeste aandacht nodig', items: laagsteMetrics.slice(0, 3), kleur: '#E24B4A', bg: '#FCEBEB' },
                          { label: 'Kan beter', items: laagsteMetrics.slice(3, 6), kleur: '#BA7517', bg: '#FAEEDA' },
                          { label: 'Gaat goed', items: [...laagsteMetrics].reverse().slice(0, 3), kleur: '#1D9E75', bg: '#E1F5EE' },
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

            {/* ── VERLOF TAB ── */}
            {actieveTab === 'verlof' && (
              <VerlofTab
                aanvragen={verlofAanvragen}
                onUpdate={(id, status, notitie) => {
                  setVerlofAanvragen(prev => prev.map(v => v.id === id ? { ...v, status, reviewer_notitie: notitie } : v))
                }}
              />
            )}

            {/* ── DECLARATIES TAB ── */}
            {actieveTab === 'declaraties' && (
              <DeclaratiesTab
                declaraties={declaratiesHR}
                onUpdate={(id, status, notitie) => {
                  setDeclaratiesHR(prev => prev.map(d => d.id === id ? { ...d, status, reviewer_notitie: notitie } : d))
                }}
              />
            )}

            {/* ── GESPREKKEN TAB ── */}
            {actieveTab === 'gesprekken' && bedrijfId && hrUserId && (
              <GesprekkenTab
                bedrijfId={bedrijfId}
                hrUserId={hrUserId}
              />
            )}
            {actieveTab === 'gesprekken' && !bedrijfId && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-sm text-gray-400">Bedrijf niet gevonden. Koppel eerst een bedrijf aan je account.</p>
              </div>
            )}

            {/* ── BEDRIJF TAB ── */}
            {actieveTab === 'bedrijf' && (
              <BedrijfTab
                bedrijf={bedrijf}
                teamGrootte={team.length}
                onCodeVernieuwd={(nieuweCode) => setBedrijf(prev => prev ? { ...prev, hr_code: nieuweCode } : prev)}
              />
            )}
          </>
        )}
      </main>

      {uitnodigenOpen && (
        <MedewerkerUitnodigenModal
          onSluit={() => setUitnodigenOpen(false)}
          hrCode={bedrijf?.hr_code ?? ''}
        />
      )}
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
                    {v.reden && <p className="text-xs text-gray-400 mt-1">&quot;{v.reden}&quot;</p>}
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
