'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { verwerkCheckin, laadXPData, LEVEL_NAMEN, LEVEL_KLEUREN, type Achievement } from '@/lib/xp'
import { syncXPNaarServer } from '@/lib/xp-sync'
import {
  type WellbeingCat, type WeekDoel, type WeekSelectie,
  getMaandag, slaWeekSelectieOp, scoreKleur, scoreLabel,
} from '@/lib/weekdoelen'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AandachtsPunt { titel: string; uitleg: string }
interface ActiePlan { actie: string; waarom: string; wanneer: string }
interface BurnoutRisico { niveau: 'laag' | 'matig' | 'hoog'; score: number; uitleg: string }
interface WellbeingCategorie { naam: string; niveau: 'goed' | 'matig' | 'laag'; samenvatting: string; tips: string[] }
interface AanbevolenDoel {
  vlak: string; score: number
  doel_titel: string; doel_beschrijving: string
  target_waarde: number; eenheid: string; meetType: 'dagelijks' | 'wekelijks'
}

interface AnalyseJSON {
  samenvatting: string
  sterke_punten: string[]
  aandachtspunten: AandachtsPunt[]
  actieplan: ActiePlan[]
  burnout_risico: BurnoutRisico
  bericht: string
  wellbeing_categorieen?: WellbeingCategorie[]
  aanbevolen_doelen?: AanbevolenDoel[]
}

// ─── Domain config ────────────────────────────────────────────────────────────

const VLAK_CONFIG: Record<string, { label: string; kleur: string; licht: string }> = {
  slaap:    { label: 'Slaap',           kleur: 'var(--mf-purple)', licht: 'var(--mf-purple-light)' },
  stress:   { label: 'Stress',          kleur: 'var(--mf-red)', licht: 'var(--mf-red-light)' },
  energie:  { label: 'Energie',         kleur: 'var(--mf-amber)', licht: 'var(--mf-amber-light)' },
  focus:    { label: 'Focus',           kleur: 'var(--mf-green)', licht: 'var(--mf-green-light)' },
  balans:   { label: 'Werk-privé',      kleur: 'var(--mf-blue)', licht: 'var(--mf-blue-light)' },
  motivatie:{ label: 'Motivatie',       kleur: 'var(--mf-rose)', licht: 'var(--mf-rose-light)' },
}

const VLAK_VOLGORDE = ['slaap', 'stress', 'energie', 'focus', 'balans', 'motivatie']

function risicoConfig(niveau: string) {
  if (niveau === 'hoog')  return { bg: 'var(--mf-red-light)', border: 'var(--mf-red)', tekst: 'var(--mf-red)', label: 'Hoog risico' }
  if (niveau === 'matig') return { bg: 'var(--mf-amber-light)', border: 'var(--mf-amber)', tekst: 'var(--mf-amber-dark)', label: 'Matig risico' }
  return { bg: 'var(--mf-green-light)', border: 'var(--mf-green)', tekst: 'var(--mf-green-dark)', label: 'Laag risico' }
}

const NIVEAU_CONFIG: Record<string, { bg: string; tekst: string; label: string }> = {
  goed:  { bg: 'var(--mf-green-light)', tekst: 'var(--mf-green-dark)', label: 'Goed' },
  matig: { bg: 'var(--mf-amber-light)', tekst: 'var(--mf-amber-dark)', label: 'Matig' },
  laag:  { bg: 'var(--mf-red-light)', tekst: 'var(--mf-red)', label: 'Aandacht nodig' },
}

const WELLBEING_KLEUR: Record<string, { k: string; l: string; border: string }> = {
  'Slaap':             { k: 'var(--mf-purple)', l: 'var(--mf-purple-light)', border: 'rgba(139,92,246,0.3)' },
  'Stress':            { k: 'var(--mf-red)', l: 'var(--mf-red-light)', border: 'rgba(226,75,74,0.3)' },
  'Energie':           { k: 'var(--mf-green)', l: 'var(--mf-green-light)', border: 'rgba(29,158,117,0.3)' },
  'Focus':             { k: 'var(--mf-blue)', l: 'var(--mf-blue-light)', border: 'rgba(55,138,221,0.3)' },
  'Werk-privé balans': { k: 'var(--mf-amber)', l: 'var(--mf-amber-light)', border: 'rgba(186,117,23,0.3)' },
  'Motivatie':         { k: 'var(--mf-rose)', l: 'var(--mf-rose-light)', border: 'rgba(157,23,77,0.3)' },
}

