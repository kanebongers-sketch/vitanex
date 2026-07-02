'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Send, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Ring } from '@/components/ui/Ring'
import { useToast } from '@/components/ui/Toast'


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
  if (s >= 4)  return 'var(--mf-green)'
  if (s >= 3)  return 'var(--mf-amber)'
  if (s >= 2)  return 'var(--mf-orange)'
  return 'var(--mf-red)'
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
  energie: 'var(--mf-green)', mentaal: 'var(--mf-blue)', werk: 'var(--mf-purple)',
  sociaal: 'var(--mf-amber)', groei:   'var(--mf-green)',
}

// ─── On-screen rapport weergave ───────────────────────────────────────────

function RapportWeergave({ data, totaal, catAvgs }: {
  data: RapportData
  totaal: number
  catAvgs: Record<string, number>
}) {
  const catsMetScore = HOOFDCATS.filter(c => catAvgs[c] !== undefined)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Score block */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '24px 24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'linear-gradient(135deg, var(--mentaforce-primary-light) 0%, var(--mf-blue-light) 100%)',
        }}>
          <Ring
            value={totaal}
            max={5}
            size={92}
            thickness={9}
            color={scoreKleur(totaal)}
            ariaLabel={`Vitaliteitsscore ${totaal.toFixed(1)} van 5 — ${scoreLabel(totaal)}`}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color: scoreKleur(totaal) }}>{totaal.toFixed(1)}</span>
          </Ring>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>Vitaliteitsscore deze week</p>
            <p style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: scoreKleur(totaal), lineHeight: 1 }}>{totaal.toFixed(1)}</span>
              <span style={{ fontSize: 16, color: 'var(--text-3)', fontWeight: 500 }}>/5</span>
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: scoreKleur(totaal), marginTop: 4 }}>{scoreLabel(totaal)}</p>
          </div>
        </div>

        {catsMetScore.length > 0 && (
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {catsMetScore.map(c => {
              const score = catAvgs[c]
              return (
                <Progress
                  key={c}
                  value={score}
                  max={5}
                  color={CAT_KLEUREN[c]}
                  thickness={6}
                  label={
                    <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: 'var(--text-2)' }}>{CAT_LABELS[c]}</span>
                      <span style={{ fontWeight: 700, color: scoreKleur(score), fontVariantNumeric: 'tabular-nums' }}>{score.toFixed(1)}</span>
                    </span>
                  }
                  ariaLabel={`${CAT_LABELS[c]}: ${score.toFixed(1)} van 5`}
                />
              )
            })}
          </div>
        )}
      </Card>

      {/* Samenvatting */}
      {data.samenvatting && (
        <Card style={{ padding: 24, borderLeft: '3px solid var(--mentaforce-primary)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', marginBottom: 8 }}>Samenvatting van jouw week</p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{data.samenvatting}</p>
        </Card>
      )}

      {/* Sterke punten */}
      {data.sterkePunten && (
        <Card style={{ padding: 24, background: 'var(--mf-green-light)', borderLeft: '3px solid var(--mf-green)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, color: 'var(--mf-green)' }}>Sterke punten</p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{data.sterkePunten}</p>
        </Card>
      )}

      {/* Aandachtspunten */}
      {data.aandachtspunten && (
        <Card style={{ padding: 24, background: 'var(--mf-amber-light)', borderLeft: '3px solid var(--mf-amber-dark)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, color: 'var(--mf-amber)' }}>Aandachtspunten</p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{data.aandachtspunten}</p>
        </Card>
      )}

      {/* Tips */}
      {data.tips?.length > 0 && (
        <Card style={{ padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', marginBottom: 16 }}>Tips voor deze week</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2, background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }} aria-hidden>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{tip.titel}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{tip.beschrijving}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
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
  doc.text('MentaForce', mg, 11)

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
    doc.text('MentaForce · Persoonlijk & Vertrouwelijk', mg, H - 8)
    doc.text(`${p} / ${numPages}`, W - mg, H - 8, { align: 'right' })
  }

  const datumFile = new Date().toLocaleDateString('nl-BE').replace(/\//g, '-')
  doc.save(`MentaForce-rapport-${datumFile}.pdf`)
}

// ─── Main component ───────────────────────────────────────────────────────

function MijnRapportInhoud() {
  const params    = useSearchParams()
  const sessieId  = params.get('sessie')
  const { toast } = useToast()

  const [rapportData, setRapportData] = useState<RapportData | null>(null)
  const [totaal,      setTotaal]      = useState(0)
  const [catAvgs,     setCatAvgs]     = useState<Record<string, number>>({})
  const [laden,       setLaden]       = useState(() => Boolean(sessieId))
  const [fout,        setFout]        = useState(() => sessieId ? '' : 'We konden dit rapport niet vinden.')
  const [pdfBezig,    setPdfBezig]    = useState(false)
  const [hrBezig,     setHrBezig]     = useState(false)
  const [hrVerstuurd, setHrVerstuurd] = useState(false)
  const [hrFout,      setHrFout]      = useState('')

  useEffect(() => {
    if (!sessieId) return

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
    } catch {
      toast({ title: 'PDF mislukt', description: 'Het rapport kon niet worden gedownload. Probeer het opnieuw.', variant: 'error' })
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
      style={{ background: 'var(--bg-app)' }}>
      <div className="mf-spinner" />
      <p className="text-sm" style={{ color: 'var(--text-4)' }}>AI analyseert je check-in...</p>
    </main>
  )

  if (fout) return (
    <main className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'var(--bg-app)' }}>
      <Card style={{ maxWidth: 384, width: '100%', padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 14, marginBottom: 20, color: 'var(--text-3)' }}>{fout}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/rapport" className="mf-rapport-link" style={{
            display: 'inline-block', padding: '12px', borderRadius: 'var(--radius-btn)',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            background: 'var(--mentaforce-primary)', color: 'var(--bg-app)',
          }}>
            Bekijk mijn laatste rapport
          </Link>
          <Link href="/checkin" className="mf-rapport-link" style={{
            display: 'inline-block', padding: '12px', borderRadius: 'var(--radius-btn)',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            border: '1px solid var(--border)', color: 'var(--text-3)',
          }}>
            Doe een nieuwe check-in
          </Link>
        </div>
        <style>{`
          .mf-rapport-link:focus-visible {
            outline: 2px solid var(--mentaforce-primary);
            outline-offset: 2px;
          }
          .mf-rapport-link:hover { opacity: 0.88; }
        `}</style>
      </Card>
    </main>
  )

  return (
    <main className="min-h-screen pb-16"
      style={{ background: 'var(--bg-app)' }}>
      <div className="max-w-2xl mx-auto px-5 pt-10">

        <div className="mb-5">
          <p style={{ fontSize: 12, marginBottom: 4, color: 'var(--text-4)' }}>Persoonlijk welzijnsrapport</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Jouw week in beeld</h1>
        </div>

        {rapportData && (
          <RapportWeergave data={rapportData} totaal={totaal} catAvgs={catAvgs} />
        )}

        {/* Actieknoppen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <button
            onClick={downloadPdf}
            disabled={pdfBezig || !rapportData}
            className="mf-rapport-btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 'var(--radius-btn)',
              color: 'var(--bg-app)',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid transparent',
              background: 'var(--mentaforce-primary)',
              cursor: (pdfBezig || !rapportData) ? 'not-allowed' : 'pointer',
              opacity: (pdfBezig || !rapportData) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.15s var(--ease)',
            }}>
            {pdfBezig
              ? <><Loader2 size={16} aria-hidden className="mf-rapport-spin" />PDF wordt aangemaakt...</>
              : <><Download size={16} aria-hidden />Download als PDF</>}
          </button>

          {hrVerstuurd
            ? <div style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-btn)', textAlign: 'center', fontSize: 14, fontWeight: 600, background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>
                Rapport verstuurd naar HR
              </div>
            : <button
                onClick={stuurNaarHr}
                disabled={hrBezig || !rapportData}
                className="mf-rapport-btn-secondary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-btn)',
                  fontWeight: 600,
                  fontSize: 14,
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-1)',
                  background: 'var(--bg-subtle)',
                  cursor: (hrBezig || !rapportData) ? 'not-allowed' : 'pointer',
                  opacity: (hrBezig || !rapportData) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.15s var(--ease)',
                }}>
                {hrBezig
                  ? <><Loader2 size={16} aria-hidden className="mf-rapport-spin" />Versturen...</>
                  : <><Send size={16} aria-hidden />Stuur naar HR</>}
              </button>
          }

          {hrFout && <p role="alert" style={{ fontSize: 12, textAlign: 'center', color: 'var(--mf-red)' }}>{hrFout}</p>}

          {!hrVerstuurd && (
            <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-4)' }}>
              Je naam en rapport worden per e-mail naar je HR-team gestuurd.
            </p>
          )}

          <Link href="/portaal"
            className="mf-rapport-terug"
            style={{ width: '100%', display: 'inline-block', textAlign: 'center', borderRadius: 'var(--radius-btn)', padding: '12px', fontSize: 14, border: '1px solid var(--border)', color: 'var(--text-3)', textDecoration: 'none' }}>
            Terug naar portaal
          </Link>
        </div>

        <p style={{ fontSize: 12, textAlign: 'center', marginTop: 24, paddingBottom: 16, color: 'var(--text-4)' }}>
          Dit rapport is persoonlijk en vertrouwelijk.
        </p>

        <style>{`
          .mf-rapport-spin { animation: mf-spin 0.7s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .mf-rapport-spin { animation: none; } }
          .mf-rapport-btn-primary:hover:not(:disabled),
          .mf-rapport-btn-secondary:hover:not(:disabled) { opacity: 0.88; }
          .mf-rapport-btn-primary:focus-visible,
          .mf-rapport-btn-secondary:focus-visible,
          .mf-rapport-terug:focus-visible {
            outline: 2px solid var(--mentaforce-primary);
            outline-offset: 2px;
          }
          .mf-rapport-terug:hover { border-color: var(--border-strong); color: var(--text-2); }
        `}</style>
      </div>
    </main>
  )
}

export default function MijnRapport() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-app)' }}>
        <div className="mf-spinner" />
      </main>
    }>
      <MijnRapportInhoud />
    </Suspense>
  )
}
