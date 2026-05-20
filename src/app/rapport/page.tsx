'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { laadXPData, berekenLevel, LEVEL_NAMEN } from '@/lib/xp'

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
  const r = 52, circ = 2 * Math.PI * r
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={kleur} strokeWidth="10"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 65 65)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="65" y="60" textAnchor="middle" fontSize="28" fontWeight="800" fill={kleur}>{score}</text>
      <text x="65" y="78" textAnchor="middle" fontSize="12" fill="#9CA3AF">/100</text>
    </svg>
  )
}

export default function Rapport() {
  const router  = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [laden, setLaden]     = useState(true)
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [xpLevel, setXpLevel] = useState(1)
  const [downloading, setDownloading] = useState(false)

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

      if (data) setAnalyse(data as Analyse)
      setLaden(false)

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px' }} ref={printRef}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 2 }}>Mijn rapport</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>{datum || 'Nog geen check-in gedaan'}</p>
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

        {/* Geen data */}
        {!analyse ? (
          <div style={{
            background: 'white', borderRadius: 20, padding: '60px 40px',
            border: '1px solid #E5E7EB', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Nog geen rapport beschikbaar</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Doe je eerste check-in om een persoonlijk rapport te krijgen.</p>
            <Link href="/checkin" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1D9E75', color: 'white',
              borderRadius: 12, padding: '12px 28px',
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}>
              Start eerste check-in →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hoofd kaart: score + samenvatting */}
            <div style={{
              background: 'white', borderRadius: 20, padding: '28px 32px',
              border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
            }}>
              {score !== null && <ScoreRing score={score} />}
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: kleur, marginBottom: 6, letterSpacing: '-0.02em' }}>{label}</p>
                {aj?.samenvatting && (
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, marginBottom: 16, maxWidth: 560 }}>{aj.samenvatting}</p>
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
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{burnout.uitleg}</p>
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
              <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Verbeterpunten</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {zwakke.map(cat => {
                    const niveauKleur = cat.niveau === 'laag' ? '#DC2626' : '#B45309'
                    const niveauBg    = cat.niveau === 'laag' ? '#FEF2F2' : '#FEF3C7'
                    const niveauLabel = cat.niveau === 'laag' ? 'Aandacht nodig' : 'Matig'
                    return (
                      <div key={cat.naam} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 140 }}>{cat.naam}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: niveauBg, color: niveauKleur, flexShrink: 0 }}>
                          {niveauLabel}
                        </span>
                        <span style={{ fontSize: 12, color: '#9CA3AF', flex: 1 }}>{cat.samenvatting}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}