// ─── Inner component ──────────────────────────────────────────────────────────

function BedanktInhoud() {
  const params = useSearchParams()

  const slaap    = parseInt(params.get('slaap')    ?? '0')
  const stress   = parseInt(params.get('stress')   ?? '0')
  const energie  = parseInt(params.get('energie')  ?? '0')
  const focus    = parseInt(params.get('focus')    ?? '0')
  const balans   = parseInt(params.get('balans')   ?? '0')
  const motivatie= parseInt(params.get('motivatie')?? '0')
  const sid      = params.get('sid') ?? ''

  const vlak_scores = { slaap, stress, energie, focus, balans, motivatie }
  const heeftScores = slaap + stress + energie + focus + balans + motivatie > 0

  // Vitaalscore: gemiddelde van 6 domeinen, genormaliseerd naar 0-100
  const scoreVals = Object.values(vlak_scores).filter(v => v > 0)
  const gemiddelde = scoreVals.length > 0 ? scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length : 0
  const vitaalScore = scoreVals.length > 0 ? Math.round(((gemiddelde - 4) / 16) * 100) : 0

  const [status,    setStatus]    = useState<'laden' | 'analyse' | 'klaar' | 'fout' | 'simpel'>(
    () => (!sid || !heeftScores) ? 'simpel' : 'laden'
  )
  const [analyse,   setAnalyse]   = useState<AnalyseJSON | null>(null)
  const [analyseId, setAnalyseId] = useState<string | null>(null)
  const [gedeeld,   setGedeeld]   = useState(false)
  const [deelBezig, setDeelBezig] = useState(false)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [xpToast,   setXpToast]   = useState<{ xp: number; level?: number; achievements: Achievement[] } | null>(null)
  const xpToastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const datum = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  function slaatDoelen(aj: AnalyseJSON) {
    if (!aj.aanbevolen_doelen?.length) return
    try {
      const doelen: WeekDoel[] = aj.aanbevolen_doelen.map(d => ({
        vlak:             d.vlak as WellbeingCat,
        doel_titel:       d.doel_titel,
        doel_beschrijving:d.doel_beschrijving,
        target_waarde:    d.target_waarde,
        eenheid:          d.eenheid,
        meetType:         d.meetType,
        logs:             [],
      }))
      const ws: WeekSelectie = {
        weekStart:   getMaandag(),
        doelen,
        vlak_scores: vlak_scores as Partial<Record<WellbeingCat, number>>,
      }
      slaWeekSelectieOp(ws)
    } catch { /* non-critical */ }
  }

  async function genereerAnalyse() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('simpel'); return }
    setUserId(user.id)

    const { data: profiel } = await supabase
      .from('profiles').select('bedrijf_id').eq('id', user.id).single()

    // Check of al bestaat
    const { data: bestaand } = await supabase
      .from('checkin_analyses')
      .select('id, analyse_json, gedeeld_met_hr')
      .eq('sessie_id', sid)
      .maybeSingle()

    if (bestaand) {
      const aj = bestaand.analyse_json as AnalyseJSON
      setAnalyse(aj)
      setAnalyseId(bestaand.id)
      setGedeeld(bestaand.gedeeld_met_hr)
      slaatDoelen(aj)
      setStatus('klaar')
      return
    }

    setStatus('analyse')

    // Haal tekst-antwoorden op
    const { data: antwoorden } = await supabase
      .from('checkin_antwoorden')
      .select('categorie, waarde_tekst')
      .eq('sessie_id', sid)
      .not('waarde_tekst', 'is', null)

    // Roep AI aan
    const res = await fetch('/api/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vlak_scores, antwoorden: antwoorden ?? [] }),
    })

    if (!res.ok) { setStatus('fout'); return }
    const json = await res.json()
    if (!json.analyse) { setStatus('fout'); return }

    const aj: AnalyseJSON = json.analyse

    // Sla op in DB
    const { data: opgeslagen } = await supabase
      .from('checkin_analyses')
      .insert({
        sessie_id:      sid,
        user_id:        user.id,
        bedrijf_id:     profiel?.bedrijf_id ?? null,
        scores:         vlak_scores,
        analyse_json:   aj,
        gedeeld_met_hr: false,
      })
      .select('id')
      .single()

    setAnalyse(aj)
    setAnalyseId(opgeslagen?.id ?? null)
    slaatDoelen(aj)
    setStatus('klaar')

    // Award XP
    try {
      const xpResult = verwerkCheckin(vitaalScore)
      if (xpResult.xpGewonnen > 0 || xpResult.nieuweAchievements.length > 0) {
        if (xpToastRef.current) clearTimeout(xpToastRef.current)
        setXpToast({ xp: xpResult.xpGewonnen, level: xpResult.levelOmhoog ? xpResult.nieuwLevel : undefined, achievements: xpResult.nieuweAchievements })
        xpToastRef.current = setTimeout(() => setXpToast(null), 5000)
      }
    } catch { /* XP is non-critical */ }

    // Sync XP naar server (niet-blokkerend — localStorage blijft source of truth)
    syncXPNaarServer(laadXPData()).catch(() => { /* stil falen */ })
  }

  useEffect(() => {
    if (!sid || !heeftScores) return
    // Start de analyse buiten de synchrone effect-body (compiler-regel)
    Promise.resolve().then(genereerAnalyse)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleDelen() {
    if (!analyseId || !userId) return
    setDeelBezig(true)
    const nieuw = !gedeeld
    await supabase.from('checkin_analyses').update({ gedeeld_met_hr: nieuw }).eq('id', analyseId)
    setGedeeld(nieuw)
    setDeelBezig(false)
  }

  // ── Laadscherm ────────────────────────────────────────────────────────────

  if (status === 'laden' || status === 'analyse') return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--mf-green-light)' }}>
          <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mf-green)' }} />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          {status === 'laden' ? 'Check-in verwerken...' : 'AI-analyse wordt gegenereerd...'}
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          {status === 'analyse'
            ? 'De AI analyseert jouw antwoorden en stelt een persoonlijk rapport op. Dit duurt een paar seconden.'
            : 'Even geduld...'}
        </p>
      </div>
    </main>
  )

  // ── Simpele bevestiging ───────────────────────────────────────────────────

  if (status === 'simpel' || status === 'fout') return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: status === 'fout' ? 'var(--mf-red-light)' : 'var(--mf-green-light)' }}>
          <span style={{ color: status === 'fout' ? 'var(--mf-red)' : 'var(--mf-green)', fontSize: 22 }}>
            {status === 'fout' ? '!' : '✓'}
          </span>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          {status === 'fout' ? 'Rapport kon niet worden geladen' : 'Check-in gedaan!'}
        </h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {status === 'fout'
            ? 'Je check-in is opgeslagen, maar de AI-analyse is mislukt. Probeer het opnieuw.'
            : 'Bedankt. Je antwoorden helpen jou om beter te presteren en uitval te voorkomen.'}
        </p>
        <div className="flex flex-col gap-3">
          {status === 'fout' && sid && (
            <button onClick={() => { setStatus('laden'); genereerAnalyse() }}
              className="w-full inline-block text-center text-white rounded-xl py-3 text-sm font-medium"
              style={{ background: 'var(--mf-blue)' }}>
              Opnieuw proberen
            </button>
          )}
          <Link href="/home" className="w-full inline-block text-center text-white rounded-xl py-3 text-sm font-medium"
            style={{ background: 'var(--mf-green)' }}>Naar dashboard</Link>
          <Link href="/" className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Terug naar home</Link>
        </div>
      </div>
    </main>
  )

  if (!analyse) return null
  const risico = risicoConfig(analyse.burnout_risico.niveau)

  return (
    <>
    <main className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>
      <div className="max-w-2xl mx-auto px-5 pt-10">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--mf-green-light)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Jouw vitaliteitsanalyse</h1>
              <p className="text-xs text-gray-400 capitalize">{datum}</p>
            </div>
          </div>

          {/* Vitaalscore */}
          {vitaalScore > 0 && (
            <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: 'var(--mf-green-light)' }}>
              <p className="text-xs text-gray-500 mb-1">Vitaalscore</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-black" style={{ color: scoreKleur(Math.round(gemiddelde)) }}>{vitaalScore}</span>
                <span className="text-xl font-medium text-gray-400 pb-1">/100</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{scoreLabel(Math.round(gemiddelde))}</p>
            </div>
          )}

          {/* Domain score bars */}
          <div className="space-y-3">
            {VLAK_VOLGORDE.map(vlak => {
              const score = (vlak_scores as Record<string, number>)[vlak] ?? 0
              if (!score) return null
              const { label, kleur, licht } = VLAK_CONFIG[vlak]
              return (
                <div key={vlak}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="font-semibold" style={{ color: scoreKleur(score) }}>{score}/20 — {scoreLabel(score)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: licht }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${((score - 4) / 16) * 100}%`, background: kleur }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Aanbevolen doelen */}
        {analyse.aanbevolen_doelen && analyse.aanbevolen_doelen.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900">Jouw doelen voor deze week</h2>
              <Link href="/doelen" className="text-xs font-medium" style={{ color: 'var(--mf-green)' }}>Bekijk alles →</Link>
            </div>
            <p className="text-xs text-gray-400 mb-4">De AI heeft 3 doelen gekozen op basis van jouw laagste scores.</p>
            <div className="space-y-3">
              {analyse.aanbevolen_doelen.map((doel, i) => {
                const cfg = VLAK_CONFIG[doel.vlak] ?? { label: doel.vlak, kleur: 'var(--text-2)', licht: 'var(--bg-subtle)' }
                return (
                  <div key={i} className="rounded-xl p-4 flex gap-3"
                    style={{ background: cfg.licht, border: `1px solid ${cfg.kleur}20` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ background: cfg.kleur }}>{i + 1}</div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: cfg.kleur }}>{doel.doel_titel}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{doel.doel_beschrijving}</p>
                      <p className="text-xs font-medium mt-1" style={{ color: cfg.kleur }}>
                        Doel: {doel.target_waarde} {doel.eenheid} — {doel.meetType}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Samenvatting */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Samenvatting</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{analyse.samenvatting}</p>
        </div>

        {/* Sterke punten */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Sterke punten deze week</h2>
          <ul className="space-y-2">
            {analyse.sterke_punten.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>✓</span>
                <span className="text-sm text-gray-700">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Aandachtspunten */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Aandachtspunten</h2>
          <div className="space-y-4">
            {analyse.aandachtspunten.map((a, i) => (
              <div key={i} className="rounded-xl p-4"
                style={{ background: 'var(--mf-amber-light)', borderLeft: '3px solid var(--mf-amber)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--mf-amber-dark)' }}>{a.titel}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{a.uitleg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actieplan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Actieplan voor volgende week</h2>
          <div className="space-y-4">
            {analyse.actieplan.map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--mf-blue-light)', color: 'var(--mf-blue)' }}>{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.actie}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.wanneer}</p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.waarom}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Welzijn per categorie */}
        {analyse.wellbeing_categorieen && analyse.wellbeing_categorieen.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Jouw welzijn per gebied</h2>
            <div className="space-y-3">
              {analyse.wellbeing_categorieen.map((cat) => {
                const kl = WELLBEING_KLEUR[cat.naam] ?? { k: 'var(--text-2)', l: 'var(--bg-subtle)', border: 'var(--border)' }
                const nv = NIVEAU_CONFIG[cat.niveau] ?? NIVEAU_CONFIG.matig
                return (
                  <div key={cat.naam} className="rounded-xl border p-4"
                    style={{ borderColor: kl.border, background: kl.l }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: kl.k }}>{cat.naam}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        style={{ background: nv.bg, color: nv.tekst }}>{nv.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{cat.samenvatting}</p>
                    <ul className="space-y-1">
                      {cat.tips.map((tip, ti) => (
                        <li key={ti} className="flex items-start gap-2 text-xs text-gray-700">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke={kl.k} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="flex-shrink-0 mt-0.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Burn-out risico */}
        <div className="rounded-2xl p-5 mb-4"
          style={{ background: risico.bg, borderLeft: `4px solid ${risico.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: risico.tekst }}>
              Burn-out risico: {risico.label}
            </p>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: risico.border + '20', color: risico.tekst }}>
              {analyse.burnout_risico.score}/10
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: risico.tekst }}>
            {analyse.burnout_risico.uitleg}
          </p>
        </div>

        {/* Persoonlijk bericht */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
          <p className="text-xs font-medium text-gray-400 mb-2">Persoonlijk bericht</p>
          <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{analyse.bericht}&rdquo;</p>
        </div>

        {/* Deel met HR */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Deel met HR?</h2>
          <p className="text-xs text-gray-400 mb-4">Je analyse is privé. Jij beslist of je hem deelt.</p>
          <button
            onClick={toggleDelen}
            disabled={deelBezig}
            className="w-full flex items-center justify-between p-4 rounded-xl border transition"
            style={{ background: gedeeld ? 'var(--mf-green-light)' : 'var(--bg-subtle)', borderColor: gedeeld ? 'var(--mf-green)' : 'var(--border)' }}
          >
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: gedeeld ? 'var(--mf-green-dark)' : 'var(--text-2)' }}>
                {gedeeld ? 'Gedeeld met HR' : 'Deel met HR'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: gedeeld ? 'var(--mf-green)' : 'var(--text-3)' }}>
                {gedeeld ? 'HR kan deze analyse inzien.' : 'HR krijgt toegang tot deze analyse.'}
              </p>
            </div>
            <div className="w-10 h-6 rounded-full flex items-center transition-all duration-200 flex-shrink-0 ml-4"
              style={{ background: gedeeld ? 'var(--mf-green)' : 'var(--text-4)', justifyContent: gedeeld ? 'flex-end' : 'flex-start', padding: '2px' }}>
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </div>
          </button>
        </div>

        {/* Navigatie */}
        <div className="flex flex-col gap-3">
          <Link href="/doelen"
            className="w-full inline-block text-center text-white rounded-xl py-3.5 text-sm font-semibold"
            style={{ background: 'var(--mf-green)' }}>
            Bekijk je doelen voor deze week
          </Link>
          <Link href="/rapport"
            className="w-full inline-block text-center rounded-xl py-3.5 text-sm font-medium border"
            style={{ borderColor: 'var(--mf-blue)', color: 'var(--mf-blue)' }}>
            Volledig rapport bekijken
          </Link>
          <Link href="/home"
            className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Terug naar dashboard
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          Alle check-in antwoorden zijn anoniem en beveiligd opgeslagen.
        </p>
      </div>
    </main>

    {/* XP Toast */}
    {xpToast && (
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, background: 'var(--bg-card)', borderRadius: 16,
        border: '1.5px solid #E5E7EB', boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        padding: '16px 20px', minWidth: 280, maxWidth: 360,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--mf-purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--mf-purple)', marginBottom: 2 }}>
              +{xpToast.xp} XP verdiend!
            </p>
            {xpToast.level && (
              <p style={{ fontSize: 12, fontWeight: 700, color: LEVEL_KLEUREN[xpToast.level] }}>
                Level {xpToast.level} bereikt — {LEVEL_NAMEN[xpToast.level]}!
              </p>
            )}
            {xpToast.achievements.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--mf-amber)', fontWeight: 600 }}>
                Achievement: {xpToast.achievements.map((a: Achievement) => a.naam).join(', ')}
              </p>
            )}
            <Link href="/niveau" style={{ fontSize: 11, color: 'var(--mf-purple)', textDecoration: 'underline', fontWeight: 600 }}>
              Bekijk Fit Level
            </Link>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ─── Export met Suspense ──────────────────────────────────────────────────────

export default function Bedankt() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
          style={{ borderTopColor: 'var(--mf-green)' }} />
      </main>
    }>
      <BedanktInhoud />
    </Suspense>
  )
}
