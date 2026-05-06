'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

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

const CAT_LABELS: Record<string, string> = {
  energie: 'Energie & Lichaam',
  mentaal: 'Mentaal welzijn',
  werk: 'Werk & Motivatie',
  sociaal: 'Team & Samenwerking',
  groei: 'Groei & Ontwikkeling',
}

const CAT_KLEUREN: Record<string, string> = {
  energie: '#1D9E75', mentaal: '#378ADD', werk: '#8B5CF6',
  sociaal: '#BA7517', groei: '#059669',
}

// ─── Format rapport tekst ─────────────────────────────────────────────────

function FormatRapport({ tekst }: { tekst: string }) {
  const secties = tekst.split(/\n(?=[A-Z][A-Z\s&]+\n)/)

  if (secties.length <= 1) {
    return (
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {tekst}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {secties.map((sectie, i) => {
        const lijnen = sectie.trim().split('\n')
        const isHeader = lijnen[0] && /^[A-Z][A-Z\s&]+$/.test(lijnen[0].trim())
        const header = isHeader ? lijnen[0].trim() : null
        const body = (header ? lijnen.slice(1) : lijnen).join('\n').trim()

        return (
          <div key={i}>
            {header && (
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {header}
              </p>
            )}
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {body}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Inner component ──────────────────────────────────────────────────────

function MijnRapportInhoud() {
  const params = useSearchParams()
  const sessieId = params.get('sessie')

  const [rapport, setRapport]     = useState('')
  const [totaal, setTotaal]       = useState(0)
  const [catAvgs, setCatAvgs]     = useState<Record<string, number>>({})
  const [laden, setLaden]         = useState(true)
  const [fout, setFout]           = useState('')
  const [pdfBezig, setPdfBezig]   = useState(false)
  const [hrBezig, setHrBezig]     = useState(false)
  const [hrVerstuurd, setHrVerstuurd] = useState(false)
  const [hrFout, setHrFout]       = useState('')

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
        setRapport(data.rapport ?? '')
        setTotaal(data.totaal ?? 0)
        setCatAvgs(data.catAvgs ?? {})
      })
      .catch(() => setFout('Rapport kon niet worden geladen.'))
      .finally(() => setLaden(false))
  }, [sessieId])

  async function downloadPdf() {
    if (!rapport) return
    setPdfBezig(true)
    try {
      const { default: jsPDF } = await import('jspdf')

      const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W        = doc.internal.pageSize.getWidth()
      const H        = doc.internal.pageSize.getHeight()
      const mg       = 20
      const cW       = W - mg * 2
      let   y        = mg

      function checkPage(needed = 8) {
        if (y + needed > H - mg) { doc.addPage(); y = mg }
      }

      // ── Header ────────────────────────────────────────
      doc.setFillColor(29, 158, 117)
      doc.rect(0, 0, W, 32, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16); doc.setFont('helvetica', 'bold')
      doc.text('Persoonlijk welzijnsrapport', mg, 14)
      doc.setFontSize(9);  doc.setFont('helvetica', 'normal')
      const datum = new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
      doc.text(`Vitanex · ${datum}`, mg, 23)
      y = 42

      // ── Totaalscore ───────────────────────────────────
      if (totaal > 0) {
        const sk: [number, number, number] =
          totaal >= 4 ? [29, 158, 117] : totaal >= 3 ? [186, 117, 23] : [226, 75, 74]
        doc.setTextColor(120, 120, 120); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
        doc.text('Vitaliteitsscore deze week', mg, y); y += 6
        doc.setTextColor(...sk); doc.setFontSize(28); doc.setFont('helvetica', 'bold')
        doc.text(`${totaal.toFixed(1)} / 5`, mg, y + 7); y += 16
      }

      // ── Categoriescores ───────────────────────────────
      const hoofdCats = ['energie', 'mentaal', 'werk', 'sociaal', 'groei']
      const catLabels: Record<string, string> = {
        energie: 'Energie & Lichaam', mentaal: 'Mentaal welzijn',
        werk: 'Werk & Motivatie',     sociaal: 'Team & Samenwerking',
        groei: 'Groei & Ontwikkeling',
      }
      const catKleuren: Record<string, [number, number, number]> = {
        energie: [29, 158, 117], mentaal: [55, 138, 221],
        werk: [139, 92, 246],    sociaal: [186, 117, 23],
        groei: [5, 150, 105],
      }

      for (const cat of hoofdCats.filter(c => catAvgs[c] !== undefined)) {
        checkPage(12)
        const score = catAvgs[cat]
        const kl    = catKleuren[cat]
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60);  doc.text(catLabels[cat], mg, y)
        doc.setTextColor(...kl);       doc.setFont('helvetica', 'bold')
        doc.text(`${score.toFixed(1)}`, W - mg, y, { align: 'right' })
        doc.setFont('helvetica', 'normal'); y += 3
        doc.setFillColor(235, 235, 235); doc.roundedRect(mg, y, cW, 2.5, 1, 1, 'F')
        doc.setFillColor(...kl);         doc.roundedRect(mg, y, cW * (score / 5), 2.5, 1, 1, 'F')
        y += 7
      }

      // ── Scheidingslijn ────────────────────────────────
      y += 2
      doc.setDrawColor(220, 220, 220); doc.line(mg, y, W - mg, y); y += 8

      // ── AI rapport tekst ──────────────────────────────
      const secties = rapport.split(/\n(?=[A-Z][A-Z\s&]+\n)/)
      for (const sectie of secties) {
        const lijnen  = sectie.trim().split('\n')
        const isHdr   = lijnen[0] && /^[A-Z][A-Z\s&]+$/.test(lijnen[0].trim())
        const header  = isHdr ? lijnen[0].trim() : null
        const body    = (header ? lijnen.slice(1) : lijnen).join('\n').trim()

        if (header) {
          checkPage(10)
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
          doc.setTextColor(160, 160, 160)
          doc.text(header, mg, y); y += 5
        }
        if (body) {
          const regels = doc.splitTextToSize(body, cW) as string[]
          doc.setFontSize(10); doc.setFont('helvetica', 'normal')
          doc.setTextColor(55, 55, 55)
          for (const regel of regels) {
            checkPage(6); doc.text(regel, mg, y); y += 5.5
          }
          y += 4
        }
      }

      const datumFile = new Date().toLocaleDateString('nl-BE').replace(/\//g, '-')
      doc.save(`Vitanex-rapport-${datumFile}.pdf`)
    } catch (err) {
      console.error('[pdf]', err)
    } finally {
      setPdfBezig(false)
    }
  }

  async function stuurNaarHr() {
    if (!sessieId || hrVerstuurd) return
    setHrBezig(true)
    setHrFout('')
    try {
      const res  = await fetch('/api/rapport-naar-hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessie_id: sessieId, rapport_tekst: rapport }),
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

  // ── Laadscherm ─────────────────────────────────────────────────────────

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

  const hoofdCats = ['energie', 'mentaal', 'werk', 'sociaal', 'groei']

  return (
    <main className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>

      <div className="max-w-xl mx-auto px-5 pt-10">

        {/* Rapport kaart */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-5 overflow-hidden">

          {/* Header */}
          <div className="p-8 pb-6" style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
            <p className="text-xs font-medium text-gray-500 mb-1">Persoonlijk welzijnsrapport</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Jouw week in beeld</h1>

            {totaal > 0 && (
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black" style={{ color: scoreKleur(totaal) }}>
                  {totaal.toFixed(1)}
                </span>
                <span className="text-xl font-medium text-gray-400 pb-1">/5</span>
                <span className="ml-2 pb-1 text-sm font-semibold" style={{ color: scoreKleur(totaal) }}>
                  {scoreLabel(totaal)}
                </span>
              </div>
            )}
          </div>

          {/* Categorie scores */}
          {Object.keys(catAvgs).length > 0 && (
            <div className="px-8 py-5 border-b border-gray-50">
              <div className="space-y-3">
                {hoofdCats.filter(c => catAvgs[c] !== undefined).map(c => {
                  const kleur = CAT_KLEUREN[c]
                  const score = catAvgs[c]
                  const pct   = Math.round((score / 5) * 100)
                  return (
                    <div key={c}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{CAT_LABELS[c]}</span>
                        <span className="font-semibold" style={{ color: scoreKleur(score) }}>
                          {score.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: kleur }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI rapport tekst */}
          <div className="px-8 py-6">
            <FormatRapport tekst={rapport} />
          </div>

          {/* Footer voor PDF */}
          <div className="px-8 pb-6">
            <p className="text-xs text-gray-300">
              Gegenereerd door Vitanex · {new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Actieknoppen */}
        <div className="space-y-3">
          <button
            onClick={downloadPdf}
            disabled={pdfBezig}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1D9E75' }}>
            {pdfBezig ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                PDF wordt gemaakt...
              </>
            ) : (
              'Download als PDF'
            )}
          </button>

          {hrVerstuurd ? (
            <div className="w-full py-3.5 rounded-xl text-center text-sm font-medium"
              style={{ background: '#E1F5EE', color: '#1D9E75' }}>
              Rapport verstuurd naar HR
            </div>
          ) : (
            <button
              onClick={stuurNaarHr}
              disabled={hrBezig}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 border flex items-center justify-center gap-2"
              style={{ borderColor: '#378ADD', color: '#378ADD' }}>
              {hrBezig ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Versturen...
                </>
              ) : (
                'Stuur naar HR'
              )}
            </button>
          )}

          {hrFout && (
            <p className="text-xs text-red-500 text-center">{hrFout}</p>
          )}

          {!hrVerstuurd && (
            <p className="text-xs text-gray-400 text-center px-4">
              Je naam en rapport worden per e-mail naar je HR-team gestuurd.
            </p>
          )}

          <Link
            href="/portaal"
            className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Terug naar portaal
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          Dit rapport is persoonlijk en anoniem opgeslagen.
        </p>
      </div>
    </main>
  )
}

// ─── Export met Suspense ──────────────────────────────────────────────────

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
