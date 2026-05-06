'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────

type Tip = { titel: string; beschrijving: string }

type RapportData = {
  samenvatting:    string
  sterkePunten:    string
  aandachtspunten: string
  tips:            Tip[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function scoreKleur(s: number) {
  if (s >= 4)  return '#1D9E75'
  if (s >= 3)  return '#BA7517'
  if (s >= 2)  return '#F97316'
  return '#E24B4A'
}
function scoreLabel(s: number) {
  if (s >= 4.5) return 'Uitstekend'
  if (s >= 4)   return 'Goed'
  if (s >= 3.5) return 'Redelijk goed'
  if (s >= 3)   return 'Matig'
  if (s >= 2)   return 'Aandacht nodig'
  return 'Zorgwekkend'
}

const HOOFDCATS = ['energie', 'mentaal', 'werk', 'sociaal', 'groei']
const CAT_LABELS: Record<string, string> = {
  energie: 'Energie & Lichaam',   mentaal: 'Mentaal welzijn',
  werk:    'Werk & Motivatie',    sociaal: 'Team & Samenwerking',
  groei:   'Groei & Ontwikkeling',
}
const CAT_KLEUREN: Record<string, string> = {
  energie: '#1D9E75', mentaal: '#378ADD', werk: '#8B5CF6',
  sociaal: '#BA7517', groei:   '#059669',
}

// ─── On-screen rapport weergave ───────────────────────────────────────────

function RapportWeergave({ data, totaal, catAvgs }: {
  data: RapportData
  totaal: number
  catAvgs: Record<string, number>
}) {
  const catsMetScore = HOOFDCATS.filter(c => catAvgs[c] !== undefined)

  return (
    <div className="space-y-4">

      {/* Score block */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 pb-5" style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
          <p className="text-xs text-gray-500 mb-1">Vitaliteitsscore deze week</p>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-5xl font-black" style={{ color: scoreKleur(totaal) }}>
              {totaal.toFixed(1)}
            </span>
            <span className="text-xl text-gray-400 font-medium pb-1">/5</span>
            <span className="pb-1 text-sm font-semibold" style={{ color: scoreKleur(totaal) }}>
              — {scoreLabel(totaal)}
            </span>
          </div>
        </div>

        {catsMetScore.length > 0 && (
          <div className="px-6 py-4 space-y-3">
            {catsMetScore.map(c => {
              const score = catAvgs[c]
              const kleur = CAT_KLEUREN[c]
              return (
                <div key={c}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{CAT_LABELS[c]}</span>
                    <span className="font-bold" style={{ color: scoreKleur(score) }}>{score.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(score / 5) * 100}%`, background: kleur }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Samenvatting */}
      {data.samenvatting && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6"
          style={{ borderLeft: '3px solid #1D9E75' }}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Samenvatting van jouw week</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.samenvatting}</p>
        </div>
      )}

      {/* Sterke punten */}
      {data.sterkePunten && (
        <div className="rounded-2xl p-6" style={{ background: '#F0FDF4', borderLeft: '3px solid #1D9E75' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#1D9E75' }}>Sterke punten</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.sterkePunten}</p>
        </div>
      )}

      {/* Aandachtspunten */}
      {data.aandachtspunten && (
        <div className="rounded-2xl p-6" style={{ background: '#FFFBEB', borderLeft: '3px solid #BA7517' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#BA7517' }}>Aandachtspunten</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.aandachtspunten}</p>
        </div>
      )}

      {/* Tips */}
      {data.tips?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Tips voor deze week</p>
          <div className="space-y-3">
            {data.tips.map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: '#1D9E75', color: 'white' }}>
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{tip.titel}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{tip.beschrijving}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PDF export ───────────────────────────────────────────────────────────

async function buildPdf(data: RapportData, totaal: number, catAvgs: Record<string, number>) {
  const { default: jsPDF } = await import('jspdf')

  const W  = 210, H = 297
  const mg = 16
  const cW = W - mg * 2   // 178mm
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Colour palette ─────────────────────────────────
  type RGB = [number, number, number]
  const GREEN:      RGB = [29,  158, 117]
  const DARK_GREEN: RGB = [12,  74,  52]
  const AMBER:      RGB = [180, 113, 22]
  const TEXT:       RGB = [30,  41,  59]
  const MUTED:      RGB = [100, 116, 139]
  const BG_GRAY:    RGB = [248, 250, 252]
  const BG_GREEN:   RGB = [240, 253, 244]
  const BG_AMBER:   RGB = [255, 251, 235]
  const RULE:       RGB = [226, 232, 240]

  const catRGB: Record<string, RGB> = {
    energie: [29, 158, 117], mentaal: [55, 138, 221],
    werk:    [139, 92, 246], sociaal: [186, 117, 23],
    groei:   [5,  150, 105],
  }

  function sk(s: number): RGB {
    if (s >= 4) return GREEN
    if (s >= 3) return AMBER
    return [220, 60, 60]
  }

  let y = 0

  function checkPage(needed = 10) {
    if (y + needed > H - 20) { doc.addPage(); y = mg + 4 }
  }

  function card(yPos: number, h: number, bg: RGB, accent: RGB) {
    doc.setFillColor(...bg);     doc.roundedRect(mg, yPos, cW, h, 2, 2, 'F')
    doc.setFillColor(...accent); doc.roundedRect(mg, yPos, 3, h, 1, 1, 'F')
  }

  function sectionLabel(label: string, color: RGB) {
    doc.setFontSize(7); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...color)
    doc.text(label.toUpperCase(), mg + 7, y + 8)
    y += 12
  }

  function bodyText(text: string, width = cW - 10, indent = mg + 7, lineH = 5.4) {
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT)
    const lines = doc.splitTextToSize(text, width) as string[]
    for (const line of lines) {
      checkPage(lineH + 1)
      doc.text(line, indent, y)
      y += lineH
    }
  }

  // ── 1. HEADER ─────────────────────────────────────
  doc.setFillColor(...DARK_GREEN)
  doc.rect(0, 0, W, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
  doc.text('VITANEX', mg, 11)

  doc.setFontSize(19); doc.setFont('helvetica', 'bold')
  doc.text('Persoonlijk Welzijnsrapport', mg, 22)

  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 220, 190)
  const datum = new Date().toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  doc.text(datum, mg, 32)

  y = 48

  // ── 2. SCORE + CATEGORIES ─────────────────────────
  const scoreBoxW = 54
  const catX      = mg + scoreBoxW + 8
  const catBarW   = cW - scoreBoxW - 20
  const scoreH    = 50

  // Score card
  doc.setFillColor(...BG_GRAY); doc.roundedRect(mg, y, scoreBoxW, scoreH, 3, 3, 'F')
  doc.setFillColor(...sk(totaal)); doc.roundedRect(mg, y, scoreBoxW, 3, 1, 1, 'F')

  doc.setFontSize(7); doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text('TOTAALSCORE', mg + scoreBoxW / 2, y + 10, { align: 'center' })

  if (totaal > 0) {
    const col = sk(totaal)
    doc.setFontSize(32); doc.setFont('helvetica', 'bold'); doc.setTextColor(...col)
    doc.text(totaal.toFixed(1), mg + scoreBoxW / 2, y + 28, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED)
    doc.text('/ 5', mg + scoreBoxW / 2, y + 35, { align: 'center' })
    doc.setFontSize(8);  doc.setTextColor(...col)
    doc.text(scoreLabel(totaal), mg + scoreBoxW / 2, y + 43, { align: 'center' })
  }

  // Category bars
  const cats = HOOFDCATS.filter(c => catAvgs[c] !== undefined)
  const rowH  = scoreH / Math.max(cats.length, 1)

  cats.forEach((cat, i) => {
    const score = catAvgs[cat]
    const kl    = catRGB[cat]
    const ry    = y + i * rowH + rowH * 0.25

    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
    doc.text(CAT_LABELS[cat], catX, ry + 4)

    doc.setFont('helvetica', 'bold'); doc.setTextColor(...kl)
    doc.text(score.toFixed(1), mg + cW, ry + 4, { align: 'right' })

    const bY = ry + 5.5
    doc.setFillColor(...RULE);  doc.roundedRect(catX, bY, catBarW, 2.2, 1, 1, 'F')
    doc.setFillColor(...kl);    doc.roundedRect(catX, bY, catBarW * (score / 5), 2.2, 1, 1, 'F')
  })

  y += scoreH + 10

  // ── 3. SAMENVATTING ───────────────────────────────
  if (data.samenvatting) {
    const lines = doc.splitTextToSize(data.samenvatting, cW - 10) as string[]
    const h = lines.length * 5.4 + 16
    checkPage(h + 6)
    card(y, h, BG_GRAY, GREEN)
    sectionLabel('Samenvatting van jouw week', GREEN)
    bodyText(data.samenvatting)
    y += 8
  }

  // ── 4. STERKE PUNTEN ──────────────────────────────
  if (data.sterkePunten) {
    const lines = doc.splitTextToSize(data.sterkePunten, cW - 10) as string[]
    const h = lines.length * 5.4 + 16
    checkPage(h + 6)
    card(y, h, BG_GREEN, GREEN)
    sectionLabel('Sterke punten', GREEN)
    bodyText(data.sterkePunten)
    y += 8
  }

  // ── 5. AANDACHTSPUNTEN ────────────────────────────
  if (data.aandachtspunten) {
    const lines = doc.splitTextToSize(data.aandachtspunten, cW - 10) as string[]
    const h = lines.length * 5.4 + 16
    checkPage(h + 6)
    card(y, h, BG_AMBER, AMBER)
    sectionLabel('Aandachtspunten', AMBER)
    bodyText(data.aandachtspunten)
    y += 8
  }

  // ── 6. TIPS ───────────────────────────────────────
  if (data.tips?.length) {
    checkPage(14)
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MUTED)
    doc.text('TIPS VOOR DEZE WEEK', mg, y + 6)
    y += 12

    data.tips.forEach((tip, i) => {
      const descLines = doc.splitTextToSize(tip.beschrijving, cW - 18) as string[]
      const h = descLines.length * 5.4 + 16
      checkPage(h + 4)

      doc.setFillColor(...BG_GRAY); doc.roundedRect(mg, y, cW, h, 2, 2, 'F')
      doc.setFillColor(...GREEN);   doc.circle(mg + 7, y + 8, 3.5, 'F')

      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
      doc.text(String(i + 1), mg + 7, y + 10.2, { align: 'center' })

      doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEXT)
      doc.text(tip.titel, mg + 14, y + 10)

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
      let tipY = y + 15.5
      for (const line of descLines) { doc.text(line, mg + 14, tipY); tipY += 5.4 }

      y += h + 4
    })
  }

  // ── FOOTER op elke pagina ─────────────────────────
  const numPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let p = 1; p <= numPages; p++) {
    doc.setPage(p)
    doc.setDrawColor(...RULE); doc.line(mg, H - 14, W - mg, H - 14)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED)
    doc.text('Vitanex · Persoonlijk & Vertrouwelijk', mg, H - 8)
    doc.text(`${p} / ${numPages}`, W - mg, H - 8, { align: 'right' })
  }

  const datumFile = new Date().toLocaleDateString('nl-BE').replace(/\//g, '-')
  doc.save(`Vitanex-rapport-${datumFile}.pdf`)
}

// ─── Main component ───────────────────────────────────────────────────────

function MijnRapportInhoud() {
  const params    = useSearchParams()
  const sessieId  = params.get('sessie')

  const [rapportData, setRapportData] = useState<RapportData | null>(null)
  const [totaal,      setTotaal]      = useState(0)
  const [catAvgs,     setCatAvgs]     = useState<Record<string, number>>({})
  const [laden,       setLaden]       = useState(true)
  const [fout,        setFout]        = useState('')
  const [pdfBezig,    setPdfBezig]    = useState(false)
  const [hrBezig,     setHrBezig]     = useState(false)
  const [hrVerstuurd, setHrVerstuurd] = useState(false)
  const [hrFout,      setHrFout]      = useState('')

  useEffect(() => {
    if (!sessieId) { setFout('Geen sessie-ID gevonden.'); setLaden(false); return }

    fetch('/api/rapport-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessie_id: sessieId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFout(data.error); return }
        setRapportData(data.rapport ?? null)
        setTotaal(data.totaal ?? 0)
        setCatAvgs(data.catAvgs ?? {})
      })
      .catch(() => setFout('Rapport kon niet worden geladen.'))
      .finally(() => setLaden(false))
  }, [sessieId])

  async function downloadPdf() {
    if (!rapportData) return
    setPdfBezig(true)
    try {
      await buildPdf(rapportData, totaal, catAvgs)
    } catch (err) {
      console.error('[pdf]', err)
    } finally {
      setPdfBezig(false)
    }
  }

  async function stuurNaarHr() {
    if (!sessieId || hrVerstuurd || !rapportData) return
    setHrBezig(true); setHrFout('')
    try {
      // Convert structured data to plain text for email
      const tekst = [
        `Samenvatting: ${rapportData.samenvatting}`,
        `\nSterke punten:\n${rapportData.sterkePunten}`,
        `\nAandachtspunten:\n${rapportData.aandachtspunten}`,
        `\nTips:\n${rapportData.tips.map((t, i) => `${i + 1}. ${t.titel}: ${t.beschrijving}`).join('\n')}`,
      ].join('\n\n')

      const res  = await fetch('/api/rapport-naar-hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessie_id: sessieId, rapport_tekst: tekst }),
      })
      const data = await res.json()
      if (data.error) { setHrFout(data.error); return }
      setHrVerstuurd(true)
    } catch {
      setHrFout('Er ging iets mis. Probeer opnieuw.')
    } finally {
      setHrBezig(false)
    }
  }

  // ── Loading ─────────────────────────────────────────
  if (laden) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
        style={{ borderTopColor: '#1D9E75' }} />
      <p className="text-sm text-gray-500">AI analyseert je check-in...</p>
    </main>
  )

  if (fout) return (
    <main className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>
      <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500 mb-4">{fout}</p>
        <Link href="/portaal" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
          Terug naar portaal
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>
      <div className="max-w-xl mx-auto px-5 pt-10">

        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1">Persoonlijk welzijnsrapport</p>
          <h1 className="text-2xl font-bold text-gray-900">Jouw week in beeld</h1>
        </div>

        {rapportData && (
          <RapportWeergave data={rapportData} totaal={totaal} catAvgs={catAvgs} />
        )}

        {/* Actieknoppen */}
        <div className="space-y-3 mt-5">
          <button
            onClick={downloadPdf}
            disabled={pdfBezig || !rapportData}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1D9E75' }}>
            {pdfBezig
              ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />PDF wordt aangemaakt...</>
              : 'Download als PDF'}
          </button>

          {hrVerstuurd
            ? <div className="w-full py-3.5 rounded-xl text-center text-sm font-medium"
                style={{ background: '#E1F5EE', color: '#1D9E75' }}>
                Rapport verstuurd naar HR
              </div>
            : <button
                onClick={stuurNaarHr}
                disabled={hrBezig || !rapportData}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 border flex items-center justify-center gap-2"
                style={{ borderColor: '#378ADD', color: '#378ADD' }}>
                {hrBezig
                  ? <><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />Versturen...</>
                  : 'Stuur naar HR'}
              </button>
          }

          {hrFout && <p className="text-xs text-red-500 text-center">{hrFout}</p>}

          {!hrVerstuurd && (
            <p className="text-xs text-gray-400 text-center">
              Je naam en rapport worden per e-mail naar je HR-team gestuurd.
            </p>
          )}

          <Link href="/portaal"
            className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Terug naar portaal
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          Dit rapport is persoonlijk en vertrouwelijk.
        </p>
      </div>
    </main>
  )
}

export default function MijnRapport() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
          style={{ borderTopColor: '#1D9E75' }} />
      </main>
    }>
      <MijnRapportInhoud />
    </Suspense>
  )
}
