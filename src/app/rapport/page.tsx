'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { laadXPData, berekenLevel, LEVEL_NAMEN } from '@/lib/xp'
import RadarChart from '@/components/RadarChart'

interface WellbeingCat  { naam: string; niveau: 'goed' | 'matig' | 'laag'; samenvatting: string; tips: string[] }
interface BurnoutRisico { niveau: 'laag' | 'matig' | 'hoog'; score: number; uitleg: string }
interface ActiePlan     { actie: string; waarom: string; wanneer: string }
interface AandachtsPunt { titel: string; uitleg: string }

interface AnalyseJSON {
  samenvatting:          string
  sterke_punten:         string[]
  aandachtspunten:       AandachtsPunt[]
  actieplan:             ActiePlan[]
  burnout_risico:        BurnoutRisico
  bericht:               string
  wellbeing_categorieen?: WellbeingCat[]
}

interface Analyse {
  id: string
  scores: Record<string, number>
  analyse_json: AnalyseJSON
  aangemaakt_op: string
}

const CAT_LABEL: Record<string, string> = {
  slaap: 'Slaap', stress: 'Stress', energie: 'Energie',
  focus: 'Focus', balans: 'Werk-privé', motivatie: 'Motivatie',
}
const CAT_KLEUR: Record<string, string> = {
  slaap: '#8B5CF6', stress: '#E24B4A', energie: '#BA7517',
  focus: '#1D9E75', balans: '#378ADD', motivatie: '#9D174D',
}
const VLAK_VOLGORDE = ['slaap', 'stress', 'energie', 'focus', 'balans', 'motivatie']

function ScoreRing({ score }: { score: number }) {
  const r = 56, circ = 2 * Math.PI * r
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const trackKleur = score >= 70 ? 'rgba(29,158,117,0.12)' : score >= 45 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke={trackKleur} strokeWidth="11" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={kleur} strokeWidth="11"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      <text x="70" y="65" textAnchor="middle" fontSize="32" fontWeight="800" fill={kleur}>{score}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="12" fill="#9CA3AF" fontWeight="600">/100</text>
    </svg>
  )
}

