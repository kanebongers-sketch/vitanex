'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Hand, Check, Circle, X, ChevronRight, Download, Bot,
  TreePalm, Thermometer, Star, Briefcase, ClipboardList,
  Car, Utensils, Package, GraduationCap, Handshake, Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Avatar } from '@/components/Avatar'
import { useToast } from '@/components/ui/Toast'
import nextDynamic from 'next/dynamic'
import GesprekkenTab from '@/components/hr/GesprekkenTab'
import RapportenTab from '@/components/hr/RapportenTab'
import HRKpiCards from '@/components/hr/HRKpiCards'
import HRSnelkoppelingen from '@/components/hr/HRSnelkoppelingen'

import BedrijfTabComponent, { type BedrijfInfo as BedrijfInfoComponent } from '@/components/hr/BedrijfTab'

// recharts lui laden — alleen wanneer de trendgrafieken echt getoond worden.
const HrCharts = nextDynamic(() => import('@/components/hr/HrCharts'), { ssr: false })

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
  sector?: string | null
  grootte?: string | null
  stad?: string | null
  website?: string | null
}

function gemiddelde(arr: number[]): number {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function scoreKleur(score: number): string {
  if (score >= 4) return 'var(--mf-green)'
  if (score >= 2.5) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function scoreBadge(score: number): { bg: string; color: string; label: string } {
  if (score >= 4) return { bg: 'var(--mf-green-light)', color: 'var(--mf-green-dark)', label: 'Goed' }
  if (score >= 2.5) return { bg: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)', label: 'Matig' }
  return { bg: 'var(--mf-red-light)', color: 'var(--mf-red)', label: 'Laag' }
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
      if (!resp.ok) {
        setInzicht('Kon het inzicht niet laden. Probeer opnieuw.')
      } else {
        const tekst = await resp.text()
        setInzicht(tekst || 'Geen inzicht beschikbaar.')
      }
    } catch {
      setInzicht('Kon het inzicht niet laden. Probeer opnieuw.')
    }
    setLaden(false)
  }

  return (
    <div className="mf-card rounded-2xl p-5 mb-6" style={{ borderLeft: '3px solid var(--mf-green)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--mf-green) 18%, transparent)', color: 'var(--mf-green)' }}>AI</span>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Teamanalyse</p>
        </div>
        <button
          onClick={genereer}
          disabled={laden}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          {laden ? (
            <>
              <span
                className="w-3 h-3 rounded-full animate-spin inline-block"
                style={{ border: '1px solid var(--border-strong)', borderTopColor: 'var(--text-1)' }}
              />
              Analyseren...
            </>
          ) : (
            inzicht ? 'Vernieuwen' : 'Analyseer team'
          )}
        </button>
      </div>

      {inzicht ? (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {inzicht}
        </p>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Klik op &quot;Analyseer team&quot; voor een AI-analyse van jouw teamdata.
        </p>
      )}
    </div>
  )
}

// ── Shared tab key type ──────────────────────────────────────────────────────

type TabKey = 'overzicht' | 'team' | 'trends' | 'signalen' | 'verlof' | 'declaraties' | 'gesprekken' | 'rapporten' | 'bedrijf'

// ── Aankomende Gesprekken Widget ─────────────────────────────────────────────

