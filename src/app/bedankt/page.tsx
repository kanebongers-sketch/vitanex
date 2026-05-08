'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AandachtsPunt { titel: string; uitleg: string }
interface ActiePlan { actie: string; waarom: string; wanneer: string }
interface BurnoutRisico { niveau: 'laag' | 'matig' | 'hoog'; score: number; uitleg: string }

interface AnalyseJSON {
  samenvatting: string
  sterke_punten: string[]
  aandachtspunten: AandachtsPunt[]
  actieplan: ActiePlan[]
  burnout_risico: BurnoutRisico
  bericht: string
}

// ─── PDF generator ────────────────────────────────────────────────────────────

async function downloadPDF(analyse: AnalyseJSON, scores: Record<string, number>, datum: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const MARGIN = 18
  const PAGE_W = 210
  const TEXT_W = PAGE_W - MARGIN * 2
  let y = 20

  function nl(extra = 0) { y += extra }

  function checkPage() {
    if (y > 270) { doc.addPage(); y = 20 }
  }

  function write(text: string, size: number, rgb: [number, number, number], bold = false) {
    doc.setFontSize(size)
    doc.setTextColor(rgb[0], rgb[1], rgb[2])
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(String(text), TEXT_W) as string[]
    checkPage()
    doc.text(lines, MARGIN, y)
    y += lines.length * (size * 0.42) + 2
  }

  function rule() {
    doc.setDrawColor(220, 220, 220)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 5
  }

  // Kop
  write('VITANEX', 8, [29, 158, 117], true)
  nl(1)
  write('Persoonlijke Vitaliteitsanalyse', 20, [17, 24, 39], true)
  nl(1)
  write(`Week van ${datum}`, 10, [107, 114, 128])
  nl(4)
  rule()

  // Scores
  write('SCORES DEZE WEEK', 11, [17, 24, 39], true)
  nl(2)
  const catLabels: Record<string, string> = {
    e: 'Energie & Lichaam', m: 'Mentaal welzijn', w: 'Werk & Motivatie',
    s: 'Team & Samenwerking', g: 'Groei & Ontwikkeling', t: 'Totaal',
  }
  for (const [k, label] of Object.entries(catLabels)) {
    if (scores[k] > 0) write(`${label}: ${scores[k].toFixed(1)} / 5`, 10, [55, 65, 81])
  }
  nl(4); rule()

  // Samenvatting
  write('SAMENVATTING', 11, [17, 24, 39], true)
  nl(2)
  write(analyse.samenvatting, 10, [55, 65, 81])
  nl(4); rule()

  // Sterke punten
  write('STERKE PUNTEN', 11, [17, 24, 39], true)
  nl(2)
  for (const p of analyse.sterke_punten) { write(`• ${p}`, 10, [55, 65, 81]) }
  nl(4); rule()

  // Aandachtspunten
  write('AANDACHTSPUNTEN', 11, [17, 24, 39], true)
  nl(2)
  for (const a of analyse.aandachtspunten) {
    checkPage()
    write(a.titel, 10, [17, 24, 39], true)
    write(a.uitleg, 10, [55, 65, 81])
    nl(3)
  }
  rule()

  // Actieplan
  write('ACTIEPLAN VOOR VOLGENDE WEEK', 11, [17, 24, 39], true)
  nl(2)
  analyse.actieplan.forEach((item, i) => {
    checkPage()
    write(`${i + 1}. ${item.actie} — ${item.wanneer}`, 10, [17, 24, 39], true)
    write(`   ${item.waarom}`, 10, [55, 65, 81])
    nl(3)
  })
  rule()

  // Burnout risico
  const rKleur: Record<string, [number, number, number]> = {
    laag: [29, 158, 117], matig: [186, 117, 23], hoog: [226, 75, 74],
  }
  const rk = rKleur[analyse.burnout_risico.niveau] ?? [55, 65, 81]
  write(`BURN-OUT RISICO: ${analyse.burnout_risico.niveau.toUpperCase()}`, 11, rk, true)
  nl(2)
  write(analyse.burnout_risico.uitleg, 10, [55, 65, 81])
  nl(4); rule()

  // Bericht
  write('PERSOONLIJK BERICHT', 11, [17, 24, 39], true)
  nl(2)
  write(analyse.bericht, 10, [55, 65, 81])
  nl(10)

  // Footer
  write('Vitanex — Vitaliteit op de werkplek  |  Vertrouwelijk document', 8, [156, 163, 175])

  doc.save(`vitanex-analyse-${datum.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')}.pdf`)
}

// ─── Kleur helpers ────────────────────────────────────────────────────────────

function scoreKleur(s: number) {
  if (s >= 4) return '#1D9E75'
  if (s >= 3) return '#BA7517'
  if (s >= 2) return '#E26B4A'
  return '#E24B4A'
}

