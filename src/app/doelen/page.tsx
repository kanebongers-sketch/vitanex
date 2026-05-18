'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Suspense } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type WellbeingCat = 'slaap' | 'stress' | 'energie' | 'focus' | 'balans' | 'motivatie'

type GoalLog = {
  datum: string   // YYYY-MM-DD
  waarde: number
  notitie?: string
}

type Doel = {
  id: string
  titel: string
  categorie: WellbeingCat
  targetWaarde: number
  eenheid: string
  beschrijving: string
  status: 'actief' | 'voltooid' | 'gestopt'
  aangemaakt: string
  voltooid?: string
  logs: GoalLog[]
}

// ─── Category config ──────────────────────────────────────────────────────────

const CAT: Record<WellbeingCat, {
  label: string; kleur: string; bg: string; licht: string
  icon: React.ReactNode
  presets: { titel: string; targetWaarde: number; eenheid: string; beschrijving: string; logLabel: string; logMin: number; logMax: number; logStep: number }[]
}> = {
  slaap: {
    label: 'Slaap', kleur: '#8B5CF6', bg: '#EEEDFE', licht: '#F5F3FF',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    presets: [
      { titel: '8 uur slaap per nacht', targetWaarde: 8, eenheid: 'uur', beschrijving: 'Log elke ochtend hoeveel uur je hebt geslapen. 8 uur is de gouden standaard voor herstel en energie.', logLabel: 'Hoeveel uur heb je geslapen?', logMin: 3, logMax: 12, logStep: 0.5 },
      { titel: 'Schermvrij 1 uur voor bed', targetWaarde: 60, eenheid: 'min schermvrij', beschrijving: 'Log elke avond hoeveel minuten je schermvrij was voor het slapengaan.', logLabel: 'Minuten schermvrij voor slaap', logMin: 0, logMax: 120, logStep: 5 },
      { titel: 'Voor 23:00 naar bed', targetWaarde: 23, eenheid: 'uur bedtijd', beschrijving: 'Log je bedtijd (uur). Vroeg naar bed gaan verbetert de slaapkwaliteit dramatisch.', logLabel: 'Hoe laat ging je naar bed? (uur)', logMin: 20, logMax: 24, logStep: 0.5 },
    ],
  },
  stress: {
    label: 'Stress', kleur: '#E24B4A', bg: '#FCEBEB', licht: '#FFF5F5',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    presets: [
      { titel: '10 min ademoefening per dag', targetWaarde: 10, eenheid: 'min ademhaling', beschrijving: 'Log hoeveel minuten je vandaag hebt besteed aan bewuste ademhaling of meditatie.', logLabel: 'Minuten ademoefening vandaag', logMin: 0, logMax: 60, logStep: 1 },
      { titel: 'Stressniveau onder 4/10', targetWaarde: 4, eenheid: 'stressniveau', beschrijving: 'Log dagelijks je stressniveau. 1 = volledig ontspannen, 10 = maximale stress. Doel: dagelijks onder de 4.', logLabel: 'Stressniveau vandaag (1-10)', logMin: 1, logMax: 10, logStep: 1 },
      { titel: 'Dagelijks pauze inplannen', targetWaarde: 2, eenheid: 'pauzes', beschrijving: 'Log hoeveel bewuste pauzes je hebt ingepland en genomen vandaag.', logLabel: 'Aantal bewuste pauzes vandaag', logMin: 0, logMax: 10, logStep: 1 },
    ],
  },
  energie: {
    label: 'Energie', kleur: '#BA7517', bg: '#FEF3C7', licht: '#FFFBEB',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    presets: [
      { titel: '30 min bewegen per dag', targetWaarde: 30, eenheid: 'min beweging', beschrijving: 'Log hoeveel minuten je vandaag actief bent geweest (wandelen, sport, fietsen).', logLabel: 'Minuten beweging vandaag', logMin: 0, logMax: 180, logStep: 5 },
      { titel: '2 liter water per dag', targetWaarde: 2, eenheid: 'liter water', beschrijving: 'Log hoeveel liter water je vandaag hebt gedronken. Hydratatie is direct gekoppeld aan energieniveau.', logLabel: 'Liter water vandaag', logMin: 0, logMax: 5, logStep: 0.25 },
      { titel: '8.000 stappen per dag', targetWaarde: 8000, eenheid: 'stappen', beschrijving: 'Log je stappenaantal. 8.000 stappen per dag verlaagt het risico op burn-out significant.', logLabel: 'Stappen vandaag', logMin: 0, logMax: 25000, logStep: 500 },
    ],
  },
  focus: {
    label: 'Focus', kleur: '#1D9E75', bg: '#E1F5EE', licht: '#F0FDF4',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    presets: [
      { titel: '2 uur deep work per dag', targetWaarde: 2, eenheid: 'uur focus', beschrijving: 'Log hoeveel uur je echt gefocust hebt gewerkt, zonder afleiding. Geen e-mail, geen meetings.', logLabel: 'Uur diepe focus vandaag', logMin: 0, logMax: 8, logStep: 0.5 },
      { titel: 'Telefoon-vrije ochtend', targetWaarde: 1, eenheid: 'ochtend', beschrijving: 'Log of je de ochtend zonder telefoon hebt doorgebracht. 1 = ja, 0 = nee.', logLabel: 'Ochtend zonder telefoon? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
      { titel: 'Max 3 meetings per dag', targetWaarde: 3, eenheid: 'max meetings', beschrijving: 'Log het aantal meetings van vandaag. Minder meetings = meer focustijd.', logLabel: 'Aantal meetings vandaag', logMin: 0, logMax: 15, logStep: 1 },
    ],
  },
  balans: {
    label: 'Werk-privé balans', kleur: '#378ADD', bg: '#E6F1FB', licht: '#EFF6FF',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12L2 7M12 12l10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    presets: [
      { titel: 'Stoppen voor 18:00', targetWaarde: 18, eenheid: 'uur stoptijd', beschrijving: 'Log hoe laat je vandaag echt bent gestopt met werken.', logLabel: 'Hoe laat stopte je met werken?', logMin: 14, logMax: 24, logStep: 0.5 },
      { titel: '1 hobby-activiteit per week', targetWaarde: 1, eenheid: 'hobby keer', beschrijving: 'Log of je vandaag iets hebt gedaan puur voor plezier. 1 = ja, 0 = nee.', logLabel: 'Hobby-activiteit vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
      { titel: 'Lunchpauze buiten kantoor', targetWaarde: 1, eenheid: 'keer buiten', beschrijving: 'Log of je de lunchpauze buiten hebt doorgebracht. 1 = ja, 0 = nee.', logLabel: 'Lunch buiten vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
    ],
  },
  motivatie: {
    label: 'Motivatie', kleur: '#059669', bg: '#D1FAE5', licht: '#ECFDF5',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    presets: [
      { titel: '3 dankbaarheidspunten per dag', targetWaarde: 3, eenheid: 'dankbaarheden', beschrijving: 'Log hoeveel dingen je vandaag hebt opgeschreven waarvoor je dankbaar bent.', logLabel: 'Dankbaarheden opgeschreven', logMin: 0, logMax: 10, logStep: 1 },
      { titel: 'Dagelijks leermoment', targetWaarde: 1, eenheid: 'leermoment', beschrijving: 'Log of je vandaag bewust iets nieuws hebt geleerd. 1 = ja, 0 = nee.', logLabel: 'Leermoment vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
      { titel: 'Energieboost-activiteit', targetWaarde: 1, eenheid: 'boost', beschrijving: 'Log of je vandaag iets hebt gedaan wat je energie geeft (collega helpen, creatief project, etc).', logLabel: 'Energieboost vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
    ],
  },
}

const ALLE_CATS = Object.keys(CAT) as WellbeingCat[]

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mf-doelen-v2'

function laadDoelen(): Doel[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function slaDoelen(d: Doel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

function vandaag(): string {
  return new Date().toISOString().slice(0, 10)
}

function nieuwId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function streakBerekenen(logs: GoalLog[], target: number): number {
  if (!logs.length) return 0
  const gesorteerd = [...logs].sort((a, b) => b.datum.localeCompare(a.datum))
  let streak = 0
  let verwacht = vandaag()
  for (const log of gesorteerd) {
    if (log.datum !== verwacht) break
    if (log.waarde >= target) streak++
    else break
    const d = new Date(verwacht)
    d.setDate(d.getDate() - 1)
    verwacht = d.toISOString().slice(0, 10)
  }
  return streak
}

function isVandaagGelogd(logs: GoalLog[]): boolean {
  return logs.some(l => l.datum === vandaag())
}

function checkAutoComplete(doel: Doel): boolean {
  if (doel.logs.length < 7) return false
  const laatste7 = [...doel.logs].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 7)
  return laatste7.every(l => l.waarde >= doel.targetWaarde)
}

function voortgangPct(logs: GoalLog[], target: number): number {
  if (!logs.length) return 0
  const gem = logs.slice(-7).reduce((sum, l) => sum + l.waarde, 0) / Math.min(logs.length, 7)
  return Math.min(100, Math.round((gem / target) * 100))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressRing({ pct, kleur, size = 80 }: { pct: number; kleur: string; size?: number }) {
  const r = (size / 2) - 6
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={kleur} strokeWidth="6"
        strokeLinecap="round" strokeDasharray={`${circ}`}
        strokeDashoffset={`${circ * (1 - pct / 100)}`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  )
}

function Streak({ n, kleur }: { n: number; kleur: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={kleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color: kleur }}>{n} dag streak</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function DoelenInhoud() {
  const router = useRouter()
  const params = useSearchParams()
  const voorgesteldeCat = params.get('categorie') as WellbeingCat | null

  const [klaar, setKlaar] = useState(false)
  const [doelen, setDoelen] = useState<Doel[]>([])
  const [scherm, setScherm] = useState<'hoofd' | 'kiezen' | 'aanpassen' | 'feest'>('hoofd')
  const [feestDoel, setFeestDoel] = useState<Doel | null>(null)

  // Kiezen state
  const [gekozenCat, setGekozenCat] = useState<WellbeingCat>(voorgesteldeCat ?? 'slaap')
  const [gekozenPreset, setGekozenPreset] = useState<number | null>(null)
  const [customTitel, setCustomTitel] = useState('')
  const [customTarget, setCustomTarget] = useState('')
  const [customEenheid, setCustomEenheid] = useState('')
  const [customBeschrijving, setCustomBeschrijving] = useState('')

  // Log state
  const [logModal, setLogModal] = useState(false)
  const [logWaarde, setLogWaarde] = useState<number>(0)
  const [logNotitie, setLogNotitie] = useState('')
  const autoCompleteRef = useRef(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const d = laadDoelen()
      setDoelen(d)
      if (voorgesteldeCat && !d.find(x => x.status === 'actief')) {
        setGekozenCat(voorgesteldeCat)
        setScherm('kiezen')
      }
      setKlaar(true)
    }
    check()
  }, [router, voorgesteldeCat])

  function sla(d: Doel[]) {
    setDoelen(d)
    slaDoelen(d)
  }

  const actiefDoel = doelen.find(d => d.status === 'actief') ?? null
  const voltooideDoelen = doelen.filter(d => d.status === 'voltooid')

  // ── Log today ────────────────────────────────────────────────────────────

  function openLogModal() {
    if (!actiefDoel) return
    const cfg = CAT[actiefDoel.categorie]
    const preset = cfg.presets.find(p => p.eenheid === actiefDoel.eenheid)
    setLogWaarde(preset?.logMin ?? 0)
    setLogNotitie('')
    setLogModal(true)
  }

  function slaLogOp() {
    if (!actiefDoel) return
    const bijgewerkt = doelen.map(d => {
      if (d.id !== actiefDoel.id) return d
      const nieuweLogs = d.logs.filter(l => l.datum !== vandaag())
      nieuweLogs.push({ datum: vandaag(), waarde: logWaarde, notitie: logNotitie.trim() || undefined })
      const bijgewerktDoel = { ...d, logs: nieuweLogs }

      // Auto-complete check
      if (!autoCompleteRef.current && checkAutoComplete(bijgewerktDoel)) {
        autoCompleteRef.current = true
        setTimeout(() => {
          setFeestDoel({ ...bijgewerktDoel, status: 'voltooid', voltooid: new Date().toISOString() })
          setScherm('feest')
          autoCompleteRef.current = false
        }, 500)
      }
      return bijgewerktDoel
    })
    sla(bijgewerkt)
    setLogModal(false)
  }

  // ── Doel voltooien (handmatig) ────────────────────────────────────────────

  function voltooidHandmatig() {
    if (!actiefDoel) return
    const bijgewerkt = doelen.map(d =>
      d.id === actiefDoel.id ? { ...d, status: 'voltooid' as const, voltooid: new Date().toISOString() } : d
    )
    sla(bijgewerkt)
    setFeestDoel({ ...actiefDoel, status: 'voltooid', voltooid: new Date().toISOString() })
    setScherm('feest')
  }

  // ── Nieuw doel aanmaken ────────────────────────────────────────────────────

  function maakDoel() {
    const cat = CAT[gekozenCat]
    let titel: string, target: number, eenheid: string, beschrijving: string

    if (gekozenPreset !== null) {
      const p = cat.presets[gekozenPreset]
      titel = p.titel; target = p.targetWaarde; eenheid = p.eenheid; beschrijving = p.beschrijving
    } else {
      if (!customTitel.trim() || !customTarget || !customEenheid.trim()) return
      titel = customTitel.trim()
      target = parseFloat(customTarget)
      eenheid = customEenheid.trim()
      beschrijving = customBeschrijving.trim()
    }

    // Stop eventueel huidig actief doel
    const bijgewerkt = doelen.map(d => d.status === 'actief' ? { ...d, status: 'gestopt' as const } : d)

    const nieuw: Doel = {
      id: nieuwId(), titel, categorie: gekozenCat,
      targetWaarde: target, eenheid, beschrijving,
      status: 'actief', aangemaakt: new Date().toISOString(), logs: [],
    }

    sla([nieuw, ...bijgewerkt])
    setScherm('hoofd')
    resetKiezen()
  }

  function resetKiezen() {
    setGekozenPreset(null)
    setCustomTitel(''); setCustomTarget(''); setCustomEenheid(''); setCustomBeschrijving('')
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (!klaar) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
    </div>
  )

  // ── Feest-scherm ─────────────────────────────────────────────────────────

  if (scherm === 'feest' && feestDoel) {
    const cfg = CAT[feestDoel.categorie]
    const totaalLogs = feestDoel.logs.length
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E5E7EB', padding: '40px 32px', textAlign: 'center' }}>

            {/* Trophy */}
            <div style={{ width: 80, height: 80, borderRadius: 24, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: cfg.kleur }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Doel behaald!</h1>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
              Je hebt <strong style={{ color: cfg.kleur }}>{feestDoel.titel}</strong> voltooid.
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>
              {totaalLogs} keer gelogd · Geweldige prestatie!
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              <div style={{ background: cfg.licht, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: cfg.kleur }}>{totaalLogs}</p>
                <p style={{ fontSize: 11, color: '#6B7280' }}>dagen gelogd</p>
              </div>
              <div style={{ background: cfg.licht, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: cfg.kleur }}>{streakBerekenen(feestDoel.logs, feestDoel.targetWaarde)}</p>
                <p style={{ fontSize: 11, color: '#6B7280' }}>dag streak</p>
              </div>
            </div>

            <button
              onClick={() => {
                // Mark completed in storage
                const bijgewerkt = doelen.map(d =>
                  d.id === feestDoel.id ? { ...d, status: 'voltooid' as const, voltooid: feestDoel.voltooid } : d
                )
                sla(bijgewerkt)
                setScherm('kiezen')
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, background: cfg.kleur,
                color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 12,
              }}
            >
              Kies een nieuw doel
            </button>
            <button
              onClick={() => {
                const bijgewerkt = doelen.map(d =>
                  d.id === feestDoel.id ? { ...d, status: 'voltooid' as const, voltooid: feestDoel.voltooid } : d
                )
                sla(bijgewerkt)
                setScherm('hoofd')
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, background: 'transparent',
                color: '#6B7280', fontSize: 14, fontWeight: 500, border: '1px solid #E5E7EB', cursor: 'pointer',
              }}
            >
              Terug naar overzicht
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── Doel kiezen scherm ────────────────────────────────────────────────────

  if (scherm === 'kiezen') {
    const catCfg = CAT[gekozenCat]
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px 80px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button
              onClick={() => { setScherm('hoofd'); resetKiezen() }}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'white', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Kies een doel</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Selecteer een categorie en een doel om aan te werken</p>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            {ALLE_CATS.map(cat => {
              const c = CAT[cat]
              const actief = gekozenCat === cat
              return (
                <button
                  key={cat}
                  onClick={() => { setGekozenCat(cat); setGekozenPreset(null) }}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${actief ? c.kleur : '#E5E7EB'}`,
                    background: actief ? c.bg : 'white', color: actief ? c.kleur : '#6B7280',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <span style={{ color: actief ? c.kleur : '#9CA3AF' }}>{c.icon}</span>
                  {c.label}
                </button>
              )
            })}
          </div>

          {/* Presets */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
            Populaire doelen voor {catCfg.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {catCfg.presets.map((preset, i) => {
              const actief = gekozenPreset === i
              return (
                <button
                  key={i}
                  onClick={() => setGekozenPreset(actief ? null : i)}
                  style={{
                    background: 'white', borderRadius: 14, padding: '14px 16px',
                    border: `2px solid ${actief ? catCfg.kleur : '#E5E7EB'}`,
                    textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{preset.titel}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>{preset.beschrijving}</p>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', border: `2px solid ${actief ? catCfg.kleur : '#D1D5DB'}`,
                      background: actief ? catCfg.kleur : 'white', flexShrink: 0, marginTop: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actief && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Custom goal */}
          <div style={{ background: 'white', borderRadius: 14, padding: '16px', border: '1px solid #E5E7EB', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Of maak een eigen doel</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text" placeholder="Omschrijving van je doel"
                value={customTitel} onChange={e => { setCustomTitel(e.target.value); if (e.target.value) setGekozenPreset(null) }}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  type="number" placeholder="Doelwaarde (getal)"
                  value={customTarget} onChange={e => setCustomTarget(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }}
                />
                <input
                  type="text" placeholder="Eenheid (bijv. uur)"
                  value={customEenheid} onChange={e => setCustomEenheid(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }}
                />
              </div>
              <textarea
                placeholder="Toelichting (optioneel)"
                value={customBeschrijving} onChange={e => setCustomBeschrijving(e.target.value)}
                rows={2}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', resize: 'none' }}
              />
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={maakDoel}
            disabled={gekozenPreset === null && (!customTitel.trim() || !customTarget || !customEenheid.trim())}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: catCfg.kleur, color: 'white',
              fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: 1,
            }}
          >
            Start dit doel
          </button>
        </main>
      </div>
    )
  }

  // ── Hoofd-scherm ──────────────────────────────────────────────────────────

  if (!actiefDoel) {
    // Empty state
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Mijn doelen</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28 }}>Werk aan één doel tegelijk voor de beste resultaten.</p>

          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#1D9E75' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Nog geen actief doel</p>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>
              Stel een doel in op basis van je check-in feedback en log elke dag je voortgang.
            </p>
            <button
              onClick={() => setScherm('kiezen')}
              style={{ padding: '12px 28px', borderRadius: 12, background: '#1D9E75', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Kies een doel
            </button>
          </div>

          {/* Category quick-pick */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>Kies een categorie</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {ALLE_CATS.map(cat => {
              const c = CAT[cat]
              return (
                <button
                  key={cat}
                  onClick={() => { setGekozenCat(cat); setScherm('kiezen') }}
                  style={{
                    background: 'white', borderRadius: 14, padding: '14px 10px',
                    border: '1px solid #E5E7EB', cursor: 'pointer', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  <div style={{ color: c.kleur }}>{c.icon}</div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.label}</p>
                </button>
              )
            })}
          </div>

          {/* History */}
          {voltooideDoelen.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>Voltooide doelen</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {voltooideDoelen.map(d => {
                  const c = CAT[d.categorie]
                  return (
                    <div key={d.id} style={{ background: 'white', borderRadius: 14, padding: '12px 16px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.kleur, flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'line-through', opacity: 0.6 }}>{d.titel}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>{d.logs.length} logs · {d.voltooid ? new Date(d.voltooid).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Actief doel scherm ────────────────────────────────────────────────────

  const cfg = CAT[actiefDoel.categorie]
  const pct = voortgangPct(actiefDoel.logs, actiefDoel.targetWaarde)
  const streak = streakBerekenen(actiefDoel.logs, actiefDoel.targetWaarde)
  const alGelogd = isVandaagGelogd(actiefDoel.logs)
  const presetCfg = cfg.presets.find(p => p.eenheid === actiefDoel.eenheid)
  const logMin = presetCfg?.logMin ?? 0
  const logMax = presetCfg?.logMax ?? 100
  const logStep = presetCfg?.logStep ?? 1
  const logLabel = presetCfg?.logLabel ?? `Waarde (${actiefDoel.eenheid})`

  // Last 7 days calendar
  const last7: { datum: string; log?: GoalLog }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const datum = d.toISOString().slice(0, 10)
    return { datum, log: actiefDoel.logs.find(l => l.datum === datum) }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Mijn doel</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Log dagelijks je voortgang</p>
          </div>
          <button
            onClick={() => { setGekozenCat(actiefDoel.categorie); setScherm('kiezen') }}
            style={{ fontSize: 12, color: '#6B7280', padding: '6px 12px', borderRadius: 8, background: 'white', border: '1px solid #E5E7EB', cursor: 'pointer' }}
          >
            Ander doel
          </button>
        </div>

        {/* Active goal card */}
        <div style={{ background: 'white', borderRadius: 20, border: `2px solid ${cfg.kleur}20`, padding: '20px', marginBottom: 16, boxShadow: `0 4px 20px ${cfg.kleur}10` }}>
          {/* Category badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.kleur }}>
              {cfg.icon}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: cfg.kleur, background: cfg.bg, padding: '3px 10px', borderRadius: 10 }}>
              {cfg.label}
            </span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{actiefDoel.titel}</h2>
          {actiefDoel.beschrijving && (
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>{actiefDoel.beschrijving}</p>
          )}

          {/* Progress + streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProgressRing pct={pct} kleur={cfg.kleur} size={80} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: cfg.kleur }}>{pct}%</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                Doel: <strong style={{ color: '#111827' }}>{actiefDoel.targetWaarde} {actiefDoel.eenheid}</strong>
              </p>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
                {actiefDoel.logs.length} keer gelogd
              </p>
              {streak > 0 && <Streak n={streak} kleur={cfg.kleur} />}
            </div>
          </div>

          {/* Log button */}
          {alGelogd ? (
            <div style={{ background: cfg.licht, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.kleur} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: cfg.kleur }}>Vandaag al gelogd</p>
                <p style={{ fontSize: 11, color: cfg.kleur, opacity: 0.7 }}>
                  {actiefDoel.logs.find(l => l.datum === vandaag())?.waarde} {actiefDoel.eenheid}
                </p>
              </div>
              <button
                onClick={openLogModal}
                style={{ marginLeft: 'auto', fontSize: 12, color: cfg.kleur, background: 'transparent', border: `1px solid ${cfg.kleur}40`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
              >
                Aanpassen
              </button>
            </div>
          ) : (
            <button
              onClick={openLogModal}
              style={{ width: '100%', padding: '13px', borderRadius: 12, background: cfg.kleur, color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Log vandaag
            </button>
          )}
        </div>

        {/* Last 7 days */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>Afgelopen 7 dagen</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {last7.map(({ datum, log }, i) => {
              const dayName = new Date(datum).toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2)
              const gehaald = log && log.waarde >= actiefDoel.targetWaarde
              const isVandaagEntry = datum === vandaag()
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>{dayName}</p>
                  <div style={{
                    height: 36, borderRadius: 8,
                    background: log ? (gehaald ? cfg.kleur : cfg.bg) : isVandaagEntry ? '#F9FAFB' : '#F3F4F6',
                    border: isVandaagEntry ? `2px dashed ${cfg.kleur}60` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {log && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={gehaald ? 'white' : cfg.kleur} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  {log && (
                    <p style={{ fontSize: 9, color: '#9CA3AF', marginTop: 3 }}>
                      {log.waarde}{actiefDoel.eenheid.length <= 3 ? actiefDoel.eenheid : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mark complete manually */}
        <button
          onClick={voltooidHandmatig}
          style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid #E5E7EB', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}
        >
          Markeer doel als voltooid
        </button>

        {/* History */}
        {voltooideDoelen.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>Voltooide doelen</p>
            {voltooideDoelen.map(d => {
              const c = CAT[d.categorie]
              return (
                <div key={d.id} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.kleur, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', textDecoration: 'line-through' }}>{d.titel}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>{d.logs.length} logs</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Log modal */}
      {logModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setLogModal(false) }}
        >
          <div style={{ background: 'white', width: '100%', maxWidth: 480, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Log vandaag</h3>
              <button onClick={() => setLogModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p style={{ fontSize: 14, color: '#374151', marginBottom: 16, fontWeight: 500 }}>{logLabel}</p>

            {/* Slider */}
            <div style={{ marginBottom: 8 }}>
              <input
                type="range" min={logMin} max={logMax} step={logStep}
                value={logWaarde}
                onChange={e => setLogWaarde(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: cfg.kleur }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF' }}>
                <span>{logMin} {actiefDoel.eenheid}</span>
                <span>{logMax} {actiefDoel.eenheid}</span>
              </div>
            </div>

            {/* Value display */}
            <div style={{ background: cfg.licht, borderRadius: 14, padding: '16px', textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: cfg.kleur }}>
                {Number.isInteger(logWaarde) ? logWaarde : logWaarde.toFixed(1)}
              </span>
              <span style={{ fontSize: 16, color: cfg.kleur, marginLeft: 6 }}>{actiefDoel.eenheid}</span>
              {logWaarde >= actiefDoel.targetWaarde && (
                <p style={{ fontSize: 12, color: cfg.kleur, marginTop: 4, fontWeight: 600 }}>Doel behaald!</p>
              )}
            </div>

            {/* Note */}
            <textarea
              placeholder="Optionele notitie (bijv. 'vroeg in bed, goed gevoel')"
              value={logNotitie} onChange={e => setLogNotitie(e.target.value)}
              rows={2}
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', marginBottom: 16, boxSizing: 'border-box' }}
            />

            <button
              onClick={slaLogOp}
              style={{ width: '100%', padding: '14px', borderRadius: 14, background: cfg.kleur, color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Export met Suspense ──────────────────────────────────────────────────────

export default function DoelenPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
      </div>
    }>
      <DoelenInhoud />
    </Suspense>
  )
}
