'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Suspense } from 'react'
import { verwerkGoalLog, LEVEL_KLEUREN, LEVEL_NAMEN, type Achievement } from '@/lib/xp'
import {
  type WellbeingCat, type WeekDoel, type WeekSelectie,
  getMaandag, vandaag, laadWeekSelectie, slaWeekSelectieOp, isVandaagGelogd, logVandaag,
} from '@/lib/weekdoelen'

// ─── Category config ──────────────────────────────────────────────────────────

export const CAT: Record<WellbeingCat, {
  label: string; kleur: string; bg: string; licht: string
  icon: React.ReactNode
  omschrijving: string
  presets: { titel: string; targetWaarde: number; eenheid: string; beschrijving: string; logLabel: string; logMin: number; logMax: number; logStep: number }[]
}> = {
  slaap: {
    label: 'Slaap', kleur: '#8B5CF6', bg: '#EEEDFE', licht: '#F5F3FF',
    omschrijving: 'Herstel en nachtrust verbeteren',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    presets: [
      { titel: '8 uur slaap per nacht', targetWaarde: 8, eenheid: 'uur', beschrijving: '8 uur is de gouden standaard voor herstel en energie.', logLabel: 'Hoeveel uur heb je geslapen?', logMin: 3, logMax: 12, logStep: 0.5 },
      { titel: 'Schermvrij 1 uur voor bed', targetWaarde: 60, eenheid: 'min schermvrij', beschrijving: 'Log hoeveel minuten schermvrij voor het slapengaan.', logLabel: 'Minuten schermvrij voor slaap', logMin: 0, logMax: 120, logStep: 5 },
      { titel: 'Voor 23:00 naar bed', targetWaarde: 23, eenheid: 'uur bedtijd', beschrijving: 'Vroeg naar bed gaan verbetert de slaapkwaliteit.', logLabel: 'Hoe laat ging je naar bed? (uur)', logMin: 20, logMax: 24, logStep: 0.5 },
    ],
  },
  stress: {
    label: 'Stress', kleur: '#E24B4A', bg: '#FCEBEB', licht: '#FFF5F5',
    omschrijving: 'Druk verlagen, ontspanning opbouwen',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    presets: [
      { titel: '10 min ademoefening per dag', targetWaarde: 10, eenheid: 'min ademhaling', beschrijving: 'Bewuste ademhaling of meditatie.', logLabel: 'Minuten ademoefening vandaag', logMin: 0, logMax: 60, logStep: 1 },
      { titel: 'Stressniveau onder 4/10', targetWaarde: 4, eenheid: 'stressniveau', beschrijving: 'Log dagelijks je stressniveau (1 = ontspannen, 10 = max).', logLabel: 'Stressniveau vandaag (1-10)', logMin: 1, logMax: 10, logStep: 1 },
      { titel: 'Dagelijks pauze inplannen', targetWaarde: 2, eenheid: 'pauzes', beschrijving: 'Log hoeveel bewuste pauzes je hebt genomen.', logLabel: 'Aantal bewuste pauzes vandaag', logMin: 0, logMax: 10, logStep: 1 },
    ],
  },
  energie: {
    label: 'Energie', kleur: '#BA7517', bg: '#FEF3C7', licht: '#FFFBEB',
    omschrijving: 'Vitaliteit en beweging vergroten',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    presets: [
      { titel: '30 min bewegen per dag', targetWaarde: 30, eenheid: 'min beweging', beschrijving: 'Wandelen, sport, fietsen — alles telt.', logLabel: 'Minuten beweging vandaag', logMin: 0, logMax: 180, logStep: 5 },
      { titel: '2 liter water per dag', targetWaarde: 2, eenheid: 'liter water', beschrijving: 'Hydratatie is direct gekoppeld aan energieniveau.', logLabel: 'Liter water vandaag', logMin: 0, logMax: 5, logStep: 0.25 },
      { titel: '8.000 stappen per dag', targetWaarde: 8000, eenheid: 'stappen', beschrijving: '8.000 stappen per dag verlaagt het risico op burn-out.', logLabel: 'Stappen vandaag', logMin: 0, logMax: 25000, logStep: 500 },
    ],
  },
  focus: {
    label: 'Focus', kleur: '#1D9E75', bg: '#E1F5EE', licht: '#F0FDF4',
    omschrijving: 'Concentratie en diep werk verbeteren',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    presets: [
      { titel: '2 uur deep work per dag', targetWaarde: 2, eenheid: 'uur focus', beschrijving: 'Gefocust werken zonder afleiding.', logLabel: 'Uur diepe focus vandaag', logMin: 0, logMax: 8, logStep: 0.5 },
      { titel: 'Telefoon-vrije ochtend', targetWaarde: 1, eenheid: 'ochtend', beschrijving: 'Log of je de ochtend zonder telefoon hebt doorgebracht.', logLabel: 'Ochtend zonder telefoon? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
      { titel: 'Max 3 meetings per dag', targetWaarde: 3, eenheid: 'max meetings', beschrijving: 'Minder meetings = meer focustijd.', logLabel: 'Aantal meetings vandaag', logMin: 0, logMax: 15, logStep: 1 },
    ],
  },
  balans: {
    label: 'Werk-privé', kleur: '#378ADD', bg: '#E6F1FB', licht: '#EFF6FF',
    omschrijving: 'Grenzen stellen, ruimte voor jezelf',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12L2 7M12 12l10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    presets: [
      { titel: 'Stoppen voor 18:00', targetWaarde: 18, eenheid: 'uur stoptijd', beschrijving: 'Log hoe laat je bent gestopt met werken.', logLabel: 'Hoe laat stopte je met werken?', logMin: 14, logMax: 24, logStep: 0.5 },
      { titel: '1 hobby-activiteit per week', targetWaarde: 1, eenheid: 'hobby keer', beschrijving: 'Iets doen puur voor plezier.', logLabel: 'Hobby-activiteit vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
      { titel: 'Lunchpauze buiten kantoor', targetWaarde: 1, eenheid: 'keer buiten', beschrijving: 'De lunchpauze buiten doorbrengen.', logLabel: 'Lunch buiten vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
    ],
  },
  motivatie: {
    label: 'Motivatie', kleur: '#059669', bg: '#D1FAE5', licht: '#ECFDF5',
    omschrijving: 'Zingeving en groeimindset versterken',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    presets: [
      { titel: '3 dankbaarheidspunten per dag', targetWaarde: 3, eenheid: 'dankbaarheden', beschrijving: 'Schrijf elke dag 3 dingen op waarvoor je dankbaar bent.', logLabel: 'Dankbaarheden opgeschreven', logMin: 0, logMax: 10, logStep: 1 },
      { titel: 'Dagelijks leermoment', targetWaarde: 1, eenheid: 'leermoment', beschrijving: 'Bewust iets nieuws geleerd.', logLabel: 'Leermoment vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
      { titel: 'Energieboost-activiteit', targetWaarde: 1, eenheid: 'boost', beschrijving: 'Iets gedaan wat je energie geeft.', logLabel: 'Energieboost vandaag? (1=ja/0=nee)', logMin: 0, logMax: 1, logStep: 1 },
    ],
  },
}

const ALLE_VLAKKEN = Object.keys(CAT) as WellbeingCat[]

// ─── Main ─────────────────────────────────────────────────────────────────────

function DoelenInhoud() {
  const router = useRouter()
  const [klaar, setKlaar] = useState(false)
  const [selectie, setSelectie] = useState<WeekSelectie | null>(null)
  const [vlakScores, setVlakScores] = useState<Record<WellbeingCat, 'goed'|'matig'|'laag'> | null>(null)

  // Wizard state
  const [stap, setStap] = useState<'vlakken' | 'doelen' | 'overzicht'>('vlakken')
  const [gekozenVlakken, setGekozenVlakken] = useState<WellbeingCat[]>([])
  const [doelPerVlak, setDoelPerVlak] = useState<Record<WellbeingCat, number | null>>({} as Record<WellbeingCat, number | null>)
  const [huidigeVlakIdx, setHuidigeVlakIdx] = useState(0)

  // Log modal
  const [logModal, setLogModal] = useState<{ vlak: WellbeingCat } | null>(null)
  const [logWaarde, setLogWaarde] = useState(0)
  const [logNotitie, setLogNotitie] = useState('')

  // XP toast
  const [xpToast, setXpToast] = useState<{ xp: number; level?: number; achievements: Achievement[] } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const s = laadWeekSelectie()
      if (s) { setSelectie(s); setStap('overzicht') }

      // Laad wellbeing scores uit laatste check-in
      const { data: analyse } = await supabase
        .from('checkin_analyses')
        .select('analyse_json')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(1).maybeSingle()
      const cats = analyse?.analyse_json?.wellbeing_categorieen as { naam: string; niveau: 'goed'|'matig'|'laag' }[] | undefined
      if (cats) {
        const NAAM_MAP: Record<string, WellbeingCat> = {
          'Slaap': 'slaap', 'Stress': 'stress', 'Energie': 'energie',
          'Focus': 'focus', 'Werk-privé balans': 'balans', 'Motivatie': 'motivatie',
        }
        const scores = {} as Record<WellbeingCat, 'goed'|'matig'|'laag'>
        cats.forEach(c => { const v = NAAM_MAP[c.naam]; if (v) scores[v] = c.niveau })
        setVlakScores(scores)
      }

      setKlaar(true)
    }
    check()
  }, [router])

  function toonXPToast(xp: number, level: number | undefined, achievements: Achievement[]) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setXpToast({ xp, level, achievements })
    toastTimer.current = setTimeout(() => setXpToast(null), 4000)
  }

  // ── Wizard: vlakken kiezen ───────────────────────────────────────────────

  function toggleVlak(v: WellbeingCat) {
    setGekozenVlakken(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 3 ? [...prev, v] : prev
    )
  }

  function naarDoelStap() {
    setDoelPerVlak({} as Record<WellbeingCat, number | null>)
    setHuidigeVlakIdx(0)
    setStap('doelen')
  }

  function kiesPreset(idx: number) {
    const vlak = gekozenVlakken[huidigeVlakIdx]
    const nieuw = { ...doelPerVlak, [vlak]: idx }
    setDoelPerVlak(nieuw)
    if (huidigeVlakIdx < gekozenVlakken.length - 1) {
      setHuidigeVlakIdx(i => i + 1)
    } else {
      // Alle vlakken hebben een doel — sla op
      const doelen: WeekDoel[] = gekozenVlakken.map(v => ({
        vlak: v,
        presetIndex: nieuw[v] ?? 0,
        logs: [],
      }))
      const ws: WeekSelectie = { weekStart: getMaandag(), doelen }
      slaWeekSelectieOp(ws)
      setSelectie(ws)
      setStap('overzicht')
    }
  }

  // ── Log opslaan ──────────────────────────────────────────────────────────

  function openLog(vlak: WellbeingCat) {
    const doel = selectie?.doelen.find(d => d.vlak === vlak)
    if (!doel) return
    const preset = CAT[vlak].presets[doel.presetIndex]
    setLogWaarde(preset.logMin)
    setLogNotitie('')
    setLogModal({ vlak })
  }

  function slaLogOp() {
    if (!logModal || !selectie) return
    const { vlak } = logModal
    const bijgewerkt: WeekSelectie = {
      ...selectie,
      doelen: selectie.doelen.map(d => {
        if (d.vlak !== vlak) return d
        const nieuweLog = { datum: vandaag(), waarde: logWaarde, notitie: logNotitie.trim() || undefined }
        const logs = [...d.logs.filter(l => l.datum !== vandaag()), nieuweLog]
        return { ...d, logs }
      }),
    }
    slaWeekSelectieOp(bijgewerkt)
    setSelectie(bijgewerkt)
    setLogModal(null)

    // XP
    const xpResult = verwerkGoalLog(1)
    if (xpResult.xpGewonnen > 0 || xpResult.nieuweAchievements.length > 0) {
      toonXPToast(xpResult.xpGewonnen, xpResult.levelOmhoog ? xpResult.nieuwLevel : undefined, xpResult.nieuweAchievements)
    }
  }

  function nieuweWeek() {
    setGekozenVlakken([])
    setDoelPerVlak({} as Record<WellbeingCat, number | null>)
    setHuidigeVlakIdx(0)
    setSelectie(null)
    setStap('vlakken')
  }

  if (!klaar) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  // ── XP Toast ─────────────────────────────────────────────────────────────

  const XPToastUI = xpToast && (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, background: 'white', borderRadius: 16, border: '1.5px solid #E5E7EB',
      boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '14px 20px', minWidth: 240,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1D9E75' }}>+{xpToast.xp} XP verdiend!</p>
          {xpToast.level && <p style={{ fontSize: 11, color: LEVEL_KLEUREN[xpToast.level] }}>Level {xpToast.level} — {LEVEL_NAMEN[xpToast.level]}!</p>}
        </div>
      </div>
    </div>
  )

  // ── STAP 1: Kies 3 vlakken ────────────────────────────────────────────────

  if (stap === 'vlakken') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <main style={{ maxWidth: 600, margin: '0 auto', padding: '36px 24px 80px' }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Kies 3 vlakken</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Waaraan wil je deze week werken? Kies precies 3.</p>
          </div>

          {/* Voortgang indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#1D9E75', width: `${(gekozenVlakken.length / 3) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: gekozenVlakken.length === 3 ? '#1D9E75' : '#9CA3AF' }}>
              {gekozenVlakken.length}/3
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {ALLE_VLAKKEN.map(vlak => {
              const c = CAT[vlak]
              const gekozen = gekozenVlakken.includes(vlak)
              const vol = !gekozen && gekozenVlakken.length === 3
              return (
                <button
                  key={vlak}
                  onClick={() => toggleVlak(vlak)}
                  disabled={vol}
                  style={{
                    background: gekozen ? c.bg : 'white',
                    border: `2px solid ${gekozen ? c.kleur : '#E5E7EB'}`,
                    borderRadius: 16, padding: '20px 12px',
                    cursor: vol ? 'not-allowed' : 'pointer',
                    opacity: vol ? 0.4 : 1,
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    position: 'relative',
                  }}
                >
                  {gekozen && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 18, height: 18, borderRadius: '50%', background: c.kleur,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                  <div style={{ color: gekozen ? c.kleur : '#9CA3AF' }}>{c.icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: gekozen ? c.kleur : '#374151' }}>{c.label}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{c.omschrijving}</p>
                  {vlakScores?.[vlak] && (() => {
                    const nv = vlakScores[vlak]
                    const cfg = nv === 'goed' ? { bg: '#E1F5EE', kleur: '#0F6E56', label: 'Goed' }
                      : nv === 'matig' ? { bg: '#FEF3C7', kleur: '#854F0B', label: 'Matig' }
                      : { bg: '#FCEBEB', kleur: '#A32D2D', label: 'Aandacht' }
                    return (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: cfg.bg, color: cfg.kleur }}>
                        {cfg.label}
                      </span>
                    )
                  })()}
                </button>
              )
            })}
          </div>

          <button
            onClick={naarDoelStap}
            disabled={gekozenVlakken.length !== 3}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: gekozenVlakken.length === 3 ? '#1D9E75' : '#E5E7EB',
              color: gekozenVlakken.length === 3 ? 'white' : '#9CA3AF',
              fontSize: 15, fontWeight: 700, border: 'none',
              cursor: gekozenVlakken.length === 3 ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            Volgende: kies je doelen →
          </button>
        </main>
      </div>
    )
  }

  // ── STAP 2: Kies doel per vlak ────────────────────────────────────────────

  if (stap === 'doelen') {
    const vlak = gekozenVlakken[huidigeVlakIdx]
    const c = CAT[vlak]
    const gekozenIdx = doelPerVlak[vlak] ?? null

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <main style={{ maxWidth: 520, margin: '0 auto', padding: '36px 24px 80px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <button
              onClick={() => huidigeVlakIdx === 0 ? setStap('vlakken') : setHuidigeVlakIdx(i => i - 1)}
              style={{ width: 34, height: 34, borderRadius: 10, background: 'white', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Vlak {huidigeVlakIdx + 1} van {gekozenVlakken.length}
              </p>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>
                Kies een doel voor <span style={{ color: c.kleur }}>{c.label}</span>
              </h1>
            </div>
          </div>

          {/* Stap-indicator bolletjes */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, paddingLeft: 46 }}>
            {gekozenVlakken.map((v, i) => (
              <div key={v} style={{
                width: i === huidigeVlakIdx ? 20 : 8, height: 8, borderRadius: 4,
                background: i < huidigeVlakIdx ? '#1D9E75' : i === huidigeVlakIdx ? c.kleur : '#E5E7EB',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>

          {/* Preset kaarten */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {c.presets.map((preset, i) => {
              const actief = gekozenIdx === i
              return (
                <button
                  key={i}
                  onClick={() => kiesPreset(i)}
                  style={{
                    background: actief ? c.bg : 'white',
                    border: `2px solid ${actief ? c.kleur : '#E5E7EB'}`,
                    borderRadius: 16, padding: '18px 20px',
                    textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: `2px solid ${actief ? c.kleur : '#D1D5DB'}`,
                    background: actief ? c.kleur : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {actief && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: actief ? c.kleur : '#111827', marginBottom: 4 }}>{preset.titel}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{preset.beschrijving}</p>
                    <p style={{ fontSize: 11, color: actief ? c.kleur : '#9CA3AF', marginTop: 6, fontWeight: 600 }}>
                      Doel: {preset.targetWaarde} {preset.eenheid}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20 }}>
            Klik op een doel om te bevestigen en door te gaan
          </p>
        </main>
      </div>
    )
  }

  // ── OVERZICHT: 3 actieve doelen ───────────────────────────────────────────

  if (!selectie) return null

  const maandag = new Date(selectie.weekStart)
  const zondag = new Date(maandag); zondag.setDate(maandag.getDate() + 6)
  const weekLabel = `${maandag.getDate()} – ${zondag.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>Mijn doelen deze week</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>{weekLabel}</p>
          </div>
          <button
            onClick={nieuweWeek}
            style={{ fontSize: 13, color: '#6B7280', padding: '8px 16px', borderRadius: 10, background: 'white', border: '1px solid #E5E7EB', cursor: 'pointer', fontWeight: 500 }}
          >
            Nieuwe week, andere doelen
          </button>
        </div>

        {/* 3 doelkaarten */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {selectie.doelen.map(doel => {
            const c = CAT[doel.vlak]
            const preset = c.presets[doel.presetIndex]
            const gelogd = isVandaagGelogd(doel)
            const logEntry = logVandaag(doel)
            const aantalLogs = doel.logs.length
            const gehaaldVandaag = logEntry && logEntry.waarde >= preset.targetWaarde

            // Voortgang: % van logs deze week die doel halen
            const last7: string[] = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(selectie.weekStart)
              d.setDate(d.getDate() + i)
              return d.toISOString().slice(0, 10)
            })
            const gelogdeDagen = last7.filter(dag => {
              const log = doel.logs.find(l => l.datum === dag)
              return log && log.waarde >= preset.targetWaarde
            }).length
            const pct = Math.round((gelogdeDagen / 7) * 100)

            return (
              <div key={doel.vlak} style={{
                background: 'white', borderRadius: 20,
                border: `2px solid ${gelogd ? c.kleur + '40' : '#E5E7EB'}`,
                padding: '22px 22px 20px',
                boxShadow: gelogd ? `0 4px 20px ${c.kleur}12` : '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {/* Vlak badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.kleur }}>
                      {c.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.kleur }}>{c.label}</span>
                  </div>
                  {gelogd && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: gehaaldVandaag ? c.kleur : c.bg, border: `2px solid ${c.kleur}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={gehaaldVandaag ? 'white' : c.kleur} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>

                {/* Doel titel */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.3 }}>{preset.titel}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>Doel: {preset.targetWaarde} {preset.eenheid}</p>
                </div>

                {/* Week voortgang */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>Deze week</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.kleur }}>{gelogdeDagen}/7 dagen</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {last7.map((dag, i) => {
                      const log = doel.logs.find(l => l.datum === dag)
                      const gehaald = log && log.waarde >= preset.targetWaarde
                      const isVandaagDag = dag === vandaag()
                      return (
                        <div key={i} style={{
                          flex: 1, height: 20, borderRadius: 4,
                          background: gehaald ? c.kleur : log ? c.bg : '#F3F4F6',
                          border: isVandaagDag && !gelogd ? `1.5px dashed ${c.kleur}` : 'none',
                        }} />
                      )
                    })}
                  </div>
                </div>

                {/* Log knop */}
                {gelogd ? (
                  <div style={{ background: c.licht, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.kleur }}>
                      {logEntry?.waarde} {preset.eenheid} gelogd
                    </span>
                    <button
                      onClick={() => openLog(doel.vlak)}
                      style={{ fontSize: 11, color: c.kleur, background: 'transparent', border: `1px solid ${c.kleur}40`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                    >
                      Aanpassen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openLog(doel.vlak)}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 12,
                      background: c.kleur, color: 'white',
                      fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Log vandaag
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 6 vlakken scores */}
        {vlakScores && (
          <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #E5E7EB', marginBottom: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
              Jouw scores per vlak
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {(Object.keys(CAT) as WellbeingCat[]).map(vlak => {
                const c = CAT[vlak]
                const nv = vlakScores[vlak]
                const nvcfg = !nv ? null
                  : nv === 'goed'  ? { bg: '#E1F5EE', kleur: '#0F6E56', label: 'Goed',     dot: '#1D9E75' }
                  : nv === 'matig' ? { bg: '#FEF3C7', kleur: '#854F0B', label: 'Matig',    dot: '#B45309' }
                  :                  { bg: '#FCEBEB', kleur: '#A32D2D', label: 'Aandacht', dot: '#DC2626' }
                return (
                  <div key={vlak} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: nvcfg?.bg ?? c.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: nvcfg ? nvcfg.dot : c.kleur, margin: '0 auto 6px',
                      border: `1.5px solid ${nvcfg?.dot ?? c.kleur}30`,
                    }}>
                      <span style={{ transform: 'scale(0.85)', display: 'flex' }}>{c.icon}</span>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{c.label}</p>
                    {nvcfg ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: nvcfg.bg, color: nvcfg.kleur }}>
                        {nvcfg.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#D1D5DB' }}>—</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>
              Op basis van je laatste check-in · <a href="/rapport" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: 600 }}>Bekijk rapport →</a>
            </p>
          </div>
        )}

        {/* Samenvatting */}
        <div style={{ background: 'white', borderRadius: 16, padding: '16px 20px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', gap: 24 }}>
            {selectie.doelen.map(d => {
              const c = CAT[d.vlak]
              const gelogd = isVandaagGelogd(d)
              return (
                <div key={d.vlak} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: gelogd ? c.kleur : '#E5E7EB' }} />
                  <span style={{ fontSize: 12, color: gelogd ? '#374151' : '#9CA3AF', fontWeight: gelogd ? 600 : 400 }}>{c.label}</span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>
            {selectie.doelen.filter(d => isVandaagGelogd(d)).length}/3 vandaag gelogd
          </p>
        </div>
      </main>

      {/* Log modal */}
      {logModal && (() => {
        const doel = selectie.doelen.find(d => d.vlak === logModal.vlak)!
        const c = CAT[logModal.vlak]
        const preset = c.presets[doel.presetIndex]
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) setLogModal(null) }}
          >
            <div style={{ background: 'white', width: '100%', maxWidth: 480, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: c.kleur, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{preset.titel}</h3>
                </div>
                <button onClick={() => setLogModal(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>{preset.logLabel}</p>

              <input
                type="range" min={preset.logMin} max={preset.logMax} step={preset.logStep}
                value={logWaarde}
                onChange={e => setLogWaarde(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: c.kleur, marginBottom: 4 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 14 }}>
                <span>{preset.logMin}</span><span>{preset.logMax} {preset.eenheid}</span>
              </div>

              <div style={{ background: c.licht, borderRadius: 12, padding: '14px', textAlign: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: c.kleur }}>{Number.isInteger(logWaarde) ? logWaarde : logWaarde.toFixed(1)}</span>
                <span style={{ fontSize: 14, color: c.kleur, marginLeft: 6 }}>{preset.eenheid}</span>
                {logWaarde >= preset.targetWaarde && (
                  <p style={{ fontSize: 12, color: c.kleur, marginTop: 4, fontWeight: 600 }}>Doel behaald!</p>
                )}
              </div>

              <textarea
                placeholder="Optionele notitie"
                value={logNotitie} onChange={e => setLogNotitie(e.target.value)}
                rows={2}
                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', marginBottom: 14, boxSizing: 'border-box' }}
              />

              <button
                onClick={slaLogOp}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: c.kleur, color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Opslaan
              </button>
            </div>
          </div>
        )
      })()}

      {XPToastUI}
    </div>
  )
}

export default function DoelenPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="mf-spinner" /></div>}>
      <DoelenInhoud />
    </Suspense>
  )
}