function risicoConfig(niveau: string) {
  if (niveau === 'hoog')  return { bg: '#FCEBEB', border: '#E24B4A', tekst: '#A32D2D', label: 'Hoog risico' }
  if (niveau === 'matig') return { bg: '#FAEEDA', border: '#BA7517', tekst: '#854F0B', label: 'Matig risico' }
  return { bg: '#E1F5EE', border: '#1D9E75', tekst: '#0F6E56', label: 'Laag risico' }
}

const CAT_LABELS: Record<string, string> = {
  e: 'Energie & Lichaam', m: 'Mentaal welzijn', w: 'Werk & Motivatie',
  s: 'Team & Samenwerking', g: 'Groei & Ontwikkeling',
}
const CAT_KLEUREN: Record<string, { k: string; l: string }> = {
  e: { k: '#1D9E75', l: '#E1F5EE' },
  m: { k: '#378ADD', l: '#E6F1FB' },
  w: { k: '#8B5CF6', l: '#EEEDFE' },
  s: { k: '#BA7517', l: '#FAEEDA' },
  g: { k: '#059669', l: '#D1FAE5' },
}

// ─── Inner component ──────────────────────────────────────────────────────────

function BedanktInhoud() {
  const params = useSearchParams()

  const e    = parseFloat(params.get('e') ?? '0')
  const m    = parseFloat(params.get('m') ?? '0')
  const w    = parseFloat(params.get('w') ?? '0')
  const s    = parseFloat(params.get('s') ?? '0')
  const g    = parseFloat(params.get('g') ?? '0')
  const t    = parseFloat(params.get('t') ?? '0')
  const sid  = params.get('sid') ?? ''

  const scores = { e, m, w, s, g, t }
  const heeftScores = t > 0

  const [status,    setStatus]    = useState<'laden' | 'analyse' | 'klaar' | 'fout' | 'simpel'>('laden')
  const [analyse,   setAnalyse]   = useState<AnalyseJSON | null>(null)
  const [analyseId, setAnalyseId] = useState<string | null>(null)
  const [gedeeld,   setGedeeld]   = useState(false)
  const [deelBezig, setDeelBezig] = useState(false)
  const [pdfBezig,  setPdfBezig]  = useState(false)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)

  const datum = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!sid || !heeftScores) { setStatus('simpel'); return }
    genereerAnalyse()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function genereerAnalyse() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('simpel'); return }
    setUserId(user.id)

    const { data: profiel } = await supabase
      .from('profiles').select('bedrijf_id').eq('id', user.id).single()
    setBedrijfId(profiel?.bedrijf_id ?? null)

    // Check of al bestaat
    const { data: bestaand } = await supabase
      .from('checkin_analyses')
      .select('id, analyse_json, gedeeld_met_hr')
      .eq('sessie_id', sid)
      .maybeSingle()

    if (bestaand) {
      setAnalyse(bestaand.analyse_json as AnalyseJSON)
      setAnalyseId(bestaand.id)
      setGedeeld(bestaand.gedeeld_met_hr)
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
      body: JSON.stringify({ scores, antwoorden: antwoorden ?? [] }),
    })

    if (!res.ok) { setStatus('fout'); return }
    const json = await res.json()
    if (!json.analyse) { setStatus('fout'); return }

    // Sla op in DB
    const { data: opgeslagen } = await supabase
      .from('checkin_analyses')
      .insert({
        sessie_id:   sid,
        user_id:     user.id,
        bedrijf_id:  profiel?.bedrijf_id ?? null,
        scores,
        analyse_json: json.analyse,
        gedeeld_met_hr: false,
      })
      .select('id')
      .single()

    setAnalyse(json.analyse)
    setAnalyseId(opgeslagen?.id ?? null)
    setStatus('klaar')
  }

  async function toggleDelen() {
    if (!analyseId || !userId) return
    setDeelBezig(true)
    const nieuw = !gedeeld
    await supabase
      .from('checkin_analyses')
      .update({ gedeeld_met_hr: nieuw })
      .eq('id', analyseId)
    setGedeeld(nieuw)
    setDeelBezig(false)
  }

  async function downloadAnalysePDF() {
    if (!analyse) return
    setPdfBezig(true)
    await downloadPDF(analyse, scores, datum)
    setPdfBezig(false)
  }

  // ── Laadscherm ────────────────────────────────────────────────────────────

  if (status === 'laden' || status === 'analyse') return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#E1F5EE' }}>
          <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin"
            style={{ borderTopColor: '#1D9E75' }} />
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

  // ── Simpele bevestiging (geen sessie-id) ──────────────────────────────────

  if (status === 'simpel' || status === 'fout') return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#E1F5EE' }}>
          <span style={{ color: '#1D9E75', fontSize: 22 }}>✓</span>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Check-in gedaan!</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {status === 'fout'
            ? 'De AI-analyse kon niet worden gegenereerd, maar je check-in is wel opgeslagen.'
            : 'Bedankt. Je antwoorden helpen jouw team om beter te presteren en uitval te voorkomen.'}
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/portaal" className="w-full inline-block text-center text-white rounded-xl py-3 text-sm font-medium"
            style={{ background: '#1D9E75' }}>Mijn portaal bekijken</Link>
          <Link href="/" className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Terug naar home</Link>
        </div>
      </div>
    </main>
  )

  // ── Volledige analyse ─────────────────────────────────────────────────────

  if (!analyse) return null

  const risico = risicoConfig(analyse.burnout_risico.niveau)

  return (
    <main className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>
      <div className="max-w-2xl mx-auto px-5 pt-10">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: '#E1F5EE' }}>
              <span style={{ color: '#1D9E75', fontSize: 24 }}>★</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Jouw vitaliteitsanalyse</h1>
              <p className="text-xs text-gray-400 capitalize">{datum}</p>
            </div>
          </div>

          {/* Totaalscore */}
          <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: '#F0FAF6' }}>
            <p className="text-xs text-gray-500 mb-1">Totale vitaliteitsscore</p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-5xl font-black" style={{ color: scoreKleur(t) }}>{t.toFixed(1)}</span>
              <span className="text-xl font-medium text-gray-400 pb-1">/5</span>
            </div>
          </div>

          {/* Categorie balkjes */}
          <div className="space-y-3">
            {Object.entries(CAT_LABELS).map(([key, label]) => {
              const score = scores[key] ?? 0
              if (!score) return null
              const { k, l } = CAT_KLEUREN[key]
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="font-semibold" style={{ color: scoreKleur(score) }}>{score.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: l }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(score / 5) * 100}%`, background: k }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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
                  style={{ background: '#E1F5EE', color: '#1D9E75' }}>✓</span>
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
                style={{ background: '#FAEEDA', borderLeft: '3px solid #BA7517' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#854F0B' }}>{a.titel}</p>
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
                  style={{ background: '#E6F1FB', color: '#378ADD' }}>{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.actie}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.wanneer}</p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.waarom}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
          <p className="text-sm text-gray-700 leading-relaxed italic">"{analyse.bericht}"</p>
        </div>

        {/* Acties: Delen met HR + Download */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Wat wil je doen met deze analyse?</h2>
          <p className="text-xs text-gray-400 mb-4">
            Je analyse is privé. Jij beslist of je hem deelt met HR of als PDF bewaart.
          </p>

          {/* Deel met HR toggle */}
          <button
            onClick={toggleDelen}
            disabled={deelBezig}
            className="w-full flex items-center justify-between p-4 rounded-xl border transition mb-3"
            style={{
              background:   gedeeld ? '#E1F5EE' : '#F9FAFB',
              borderColor:  gedeeld ? '#1D9E75' : '#e5e7eb',
            }}
          >
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: gedeeld ? '#0F6E56' : '#374151' }}>
                {gedeeld ? 'Gedeeld met HR' : 'Deel met HR'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: gedeeld ? '#1D9E75' : '#9ca3af' }}>
                {gedeeld
                  ? 'Jouw HR-manager kan deze analyse inzien en downloaden.'
                  : 'Jouw HR-manager krijgt toegang tot deze analyse.'}
              </p>
            </div>
            <div className="w-10 h-6 rounded-full flex items-center transition-all duration-200 flex-shrink-0 ml-4"
              style={{ background: gedeeld ? '#1D9E75' : '#d1d5db', justifyContent: gedeeld ? 'flex-end' : 'flex-start', padding: '2px' }}>
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* Download PDF */}
          <button
            onClick={downloadAnalysePDF}
            disabled={pdfBezig}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-40"
          >
            {pdfBezig
              ? <><span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" /> Bezig...</>
              : <>↓ Download als PDF</>
            }
          </button>
        </div>

        {/* Navigatie */}
        <div className="flex flex-col gap-3">
          {sid && (
            <Link href={`/mijn-rapport?sid=${sid}`}
              className="w-full inline-block text-center text-white rounded-xl py-3.5 text-sm font-semibold"
              style={{ background: '#1D9E75' }}>
              Bekijk je persoonlijk AI-rapport
            </Link>
          )}
          <Link href="/portaal"
            className="w-full inline-block text-center rounded-xl py-3.5 text-sm font-medium border"
            style={{ borderColor: '#378ADD', color: '#378ADD' }}>
            Mijn portaal bekijken
          </Link>
          <Link href="/journal"
            className="w-full inline-block text-center rounded-xl py-3.5 text-sm font-medium border"
            style={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}>
            Schrijf een reflectie in je journal
          </Link>
          <Link href="/"
            className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Terug naar home
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          Alle check-in antwoorden zijn anoniem en beveiligd opgeslagen.
        </p>
      </div>
    </main>
  )
}

// ─── Export met Suspense ──────────────────────────────────────────────────────

export default function Bedankt() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
          style={{ borderTopColor: '#1D9E75' }} />
      </main>
    }>
      <BedanktInhoud />
    </Suspense>
  )
}