export default function Rapport() {
  const router  = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [laden, setLaden]         = useState(true)
  const [analyse, setAnalyse]     = useState<Analyse | null>(null)
  const [xpLevel, setXpLevel]     = useState(1)
  const [downloading, setDownloading] = useState(false)
  const [analyseAanMaken, setAnalyseAanMaken] = useState(false)
  const [analyseFout, setAnalyseFout]         = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('checkin_analyses')
        .select('id, scores, analyse_json, aangemaakt_op')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setAnalyse(data as Analyse)
        setLaden(false)
        try { setXpLevel(berekenLevel(laadXPData().xp)) } catch { /* ok */ }
        return
      }

      // No analysis yet — check if there's a recent session we can analyse
      setLaden(false)
      const zevenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: sessie } = await supabase
        .from('checkin_sessies')
        .select('id')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', zevenGeleden)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!sessie) return

      // Session exists but no analysis — trigger it now
      setAnalyseAanMaken(true)
      try {
        const { data: profiel } = await supabase
          .from('profiles').select('bedrijf_id').eq('id', user.id).single()

        const { data: antwoorden } = await supabase
          .from('checkin_antwoorden')
          .select('categorie, waarde_tekst')
          .eq('sessie_id', sessie.id)
          .not('waarde_tekst', 'is', null)

        // Reconstruct vlak_scores from checkin_antwoorden scale responses
        const { data: schaalRows } = await supabase
          .from('checkin_antwoorden')
          .select('vraag_code, waarde_schaal')
          .eq('sessie_id', sessie.id)
          .not('waarde_schaal', 'is', null)

        const DOMEIN_CODES: Record<string, string[]> = {
          slaap:    ['slaap_kwaliteit', 'slaap_uren', 'slaap_fris', 'slaap_loslaten'],
          stress:   ['stress_niveau', 'stress_piekeren', 'stress_controle', 'stress_ontspanning'],
          energie:  ['energie_niveau', 'energie_beweging', 'energie_voeding', 'energie_dip'],
          focus:    ['focus_concentratie', 'focus_helderheid', 'focus_aanwezig', 'focus_flow'],
          balans:   ['balans_werk_prive', 'balans_grenzen', 'balans_tijd', 'balans_herstel'],
          motivatie:['motivatie_werk', 'motivatie_zinvol', 'motivatie_enthousiasme', 'motivatie_waardering'],
        }
        const codeMap: Record<string, number> = {}
        for (const row of (schaalRows ?? [])) {
          if (row.waarde_schaal !== null) codeMap[row.vraag_code] = row.waarde_schaal
        }
        const vlak_scores: Record<string, number> = {}
        for (const [domein, codes] of Object.entries(DOMEIN_CODES)) {
          const som = codes.reduce((acc, c) => acc + (codeMap[c] ?? 0), 0)
          vlak_scores[domein] = som
        }

        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token

        const res = await fetch('/api/analyse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ vlak_scores, antwoorden: antwoorden ?? [] }),
        })

        if (!res.ok) { setAnalyseAanMaken(false); setAnalyseFout(true); return }
        const json = await res.json()
        if (!json.analyse) { setAnalyseAanMaken(false); setAnalyseFout(true); return }

        const { data: opgeslagen } = await supabase
          .from('checkin_analyses')
          .insert({
            sessie_id:      sessie.id,
            user_id:        user.id,
            bedrijf_id:     profiel?.bedrijf_id ?? null,
            scores:         vlak_scores,
            analyse_json:   json.analyse,
            gedeeld_met_hr: false,
          })
          .select('id, scores, analyse_json, aangemaakt_op')
          .single()

        if (opgeslagen) setAnalyse(opgeslagen as Analyse)
        setAnalyseAanMaken(false)
      } catch {
        setAnalyseAanMaken(false)
        setAnalyseFout(true)
      }

      try { setXpLevel(berekenLevel(laadXPData().xp)) } catch { /* ok */ }
    }
    laad()
  }, [router])

  async function downloadPDF() {
    if (!analyse) return
    setDownloading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const aj = analyse.analyse_json
      const datum = new Date(analyse.aangemaakt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
      const scoreValsP = Object.values(analyse.scores).filter(v => v > 0)
      const gemP = scoreValsP.length > 0 ? scoreValsP.reduce((a, b) => a + b, 0) / scoreValsP.length : 0
      const totaal = scoreValsP.length > 0 ? Math.round(((gemP - 4) / 16) * 100) : 0

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const W = 210, mg = 20
      let y = 20

      const addText = (txt: string, size: number, bold: boolean, kleur: [number,number,number], indent = mg) => {
        doc.setFontSize(size)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(...kleur)
        const lines = doc.splitTextToSize(txt, W - indent - mg)
        doc.text(lines, indent, y)
        y += lines.length * (size * 0.45) + 3
      }

      const addLine = () => { doc.setDrawColor(229,231,235); doc.line(mg, y, W - mg, y); y += 6 }

      // Header
      addText('MentaForce — Mijn Rapport', 20, true, [17,158,117])
      addText(datum, 11, false, [156,163,175])
      y += 4
      addLine()

      // Score
      addText(`Vitaliteitsscore: ${totaal}/100`, 16, true, [17,40,53])
      y += 2
      VLAK_VOLGORDE.forEach(k => {
        const v = analyse.scores[k]
        if (v) addText(`${CAT_LABEL[k]}: ${v}/20`, 11, false, [107,114,128], mg + 4)
      })
      y += 4

      // Samenvatting
      if (aj.samenvatting) {
        addLine()
        addText('AI Samenvatting', 13, true, [17,40,53])
        addText(aj.samenvatting, 11, false, [55,65,81])
        y += 4
      }

      // Sterke punten
      if (aj.sterke_punten?.length) {
        addLine()
        addText('Sterke punten', 13, true, [17,40,53])
        aj.sterke_punten.forEach(p => addText(`• ${p}`, 11, false, [6,95,70], mg + 4))
        y += 4
      }

      // Verbeterpunten
      const zwakke = aj.wellbeing_categorieen?.filter(c => c.niveau !== 'goed') ?? []
      if (zwakke.length) {
        addLine()
        addText('Verbeterpunten', 13, true, [17,40,53])
        zwakke.forEach(c => {
          addText(c.naam, 12, true, [55,65,81], mg + 4)
          addText(c.samenvatting, 11, false, [107,114,128], mg + 8)
          c.tips.forEach(tip => addText(`→ ${tip}`, 10, false, [107,114,128], mg + 8))
          y += 2
        })
        y += 2
      }

      // Burnout risico
      if (aj.burnout_risico) {
        addLine()
        const r = aj.burnout_risico
        addText(`Burn-out risico: ${r.niveau} (${r.score}/10)`, 13, true, [17,40,53])
        addText(r.uitleg, 11, false, [107,114,128])
        y += 4
      }

      // Actieplan
      if (aj.actieplan?.length) {
        addLine()
        addText('Actieplan volgende week', 13, true, [17,40,53])
        aj.actieplan.forEach((item, i) => {
          addText(`${i + 1}. ${item.actie}`, 11, true, [55,65,81], mg + 4)
          addText(`${item.wanneer} — ${item.waarom}`, 10, false, [107,114,128], mg + 8)
          y += 1
        })
        y += 4
      }

      // Bericht
      if (aj.bericht) {
        addLine()
        addText('Bericht van de AI Coach', 13, true, [17,40,53])
        addText(`"${aj.bericht}"`, 11, false, [107,114,128])
      }

      // Footer
      y = 285
      addText(`MentaForce · Fit Level ${xpLevel} (${LEVEL_NAMEN[xpLevel]}) · ${datum}`, 9, false, [156,163,175])

      doc.save(`rapport-${datum.replace(/ /g,'-')}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  const aj    = analyse?.analyse_json
  const scoreVals = analyse ? Object.values(analyse.scores).filter(v => v > 0) : []
  const gemiddelde = scoreVals.length > 0 ? scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length : 0
  const score = scoreVals.length > 0 ? Math.round(((gemiddelde - 4) / 16) * 100) : null
  const kleur = !score ? '#9CA3AF' : score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const label = !score ? '' : score >= 70 ? 'Goed op weg' : score >= 45 ? 'Aandacht nodig' : 'Zorg voor jezelf'
  const datum = analyse ? new Date(analyse.aangemaakt_op).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''

  const burnout = aj?.burnout_risico
  const burnoutCfg = !burnout ? null : burnout.niveau === 'hoog'
    ? { bg: '#FCEBEB', kleur: '#DC2626', label: 'Hoog risico' }
    : burnout.niveau === 'matig'
    ? { bg: '#FEF3C7', kleur: '#B45309', label: 'Matig risico' }
    : { bg: '#E1F5EE', kleur: '#1D9E75', label: 'Laag risico' }

  const zwakke = aj?.wellbeing_categorieen?.filter(c => c.niveau !== 'goed') ?? []

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 900, margin: '0 auto' }} ref={printRef}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 2 }}>Mijn rapport</h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>{datum || 'Nog geen check-in gedaan'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {analyse && (
              <button onClick={downloadPDF} disabled={downloading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#111827', color: 'white',
                borderRadius: 12, padding: '11px 20px',
                fontSize: 14, fontWeight: 600, border: 'none', cursor: downloading ? 'wait' : 'pointer',
                opacity: downloading ? 0.7 : 1,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {downloading ? 'Bezig…' : 'Download PDF'}
              </button>
            )}
            <Link href="/checkin" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1D9E75', color: 'white',
              borderRadius: 12, padding: '11px 20px',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Nieuwe check-in
            </Link>
          </div>
        </div>

        {/* Geen data / aan het laden */}
        {!analyse ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '60px 40px',
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            {analyseAanMaken ? (
              <>
                <div className="mf-spinner" style={{ margin: '0 auto 20px' }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Analyse wordt opgesteld…</h2>
                <p style={{ fontSize: 14, color: 'var(--text-3)' }}>De AI analyseert jouw check-in. Dit duurt een paar seconden.</p>
              </>
            ) : analyseFout ? (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Analyse mislukt</h2>
                <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Er ging iets mis bij het genereren van je rapport. Probeer het opnieuw.</p>
                <button onClick={() => { setAnalyseFout(false); setLaden(true); setTimeout(() => window.location.reload(), 50) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #1D9E75, #0ea872)', color: 'white', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Opnieuw proberen →
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Nog geen rapport beschikbaar</h2>
                <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Doe je eerste check-in om een persoonlijk rapport te krijgen.</p>
                <Link href="/checkin" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#1D9E75', color: 'white',
                  borderRadius: 12, padding: '12px 28px',
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                }}>
                  Start eerste check-in →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hoofd kaart: score + samenvatting */}
            <div style={{
              borderRadius: 20, padding: '28px 32px', flexWrap: 'wrap',
              background: score !== null
                ? score >= 70 ? 'linear-gradient(135deg, #E1F5EE 0%, #D1FAE5 60%, #EBF4FB 100%)'
                  : score >= 45 ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 60%, #FFF7ED 100%)'
                  : 'linear-gradient(135deg, #FEF2F2 0%, #FCEBEB 60%, #FEF3C7 100%)'
                : '#F9FAFB',
              border: `1.5px solid ${score !== null
                ? score >= 70 ? 'rgba(29,158,117,0.20)' : score >= 45 ? 'rgba(245,158,11,0.20)' : 'rgba(239,68,68,0.20)'
                : '#E5E7EB'}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: 28,
            }}>
              {score !== null && <ScoreRing score={score} />}
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: kleur, marginBottom: 6, letterSpacing: '-0.02em' }}>{label}</p>
                {aj?.samenvatting && (
                  <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.65, marginBottom: 16, maxWidth: 560 }}>{aj.samenvatting}</p>
                )}
                {/* Score bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 340 }}>
                  {VLAK_VOLGORDE.map(k => {
                    const v = analyse.scores[k]
                    if (!v) return null
                    const pct = Math.round(((v - 4) / 16) * 100)
                    return (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF', width: 72, flexShrink: 0 }}>{CAT_LABEL[k]}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: CAT_KLEUR[k], width: `${pct}%`, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: CAT_KLEUR[k], width: 32 }}>{v}/20</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Radar chart */}
            {Object.values(analyse.scores).some(v => v > 0) && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
                <RadarChart scores={analyse.scores} size={240} />
              </div>
            )}

            {/* Rij: burnout risico + sterke punten */}
            <div style={{ display: 'grid', gridTemplateColumns: burnoutCfg ? '1fr 1fr' : '1fr', gap: 16 }}>

              {/* Burnout risico */}
              {burnoutCfg && burnout && (
                <div style={{
                  background: burnoutCfg.bg, borderRadius: 16, padding: '20px 24px',
                  border: `1.5px solid ${burnoutCfg.kleur}30`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: burnoutCfg.kleur, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: burnoutCfg.kleur }}>Burn-out risico: {burnoutCfg.label}</p>
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: burnoutCfg.kleur }}>{burnout.score}/10</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{burnout.uitleg}</p>
                  {burnout.niveau !== 'laag' && (
                    <Link href="/burnout" style={{ fontSize: 12, fontWeight: 600, color: burnoutCfg.kleur, textDecoration: 'underline', marginTop: 8, display: 'inline-block' }}>
                      Doe de volledige scan →
                    </Link>
                  )}
                </div>
              )}

              {/* Sterke punten */}
              {aj?.sterke_punten && aj.sterke_punten.length > 0 && (
                <div style={{
                  background: '#E1F5EE', borderRadius: 16, padding: '20px 24px',
                  border: '1.5px solid #A7F3D0',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56', marginBottom: 10 }}>Sterke punten</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {aj.sterke_punten.map((p, i) => (
                      <span key={i} style={{
                        fontSize: 12, color: '#065F46', background: 'white',
                        borderRadius: 100, padding: '4px 12px',
                        border: '1px solid #A7F3D0', fontWeight: 500,
                      }}>✓ {p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verbeterpunten (compact) */}
            {zwakke.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>Verbeterpunten</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {zwakke.map(cat => {
                    const niveauKleur = cat.niveau === 'laag' ? '#DC2626' : '#B45309'
                    const niveauBg    = cat.niveau === 'laag' ? '#FEF2F2' : '#FEF3C7'
                    const niveauLabel = cat.niveau === 'laag' ? 'Aandacht nodig' : 'Matig'
                    return (
                      <div key={cat.naam} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', minWidth: 140 }}>{cat.naam}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: niveauBg, color: niveauKleur, flexShrink: 0 }}>
                          {niveauLabel}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-4)', flex: 1 }}>{cat.samenvatting}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Aandachtspunten */}
            {aj?.aandachtspunten && aj.aandachtspunten.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Aandachtspunten</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {aj.aandachtspunten.map((punt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, marginTop: 5 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>{punt.titel}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{punt.uitleg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actieplan */}
            {aj?.actieplan && aj.actieplan.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #E1F5EE 0%, #D1FAE5 100%)',
                borderRadius: 16, padding: '20px 24px',
                border: '1.5px solid rgba(29,158,117,0.20)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Actieplan volgende week</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {aj.actieplan.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1D9E75', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>{item.actie}</p>
                        <p style={{ fontSize: 12, color: '#0F6E56', lineHeight: 1.5, marginBottom: 6 }}>{item.waarom}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', background: 'rgba(255,255,255,0.6)', borderRadius: 100, padding: '3px 10px', border: '1px solid rgba(29,158,117,0.20)' }}>
                          📅 {item.wanneer}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI bericht */}
            {aj?.bericht && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Bericht van de Coach</p>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{aj.bericht}&rdquo;</p>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}