function AankomendeGesprekken({ gesprekken }: { gesprekken: Gesprek[] }) {
  const aankomend = gesprekken
    .filter(g => new Date(g.datum) >= new Date())
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
    .slice(0, 3)

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>Aankomende gesprekken</p>
      {aankomend.length === 0 ? (
        <p className="text-xs py-2" style={{ color: 'var(--text-3)' }}>Geen geplande gesprekken.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {aankomend.map(g => (
            <div key={g.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: 'var(--mf-blue-light)' }}>
                <span className="text-xs font-bold leading-none" style={{ color: 'var(--mf-blue)' }}>
                  {new Date(g.datum).getDate()}
                </span>
                <span className="text-[9px] leading-none" style={{ color: 'var(--mf-blue)' }}>
                  {new Date(g.datum).toLocaleDateString('nl-BE', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{g.medewerker_naam}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{g.type}</p>
              </div>
              <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
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
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>
        Verlofkalender — {now.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dagletters.map(d => (
          <p key={d} className="text-center text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>{d}</p>
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
                background: isVerlof ? 'var(--mf-green-light)' : isVandaag ? 'var(--text-1)' : 'transparent',
                color: isVerlof ? 'var(--mf-green)' : isVandaag ? 'var(--bg-app)' : 'var(--text-3)',
              }}
            >
              {dag}
            </div>
          )
        })}
      </div>
      {goedgekeurdVerlof.length > 0 && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
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
    try {
      const resp = await authFetch('/api/herinnering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: doelwitten.map(l => l.id) }),
      })
      if (resp.ok) {
        onHerinnering(doelwitten)
        setFeedback(`Herinnering verstuurd naar ${doelwitten.length} medewerker${doelwitten.length !== 1 ? 's' : ''}.`)
        setGeselecteerd(new Set())
        setTimeout(() => setFeedback(null), 4000)
      } else {
        setFeedback('Kon herinnering niet versturen. Probeer opnieuw.')
        setTimeout(() => setFeedback(null), 5000)
      }
    } catch {
      setFeedback('Networkfout — herinnering niet verstuurd.')
      setTimeout(() => setFeedback(null), 5000)
    }
    setBezig(false)
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
          style={{ color: 'var(--text-2)', background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <Download size={13} aria-hidden="true" /> Exporteer CSV
        </button>
        <button
          onClick={() => setUitgevouwen(u => !u)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
          style={{
            background: uitgevouwen ? 'var(--text-1)' : 'var(--bg-card)',
            color: uitgevouwen ? 'var(--bg-app)' : 'var(--text-2)',
            borderColor: uitgevouwen ? 'var(--text-1)' : 'var(--border)',
          }}
        >
          Bulk acties {geselecteerd.size > 0 ? `(${geselecteerd.size})` : ''}
        </button>
        {laagScorendeLeden.length > 0 && (
          <button
            onClick={() => { selecteerGroep(laagScorendeLeden); setUitgevouwen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ background: 'var(--mf-red-light)', color: 'var(--mf-red)', border: '1px solid color-mix(in srgb, var(--mf-red) 40%, transparent)' }}
          >
            Selecteer lage scores ({laagScorendeLeden.length})
          </button>
        )}
        {nietIngevuld.length > 0 && (
          <button
            onClick={() => { selecteerGroep(nietIngevuld); setUitgevouwen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ background: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)', border: '1px solid color-mix(in srgb, var(--mf-amber) 40%, transparent)' }}
          >
            Selecteer niet ingevuld ({nietIngevuld.length})
          </button>
        )}
      </div>

      {uitgevouwen && (
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
              {geselecteerd.size} medewerker{geselecteerd.size !== 1 ? 's' : ''} geselecteerd
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setGeselecteerd(new Set(gefilterdTeam.map(l => l.id)))}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-3)' }}
              >
                Alles
              </button>
              <button
                onClick={() => setGeselecteerd(new Set())}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-3)' }}
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
                  background: geselecteerd.has(lid.id) ? 'var(--text-1)' : 'var(--bg-card)',
                  color: geselecteerd.has(lid.id) ? 'var(--bg-app)' : 'var(--text-2)',
                  border: `1px solid ${geselecteerd.has(lid.id) ? 'var(--text-1)' : 'var(--border)'}`,
                }}
              >
                {lid.naam}
              </button>
            ))}
          </div>
          <button
            onClick={stuurHerinnering}
            disabled={geselecteerd.size === 0 || bezig}
            className="w-full py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition"
            style={{ background: 'var(--mf-amber)', color: 'var(--bg-app)' }}
          >
            {bezig ? 'Versturen...' : `Stuur herinnering (${geselecteerd.size})`}
          </button>
        </div>
      )}

      {feedback && (
        <div className="rounded-xl p-3 text-xs font-medium mb-3" style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
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
      const resp = await fetch('/api/uitnodiging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), naam: naamInput.trim(), hrCode }),
      })
      if (resp.ok) {
        setResultaat({ ok: true, bericht: `Uitnodiging verstuurd naar ${emailInput}` })
      } else {
        const fout = await resp.json().catch(() => ({}))
        setResultaat({ ok: false, bericht: fout?.message || 'Kon uitnodiging niet versturen. Probeer opnieuw.' })
      }
    } catch {
      setResultaat({ ok: false, bericht: 'Networkfout — controleer de verbinding en probeer opnieuw.' })
    }
    setBezig(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold" style={{ color: 'var(--text-1)' }}>Medewerker uitnodigen</p>
          <button onClick={onSluit} aria-label="Sluiten" className="leading-none transition-colors" style={{ color: 'var(--text-3)' }}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {resultaat ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-3" style={{ color: resultaat.ok ? 'var(--mf-green)' : 'var(--mf-red)' }}>
              {resultaat.ok ? <Check size={32} aria-hidden="true" /> : <X size={32} aria-hidden="true" />}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{resultaat.bericht}</p>
            {resultaat.ok && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                De medewerker ontvangt een e-mail met HR-code <strong>{hrCode}</strong> om in te loggen.
              </p>
            )}
            <button
              onClick={onSluit}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}
            >
              Sluiten
            </button>
          </div>
        ) : (
          <form onSubmit={stuurUitnodiging}>
            <div className="mb-3">
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-2)' }}>Naam</label>
              <input
                type="text"
                value={naamInput}
                onChange={e => setNaamInput(e.target.value)}
                placeholder="Jan de Vries"
                className="mf-input w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-2)' }}>E-mailadres *</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="jan@bedrijf.nl"
                required
                className="mf-input w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
              HR-code: <strong>{hrCode || 'Laden...'}</strong> — wordt meegestuurd in de e-mail.
            </div>
            <button
              type="submit"
              disabled={bezig || !emailInput.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}
            >
              {bezig ? 'Versturen...' : 'Stuur uitnodiging'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [team, setTeam] = useState<TeamLid[]>([])
  const [laden, setLaden] = useState(true)
  const [email, setEmail] = useState<string>('')
  const [actieveTab, setActieveTab] = useState<TabKey>('overzicht')
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
  const [discIngevuld, setDiscIngevuld] = useState<number>(0)
  const [gesprekken, setGesprekken] = useState<Gesprek[]>([])
  const [uitnodigenOpen, setUitnodigenOpen] = useState(false)

  const switchTab = useCallback((tab: TabKey) => {
    setActieveTab(tab)
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

      // Alleen HR en admins hebben toegang tot het HR-dashboard.
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home')
        return
      }

      if (!profiel.bedrijf_id) { setLaden(false); return }
      setBedrijfId(profiel.bedrijf_id)

      // Alle bedrijf-queries hangen alleen van bedrijf_id af — parallel laden.
      const [
        checkinRes,
        teamRes,
        avatarRes,
        bedrijfRes,
        discRes,
        perUserRes,
        feedbackRes,
        verlofRes,
        declRes,
        gesprekRes,
      ] = await Promise.all([
        supabase
          .from('checkins')
          .select('*, profiles!inner(bedrijf_id)')
          .eq('profiles.bedrijf_id', profiel.bedrijf_id)
          .order('created_at', { ascending: true })
          .limit(100),
        supabase
          .from('checkin_status')
          .select('id, naam, deze_week_ingevuld, laatste_score, laatste_checkin')
          .eq('bedrijf_id', profiel.bedrijf_id),
        supabase
          .from('profiles')
          .select('id, avatar_url')
          .eq('bedrijf_id', profiel.bedrijf_id),
        supabase
          .from('bedrijven')
          .select('id, naam, hr_code, sector, grootte, stad, website')
          .eq('id', profiel.bedrijf_id)
          .maybeSingle(),
        supabase
          .from('disc_inzendingen')
          .select('user_id')
          .eq('bedrijf_id', profiel.bedrijf_id),
        supabase
          .from('checkins')
          .select('*, profiles!inner(bedrijf_id)')
          .eq('profiles.bedrijf_id', profiel.bedrijf_id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('feedback_hr')
          .select('id, inhoud, categorie, aangemaakt_op')
          .eq('bedrijf_id', profiel.bedrijf_id)
          .order('aangemaakt_op', { ascending: false })
          .limit(50),
        supabase
          .from('verlof_aanvragen')
          .select('*, profiles!user_id(naam)')
          .eq('bedrijf_id', profiel.bedrijf_id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('declaraties')
          .select('*, profiles!user_id(naam)')
          .eq('bedrijf_id', profiel.bedrijf_id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('hr_gesprekken')
          .select('id, datum, type, medewerker:profiles!hr_gesprekken_medewerker_id_fkey(naam)')
          .eq('bedrijf_id', profiel.bedrijf_id)
          .eq('status', 'gepland')
          .gte('datum', new Date().toISOString())
          .order('datum', { ascending: true })
          .limit(10),
      ])

      setCheckins(checkinRes.data || [])

      const avatarMap = new Map((avatarRes.data ?? []).map(p => [p.id, p.avatar_url as string | null]))
      setTeam((teamRes.data ?? []).map(lid => ({ ...lid, avatar_url: avatarMap.get(lid.id) ?? null })))

      if (bedrijfRes.data) setBedrijf(bedrijfRes.data as BedrijfInfo)

      // DISC ingevuld: distinct user_ids in disc_inzendingen voor dit bedrijf
      if (discRes.data) {
        const uniqueUsers = new Set(discRes.data.map((r: { user_id: string }) => r.user_id))
        setDiscIngevuld(uniqueUsers.size)
      }

      const ucMap = new Map<string, UserCheckin[]>()
      for (const c of (perUserRes.data ?? []) as UserCheckin[]) {
        const arr = ucMap.get(c.user_id) ?? []
        ucMap.set(c.user_id, arr)
        if (arr.length < 4) arr.push(c)
      }
      setUserCheckinsMap(ucMap)

      setFeedback(feedbackRes.data || [])

      if (verlofRes.data) {
        setVerlofAanvragen((verlofRes.data as unknown as (VerlofHR & { profiles: { naam: string } | null })[]).map(v => ({
          ...v,
          naam: v.profiles?.naam ?? 'Onbekend',
        })))
      }

      if (declRes.data) {
        setDeclaratiesHR((declRes.data as unknown as (DeclaratieHR & { profiles: { naam: string } | null })[]).map(d => ({
          ...d,
          naam: d.profiles?.naam ?? 'Onbekend',
        })))
      }

      if (gesprekRes.data) {
        setGesprekken((gesprekRes.data as unknown as { id: string; datum: string; type: string; medewerker: { naam: string } | null }[]).map(g => ({
          id: g.id,
          datum: g.datum,
          type: g.type,
          medewerker_naam: g.medewerker?.naam ?? 'Onbekend',
        })))
      }

      // Fouten niet stil inslikken: benoem zichtbaar welke onderdelen misten.
      const bronnen: { error: unknown; label: string }[] = [
        { error: checkinRes.error, label: 'check-ins' },
        { error: teamRes.error, label: 'teamoverzicht' },
        { error: avatarRes.error, label: 'avatars' },
        { error: bedrijfRes.error, label: 'bedrijfsgegevens' },
        { error: discRes.error, label: 'DISC-status' },
        { error: perUserRes.error, label: 'check-in-historie' },
        { error: feedbackRes.error, label: 'feedback' },
        { error: verlofRes.error, label: 'verlofaanvragen' },
        { error: declRes.error, label: 'declaraties' },
        { error: gesprekRes.error, label: 'gesprekken' },
      ]
      const mislukt = bronnen.filter(b => b.error).map(b => b.label)
      if (mislukt.length > 0) {
        toast({
          title: 'Niet alle gegevens geladen',
          description: `Kon ${mislukt.join(', ')} niet ophalen. Vernieuw de pagina om het opnieuw te proberen.`,
          variant: 'error',
        })
      }

      setLaden(false)
    }
    laadData()
  }, [router, toast])

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
    const weekArr = weekMap.get(weekKey) ?? []
    weekMap.set(weekKey, weekArr)
    weekArr.push(score)
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

  // Signalen — tijdstip per mount vastzetten zodat de render puur blijft
  const [nuTs] = useState(() => Date.now())
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
      const dagenGeleden = Math.floor((nuTs - new Date(lid.laatste_checkin).getTime()) / (1000 * 60 * 60 * 24))
      if (dagenGeleden >= 14) {
        signalen.push({ lid, reden: `${dagenGeleden} dagen geen check-in`, ernst: 'matig' })
      }
    }
  }
  signalen.sort((a, b) => (a.ernst === 'hoog' ? -1 : 1) - (b.ernst === 'hoog' ? -1 : 1))

  const pendingVerlof = verlofAanvragen.filter(v => v.status === 'aangevraagd').length
  const pendingDeclaraties = declaratiesHR.filter(d => d.status === 'ingediend').length
  const participatieRate = team.length > 0 ? Math.round((ingevuld.length / team.length) * 100) : 0

  const now = new Date()
  const maandStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const maandEind = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const gesprekkenDezeMaand = gesprekken.filter(g => {
    const d = new Date(g.datum)
    return d >= maandStart && d <= maandEind
  }).length
  const burnoutRisico = team.length > 0 ? Math.round((waarschuwingen.length / team.length) * 100) : 0

  const tabs: { key: TabKey; label: string; badge?: number; badgeKleur?: string; icon?: boolean }[] = [
    { key: 'overzicht', label: 'Overzicht' },
    { key: 'team', label: `Team (${team.length})` },
    { key: 'trends', label: 'Trends' },
    {
      key: 'signalen',
      label: 'Signalen',
      badge: signalen.length > 0 ? signalen.length : undefined,
      badgeKleur: 'var(--mf-red)',
    },
    {
      key: 'verlof',
      label: 'Verlof',
      badge: pendingVerlof > 0 ? pendingVerlof : undefined,
      badgeKleur: 'var(--mf-amber)',
    },
    {
      key: 'declaraties',
      label: 'Declaraties',
      badge: pendingDeclaraties > 0 ? pendingDeclaraties : undefined,
      badgeKleur: 'var(--mf-purple)',
    },
    { key: 'gesprekken', label: 'Gesprekken' },
    { key: 'rapporten', label: 'Rapporten', icon: true },
    { key: 'bedrijf', label: 'Bedrijf' },
  ]

  // Score van de week — gemiddelde van checkins van de afgelopen 7 dagen
  const zeveDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const checkinsDezeWeek = checkins.filter(c => new Date(c.created_at) >= zeveDagenGeleden)
  const weekScore = checkinsDezeWeek.length > 0
    ? Math.round((checkinsDezeWeek.reduce((sum, c) => sum + (allMetricKeys.reduce((s, k) => s + c[k], 0) / 60) * 100, 0) / checkinsDezeWeek.length))
    : null

  return (
    <div className="min-h-screen mf-mesh-bg" style={{ background: 'var(--bg-app)' }}>
      <Navbar />

      {/* HR portal identity banner */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="px-6 sm:px-8 py-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--mf-blue)', color: 'var(--bg-app)' }}>HR</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>HR Portaal</p>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Teamwelzijn en vitaliteitsdata van jouw organisatie</p>
        </div>
      </div>

      <main className="p-6 sm:p-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-medium" style={{ color: 'var(--text-1)' }}>HR-dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-4)' }}>{email}</p>
          </div>
          <div className="flex gap-3 flex-wrap items-start">
            {/* Score van de week — prominente kaart */}
            {weekScore !== null && (
              <div
                className="rounded-2xl px-5 py-3 text-center"
                style={{
                  background: weekScore >= 70
                    ? 'color-mix(in srgb, var(--mf-green) 14%, transparent)'
                    : weekScore >= 45
                    ? 'color-mix(in srgb, var(--mf-amber) 14%, transparent)'
                    : 'color-mix(in srgb, var(--mf-red) 14%, transparent)',
                  border: `1.5px solid ${weekScore >= 70 ? 'color-mix(in srgb, var(--mf-green) 18%, transparent)' : weekScore >= 45 ? 'color-mix(in srgb, var(--mf-amber) 18%, transparent)' : 'color-mix(in srgb, var(--mf-red) 18%, transparent)'}`,
                  boxShadow: `0 4px 20px ${weekScore >= 70 ? 'color-mix(in srgb, var(--mf-green) 12%, transparent)' : weekScore >= 45 ? 'color-mix(in srgb, var(--mf-amber) 12%, transparent)' : 'color-mix(in srgb, var(--mf-red) 12%, transparent)'}`,
                }}
              >
                <p
                  className="text-2xl font-black leading-none"
                  style={{ color: weekScore >= 70 ? 'var(--mf-green)' : weekScore >= 45 ? 'var(--mf-amber)' : 'var(--mf-red)' }}
                >
                  {weekScore}
                  <span className="text-sm font-semibold opacity-60">/100</span>
                </p>
                <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-4)' }}>Score week</p>
              </div>
            )}
            <div className="rounded-xl border px-4 py-2.5 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{participatieRate}%</p>
              <p className="text-xs" style={{ color: 'var(--text-4)' }}>Participatie</p>
            </div>
            <div className="rounded-xl border px-4 py-2.5 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{ingevuld.length}/{team.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-4)' }}>Check-ins week</p>
            </div>
            {signalen.length > 0 && (
              <div className="rounded-xl border px-4 py-2.5 text-center"
                style={{ background: 'var(--mf-red-light)', borderColor: 'color-mix(in srgb, var(--mf-red) 40%, transparent)' }}>
                <p className="text-lg font-semibold" style={{ color: 'var(--mf-red)' }}>{signalen.length}</p>
                <p className="text-xs" style={{ color: 'var(--mf-red)' }}>Signalen</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs — scrollable on mobile with badges */}
        <div
          className="flex gap-1 rounded-xl p-1 mb-6 overflow-x-auto"
          style={{ background: 'var(--bg-subtle)', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActieveTab(t.key)}
              className="px-4 py-2 rounded-lg text-sm transition whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
              style={{
                background: actieveTab === t.key ? 'var(--bg-card)' : 'transparent',
                color: actieveTab === t.key ? 'var(--text-1)' : 'var(--text-3)',
                fontWeight: actieveTab === t.key ? 500 : 400,
                boxShadow: actieveTab === t.key ? '0 1px 3px rgba(0,0,0,0.25)' : 'none',
              }}
            >
              {t.icon && <Bot size={14} aria-hidden="true" />}
              {t.label}
              {t.badge !== undefined && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none"
                  style={{ background: t.badgeKleur ?? 'var(--mf-red)', color: 'var(--bg-app)' }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {laden ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mf-green)' }} />
          </div>
        ) : (
          <>
            {/* ── OVERZICHT TAB ── */}
            {actieveTab === 'overzicht' && (
              <>
                {/* Snelkoppelingen */}
                <HRSnelkoppelingen
                  hrCode={bedrijf?.hr_code ?? ''}
                  onTabSwitch={(tab) => switchTab(tab as TabKey)}
                  onNieuwMedewerker={() => setUitnodigenOpen(true)}
                />

                {/* KPI Cards */}
                <HRKpiCards
                  participatieRate={participatieRate}
                  ingevuld={ingevuld.length}
                  teamGrootte={team.length}
                  signaalCount={signalen.length}
                  pendingVerlof={pendingVerlof}
                  pendingDeclaraties={pendingDeclaraties}
                  gesprekkenDezeMaand={gesprekkenDezeMaand}
                  discIngevuld={discIngevuld}
                  onTabSwitch={(tab) => switchTab(tab as TabKey)}
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
                  <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--mf-red-light)', borderLeft: '4px solid var(--mf-red)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--mf-red)' }}>
                      Lage vitaliteitscore — {burnoutRisico}% van het team
                    </p>
                    <p className="text-sm" style={{ color: 'var(--mf-red)' }}>
                      {waarschuwingen.length} medewerker{waarschuwingen.length > 1 ? 's scoren' : ' scoort'} onder 2.5/5.
                      Overweeg een persoonlijk gesprek of check de signalen-tab.
                    </p>
                  </div>
                )}

                {nietIngevuld.length > 0 && (
                  <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--mf-amber-light)', borderLeft: '4px solid var(--mf-amber)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--mf-amber-dark)' }}>
                      Check-in herinnering
                    </p>
                    <p className="text-sm" style={{ color: 'var(--mf-amber-dark)' }}>
                      {nietIngevuld.length} medewerker{nietIngevuld.length > 1 ? 's hebben' : ' heeft'} de check-in nog niet ingevuld deze week.
                    </p>
                  </div>
                )}

                {/* Scores grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div
                    className="rounded-2xl border p-6 col-span-2 sm:col-span-1"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderTop: '3px solid var(--mf-green)' }}
                  >
                    <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Vitaliteitsscore</p>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                        <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mf-green) 18%, transparent) 0%, transparent 70%)' }} />
                      </div>
                      <p className="text-5xl font-medium" style={{ color: vitaliteitscore > 0 ? scoreKleur(vitaliteitscore) : 'var(--border-strong)', position: 'relative', zIndex: 1 }}>
                        {vitaliteitscore > 0 ? `${vitaliteitscore}/5` : '—'}
                      </p>
                    </div>
                    {checkins.length > 0 && (
                      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{checkins.length} check-ins totaal</p>
                    )}
                  </div>
                  {metricCards.map(m => {
                    const waarde = gemiddelde(checkins.map(c => c[m.key as keyof Checkin] as number))
                    const badge = waarde > 0 ? scoreBadge(waarde) : null
                    return (
                      <div key={m.label} className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{m.label}</p>
                        <p className="text-2xl font-medium" style={{ color: waarde > 0 ? scoreKleur(waarde) : 'var(--border-strong)' }}>
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
                  <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Participatie deze week</p>
                      <span className="text-sm font-semibold" style={{ color: participatieRate >= 70 ? 'var(--mf-green)' : participatieRate >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)' }}>
                        {ingevuld.length}/{team.length}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--bg-subtle)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${participatieRate}%`,
                          background: participatieRate >= 70 ? 'var(--mf-green)' : participatieRate >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)',
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {participatieRate >= 80 ? 'Uitstekende participatie' :
                        participatieRate >= 50 ? 'Goede participatie, ruimte voor verbetering' :
                          'Lage participatie — overweeg een herinnering te sturen'}
                    </p>
                  </div>
                )}

                {team.length === 0 && (
                  <div className="rounded-2xl border p-8 text-center mt-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="max-w-sm mx-auto">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'var(--mf-blue-light)', color: 'var(--mf-blue)' }}>
                        <Hand size={26} aria-hidden="true" />
                      </div>
                      <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Nodig je eerste medewerker uit</p>
                      <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
                        Je hebt nog geen medewerkers gekoppeld. Deel je HR-code of stuur een directe uitnodiging.
                      </p>
                      {bedrijf?.hr_code && (
                        <div className="rounded-xl px-4 py-3 mb-4 text-sm font-mono font-bold tracking-widest"
                          style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
                          {bedrijf.hr_code}
                        </div>
                      )}
                      <button
                        onClick={() => setUitnodigenOpen(true)}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                        style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}
                      >
                        Medewerker uitnodigen
                      </button>
                    </div>
                  </div>
                )}
                {team.length > 0 && checkins.length === 0 && (
                  <div className="rounded-2xl border p-8 text-center mt-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nog geen check-ins beschikbaar. Medewerkers kunnen inloggen en een check-in invullen.</p>
                  </div>
                )}
              </>
            )}

            {/* ── TEAM TAB ── */}
            {actieveTab === 'team' && (
              <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-2)' }}>Teamoverzicht</p>
                  <button
                    onClick={() => setUitnodigenOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}
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
                    className="mf-input rounded-lg px-3 py-1.5 text-xs outline-none w-36"
                  />
                  <select
                    value={teamFilter}
                    onChange={e => setTeamFilter(e.target.value as typeof teamFilter)}
                    className="mf-input rounded-lg px-2 py-1.5 text-xs outline-none"
                  >
                    <option value="alle">Alle</option>
                    <option value="ingevuld">Ingevuld</option>
                    <option value="niet_ingevuld">Niet ingevuld</option>
                    <option value="laag">Lage score</option>
                  </select>
                  <select
                    value={teamSorteer}
                    onChange={e => setTeamSorteer(e.target.value as typeof teamSorteer)}
                    className="mf-input rounded-lg px-2 py-1.5 text-xs outline-none"
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
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nog geen medewerkers.</p>
                ) : gefilterdTeam.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Geen leden gevonden.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {gefilterdTeam.map(lid => {
                      const badge = lid.laatste_score !== null ? scoreBadge(lid.laatste_score) : null
                      return (
                        <Link
                          key={lid.id}
                          href={`/team/${lid.id}`}
                          className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-[var(--bg-subtle)] rounded-xl px-2 -mx-2 transition"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar naam={lid.naam || '?'} avatarUrl={lid.avatar_url} size={32} />
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{lid.naam || 'Onbekend'}</p>
                              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
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
                            <span className="flex items-center justify-center w-7 h-7 rounded-full"
                              style={{
                                background: lid.deze_week_ingevuld ? 'var(--mf-green-light)' : 'var(--mf-amber-light)',
                                color: lid.deze_week_ingevuld ? 'var(--mf-green-dark)' : 'var(--mf-amber-dark)',
                              }}>
                              {lid.deze_week_ingevuld
                                ? <Check size={14} aria-label="Ingevuld deze week" />
                                : <Circle size={12} aria-label="Niet ingevuld deze week" />}
                            </span>
                            <ChevronRight size={16} aria-hidden="true" style={{ color: 'var(--text-3)' }} />
                          </div>
                        </Link>
                      )
                    })}
                    {(teamZoekterm || teamFilter !== 'alle') && (
                      <p className="text-xs pt-2" style={{ color: 'var(--text-3)' }}>{gefilterdTeam.length} van {team.length} leden</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── SIGNALEN TAB ── */}
            {actieveTab === 'signalen' && (
              <>
                <div className="mb-6">
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>Vroege waarschuwingssignalen</p>
                  {signalen.length === 0 ? (
                    <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-3)' }}>Geen alarmsignalen gedetecteerd.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {signalen.map(({ lid, reden, ernst }) => (
                        <div key={lid.id} className="rounded-2xl border p-4 flex items-center gap-4"
                          style={{ background: 'var(--bg-card)', borderColor: ernst === 'hoog' ? 'var(--mf-red-light)' : 'var(--mf-amber-light)', borderLeft: `4px solid ${ernst === 'hoog' ? 'var(--mf-red)' : 'var(--mf-amber-dark)'}` }}>
                          <div
                            className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                            style={{ background: ernst === 'hoog' ? 'var(--mf-red)' : 'var(--mf-amber)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Avatar naam={lid.naam || '?'} avatarUrl={lid.avatar_url} size={22} />
                              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{lid.naam}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: ernst === 'hoog' ? 'var(--mf-red-light)' : 'var(--mf-amber-light)',
                                  color: ernst === 'hoog' ? 'var(--mf-red)' : 'var(--mf-amber-dark)',
                                }}>
                                {ernst === 'hoog' ? 'Hoog risico' : 'Let op'}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{reden}</p>
                          </div>
                          <Link
                            href={`/team/${lid.id}`}
                            className="flex-shrink-0 text-xs border rounded-lg px-3 py-1.5 hover:bg-[var(--bg-subtle)] transition"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
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
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>
                    Anonieme feedback ({feedback.length})
                  </p>
                  {feedback.length === 0 ? (
                    <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nog geen anonieme feedback.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {feedback.map(f => (
                        <div key={f.id} className="rounded-2xl border p-4"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderLeft: '3px solid var(--mf-green)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                              style={{ background: 'var(--mf-blue-light)', color: 'var(--mf-blue)' }}>
                              {f.categorie}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                              {new Date(f.aangemaakt_op).toLocaleDateString('nl-BE')}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>&quot;{f.inhoud}&quot;</p>
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
                  <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nog geen data voor trends.</p>
                  </div>
                ) : (
                  <>
                    <HrCharts trendData={trendData} vergelijkingData={vergelijkingData} />

                    {laagsteMetrics.length >= 3 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { label: 'Meeste aandacht nodig', items: laagsteMetrics.slice(0, 3), kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)' },
                          { label: 'Kan beter', items: laagsteMetrics.slice(3, 6), kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)' },
                          { label: 'Gaat goed', items: [...laagsteMetrics].reverse().slice(0, 3), kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
                        ].map(groep => (
                          <div key={groep.label} className="rounded-2xl p-4" style={{ background: groep.bg }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: groep.kleur }}>{groep.label}</p>
                            {groep.items.map(item => (
                              <div key={item.metric} className="flex items-center justify-between py-1">
                                <span className="text-xs" style={{ color: 'var(--text-2)' }}>{item.metric}</span>
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
              <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Bedrijf niet gevonden. Koppel eerst een bedrijf aan je account.</p>
              </div>
            )}

            {/* ── RAPPORTEN TAB ── */}
            {actieveTab === 'rapporten' && (
              <RapportenTab bedrijfId={bedrijfId ?? ''} />
            )}

            {/* ── BEDRIJF TAB ── */}
            {actieveTab === 'bedrijf' && !bedrijf && (
              <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Bedrijfsdata kon niet worden geladen. Ververs de pagina of neem contact op met support.</p>
              </div>
            )}
            {actieveTab === 'bedrijf' && bedrijf && (
              <BedrijfTabComponent
                bedrijf={bedrijf as BedrijfInfoComponent | null}
                team={team.map(l => ({
                  id: l.id,
                  naam: l.naam,
                  afdeling: null,
                  laatste_score: l.laatste_score,
                  deze_week_ingevuld: l.deze_week_ingevuld,
                }))}
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

const VERLOF_TYPE_LABELS: Record<string, { icon: typeof TreePalm; label: string }> = {
  vakantie: { icon: TreePalm, label: 'Vakantie' },
  ziekte: { icon: Thermometer, label: 'Ziekte' },
  bijzonder: { icon: Star, label: 'Bijzonder' },
  onbetaald: { icon: Briefcase, label: 'Onbetaald' },
  overig: { icon: ClipboardList, label: 'Overig' },
}

function VerlofTypeLabel({ type }: { type: string }) {
  const entry = VERLOF_TYPE_LABELS[type]
  if (!entry) return <>{type}</>
  const Icon = entry.icon
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <Icon size={12} aria-hidden="true" /> {entry.label}
    </span>
  )
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
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>In behandeling ({pending.length})</p>
          <div className="flex flex-col gap-3">
            {pending.map(v => (
              <div key={v.id} className="rounded-2xl border p-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderLeft: '4px solid var(--mf-amber)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{v.naam}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      <VerlofTypeLabel type={v.type} /> ·{' '}
                      {new Date(v.datum_van).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                      {v.datum_van !== v.datum_tot ? ` – ${new Date(v.datum_tot).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}` : ''}
                      {' '}· {dagenTekst(v.datum_van, v.datum_tot)}
                    </p>
                    {v.reden && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>&quot;{v.reden}&quot;</p>}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)' }}>In behandeling</span>
                </div>
                <input
                  type="text"
                  placeholder="Optionele notitie voor medewerker..."
                  value={notities[v.id] ?? ''}
                  onChange={e => setNotities(prev => ({ ...prev, [v.id]: e.target.value }))}
                  className="mf-input w-full rounded-xl px-3 py-2 text-xs outline-none mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={() => behandel(v.id, 'goedgekeurd')}
                    disabled={verwerking === v.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
                    <Check size={14} aria-hidden="true" /> Goedkeuren
                  </button>
                  <button onClick={() => behandel(v.id, 'afgewezen')}
                    disabled={verwerking === v.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--mf-red)', color: 'var(--bg-app)' }}>
                    <X size={14} aria-hidden="true" /> Afwijzen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {behandeld.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>Behandeld ({behandeld.length})</p>
          <div className="flex flex-col gap-2">
            {behandeld.map(v => (
              <div key={v.id} className="rounded-2xl border px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{v.naam}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    <VerlofTypeLabel type={v.type} /> ·{' '}
                    {new Date(v.datum_van).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                    {v.datum_van !== v.datum_tot ? ` – ${new Date(v.datum_tot).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1"
                  style={v.status === 'goedgekeurd'
                    ? { background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }
                    : { background: 'var(--mf-red-light)', color: 'var(--mf-red)' }}>
                  {v.status === 'goedgekeurd'
                    ? <><Check size={12} aria-hidden="true" /> Goedgekeurd</>
                    : <><X size={12} aria-hidden="true" /> Afgewezen</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {aanvragen.length === 0 && (
        <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '0.5rem' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mf-green) 18%, transparent) 0%, transparent 70%)' }} />
            </div>
            <span style={{ position: 'relative', zIndex: 1, color: 'var(--mf-green)' }}><TreePalm size={32} aria-hidden="true" /></span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Geen verlofaanvragen.</p>
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

const DECL_CAT_LABELS: Record<string, { icon: typeof Car; label: string }> = {
  reiskosten: { icon: Car, label: 'Reiskosten' },
  maaltijd: { icon: Utensils, label: 'Maaltijd' },
  materiaal: { icon: Package, label: 'Materiaal' },
  training: { icon: GraduationCap, label: 'Training' },
  representatie: { icon: Handshake, label: 'Representatie' },
  overig: { icon: Wallet, label: 'Overig' },
}

function DeclCatLabel({ categorie }: { categorie: string }) {
  const entry = DECL_CAT_LABELS[categorie]
  if (!entry) return <>{categorie}</>
  const Icon = entry.icon
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <Icon size={12} aria-hidden="true" /> {entry.label}
    </span>
  )
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
        <div className="rounded-2xl border p-4 mb-5 flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Totaal openstaand</p>
          <p className="text-lg font-bold" style={{ color: 'var(--mf-purple)' }}>
            €{totaalOpenstaand.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>In behandeling ({pending.length})</p>
          <div className="flex flex-col gap-3">
            {pending.map(d => (
              <div key={d.id} className="rounded-2xl border p-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderLeft: '4px solid var(--mf-purple)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{d.naam}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      <DeclCatLabel categorie={d.categorie} /> ·{' '}
                      {new Date(d.datum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{d.beschrijving}</p>
                  </div>
                  <p className="text-lg font-bold flex-shrink-0" style={{ color: 'var(--text-1)' }}>
                    €{d.bedrag.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Optionele notitie..."
                  value={notities[d.id] ?? ''}
                  onChange={e => setNotities(prev => ({ ...prev, [d.id]: e.target.value }))}
                  className="mf-input w-full rounded-xl px-3 py-2 text-xs outline-none mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={() => behandel(d.id, 'goedgekeurd')}
                    disabled={verwerking === d.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
                    <Check size={14} aria-hidden="true" /> Goedkeuren
                  </button>
                  <button onClick={() => behandel(d.id, 'afgewezen')}
                    disabled={verwerking === d.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--mf-red)', color: 'var(--bg-app)' }}>
                    <X size={14} aria-hidden="true" /> Afwijzen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {behandeld.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>Behandeld ({behandeld.length})</p>
          <div className="flex flex-col gap-2">
            {behandeld.map(d => (
              <div key={d.id} className="rounded-2xl border px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{d.naam}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    <DeclCatLabel categorie={d.categorie} /> · {d.beschrijving}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-2)' }}>€{d.bedrag.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}</p>
                  <span className="flex items-center justify-center w-6 h-6 rounded-full"
                    style={d.status === 'goedgekeurd'
                      ? { background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }
                      : { background: 'var(--mf-red-light)', color: 'var(--mf-red)' }}>
                    {d.status === 'goedgekeurd'
                      ? <Check size={13} aria-label="Goedgekeurd" />
                      : <X size={13} aria-label="Afgewezen" />}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {declaraties.length === 0 && (
        <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '0.5rem' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mf-green) 18%, transparent) 0%, transparent 70%)' }} />
            </div>
            <span style={{ position: 'relative', zIndex: 1, color: 'var(--mf-green)' }}><Wallet size={32} aria-hidden="true" /></span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Geen declaraties ingediend.</p>
        </div>
      )}
    </div>
  )
}
