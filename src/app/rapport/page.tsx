'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Checkin = {
  id: string
  energie: number
  slaap: number
  werkdruk: number
  motivatie: number
  herstel: number
  fysiek_pijn: number
  fysiek_beweging: number
  mentaal_focus: number
  mentaal_stress: number
  mentaal_balans: number
  sociaal_team: number
  sociaal_steun: number
  toelichting: string | null
  created_at: string
}

type TeamLid = {
  id: string
  naam: string
  deze_week_ingevuld: boolean
  laatste_score: number | null
}

function gem(arr: (number | null | undefined)[]) {
  const schoon = arr.filter(n => n !== null && n !== undefined) as number[]
  if (!schoon.length) return 0
  return Math.round((schoon.reduce((a, b) => a + b, 0) / schoon.length) * 10) / 10
}

function scoreKleur(score: number) {
  if (score >= 4) return '#1D9E75'
  if (score >= 2.5) return '#BA7517'
  return '#E24B4A'
}

function scoreLabel(score: number) {
  if (score >= 4) return 'Goed'
  if (score >= 2.5) return 'Matig'
  return 'Aandacht nodig'
}

const maanden = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']

export default function Rapport() {
  const router = useRouter()
  const rapportRef = useRef<HTMLDivElement>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [team, setTeam] = useState<TeamLid[]>([])
  const [bedrijfNaam, setBedrijfNaam] = useState('')
  const [laden, setLaden] = useState(true)
  const [exportBezig, setExportBezig] = useState(false)
  const [geselecteerdeMaand, setGeselecteerdeMaand] = useState(new Date().getMonth())
  const [geselecteerdJaar, setGeselecteerdJaar] = useState(new Date().getFullYear())

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles')
        .select('bedrijf_id, rol')
        .eq('id', user.id)
        .single()

      if (!profiel?.bedrijf_id) { setLaden(false); return }

      const { data: bedrijf } = await supabase
        .from('bedrijven')
        .select('naam')
        .eq('id', profiel.bedrijf_id)
        .single()

      setBedrijfNaam(bedrijf?.naam || 'Onbekend bedrijf')

      const beginMaand = new Date(geselecteerdJaar, geselecteerdeMaand, 1)
      const eindMaand = new Date(geselecteerdJaar, geselecteerdeMaand + 1, 0, 23, 59, 59)

      const { data: checkinData } = await supabase
        .from('checkins')
        .select('*, profiles!inner(bedrijf_id)')
        .eq('profiles.bedrijf_id', profiel.bedrijf_id)
        .gte('created_at', beginMaand.toISOString())
        .lte('created_at', eindMaand.toISOString())
        .order('created_at', { ascending: true })

      setCheckins(checkinData || [])

      const { data: teamData } = await supabase
        .from('checkin_status')
        .select('*')
        .eq('bedrijf_id', profiel.bedrijf_id)

      setTeam(teamData || [])
      setLaden(false)
    }
    laadData()
  }, [router, geselecteerdeMaand, geselecteerdJaar])

  async function exporteerPDF() {
    if (!rapportRef.current) return
    setExportBezig(true)

    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')

    const canvas = await html2canvas(rapportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pdfBreedte = pdf.internal.pageSize.getWidth()
    const pdfHoogte = pdf.internal.pageSize.getHeight()
    const canvasHoogte = (canvas.height * pdfBreedte) / canvas.width

    let positie = 0
    let resterend = canvasHoogte

    while (resterend > 0) {
      pdf.addImage(imgData, 'PNG', 0, positie, pdfBreedte, canvasHoogte)
      resterend -= pdfHoogte
      if (resterend > 0) {
        pdf.addPage()
        positie -= pdfHoogte
      }
    }

    pdf.save(`MentaForce-rapport-${bedrijfNaam}-${maanden[geselecteerdeMaand]}-${geselecteerdJaar}.pdf`)
    setExportBezig(false)
  }

  // Bereken metrics
  const fysiekScore = gem([
    gem(checkins.map(c => c.energie)),
    gem(checkins.map(c => c.slaap)),
    gem(checkins.map(c => c.fysiek_pijn)),
    gem(checkins.map(c => c.fysiek_beweging)),
  ])

  const mentaalScore = gem([
    gem(checkins.map(c => c.werkdruk)),
    gem(checkins.map(c => c.mentaal_focus)),
    gem(checkins.map(c => c.mentaal_stress)),
    gem(checkins.map(c => c.mentaal_balans)),
  ])

  const sociaalScore = gem([
    gem(checkins.map(c => c.motivatie)),
    gem(checkins.map(c => c.sociaal_team)),
    gem(checkins.map(c => c.sociaal_steun)),
    gem(checkins.map(c => c.herstel)),
  ])

  const totaalScore = gem([fysiekScore, mentaalScore, sociaalScore])

  const toelichtingen = checkins.filter(c => c.toelichting && c.toelichting.trim() !== '')
  const waarschuwingen = team.filter(l => l.laatste_score !== null && l.laatste_score < 2.5)
  const participatie = team.length > 0 ? Math.round((checkins.length / team.length) * 100) : 0

  const detailMetrics = [
    { label: 'Energie', waarde: gem(checkins.map(c => c.energie)) },
    { label: 'Slaap', waarde: gem(checkins.map(c => c.slaap)) },
    { label: 'Fysieke klachten', waarde: gem(checkins.map(c => c.fysiek_pijn)) },
    { label: 'Beweging', waarde: gem(checkins.map(c => c.fysiek_beweging)) },
    { label: 'Werkdruk', waarde: gem(checkins.map(c => c.werkdruk)) },
    { label: 'Focus', waarde: gem(checkins.map(c => c.mentaal_focus)) },
    { label: 'Stress', waarde: gem(checkins.map(c => c.mentaal_stress)) },
    { label: 'Werk-privé balans', waarde: gem(checkins.map(c => c.mentaal_balans)) },
    { label: 'Motivatie', waarde: gem(checkins.map(c => c.motivatie)) },
    { label: 'Teamwerk', waarde: gem(checkins.map(c => c.sociaal_team)) },
    { label: 'Sociale steun', waarde: gem(checkins.map(c => c.sociaal_steun)) },
    { label: 'Herstel', waarde: gem(checkins.map(c => c.herstel)) },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto p-8">

        {/* Header + controls */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Maandrapport</h1>
            <p className="text-gray-400 text-sm mt-0.5">Exporteer een PDF-rapport voor de directie.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={geselecteerdeMaand}
              onChange={e => setGeselecteerdeMaand(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            >
              {maanden.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={geselecteerdJaar}
              onChange={e => setGeselecteerdJaar(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            >
              {[2024, 2025, 2026, 2027].map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <button
              onClick={exporteerPDF}
              disabled={exportBezig || checkins.length === 0}
              className="text-white rounded-xl px-5 py-2 text-sm font-medium transition disabled:opacity-30 flex items-center gap-2"
              style={{ background: 'var(--MentaForce-primary)' }}
            >
              {exportBezig ? 'Exporteren...' : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>)}
            </button>
          </div>
        </div>

        {laden ? (
          <p className="text-gray-400 text-sm">Laden...</p>
        ) : checkins.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">Geen check-ins gevonden voor {maanden[geselecteerdeMaand]} {geselecteerdJaar}.</p>
          </div>
        ) : (

          /* Rapport  dit wordt geëxporteerd als PDF */
          <div ref={rapportRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

            {/* Rapport header */}
            <div className="p-8 pb-6" style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--MentaForce-primary)' }}>
                      <span className="text-white text-xs font-medium">V</span>
                    </div>
                    <span className="font-medium text-gray-700">MentaForce</span>
                  </div>
                  <h2 className="text-2xl font-medium text-gray-900">Vitaliteitsrapport</h2>
                  <p className="text-gray-600 text-sm mt-1">{bedrijfNaam} · {maanden[geselecteerdeMaand]} {geselecteerdJaar}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Gegenereerd op</p>
                  <p className="text-sm font-medium text-gray-700">{new Date().toLocaleDateString('nl-BE')}</p>
                </div>
              </div>
            </div>

            <div className="p-8">

              {/* Totaalscore */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="col-span-1 rounded-2xl p-5 text-center" style={{ background: 'var(--bg-app)', border: `2px solid ${scoreKleur(totaalScore)}` }}>
                  <p className="text-xs text-gray-400 mb-1">Totaalscore</p>
                  <p className="text-4xl font-medium" style={{ color: scoreKleur(totaalScore) }}>{totaalScore}/5</p>
                  <p className="text-xs font-medium mt-1" style={{ color: scoreKleur(totaalScore) }}>{scoreLabel(totaalScore)}</p>
                </div>
                <div className="rounded-2xl p-5 text-center" style={{ background: '#E1F5EE' }}>
                  <p className="text-xs mb-1" style={{ color: '#0F6E56' }}>Fysiek</p>
                  <p className="text-3xl font-medium" style={{ color: '#1D9E75' }}>{fysiekScore}/5</p>
                </div>
                <div className="rounded-2xl p-5 text-center" style={{ background: '#E6F1FB' }}>
                  <p className="text-xs mb-1" style={{ color: '#185FA5' }}>Mentaal</p>
                  <p className="text-3xl font-medium" style={{ color: '#378ADD' }}>{mentaalScore}/5</p>
                </div>
                <div className="rounded-2xl p-5 text-center" style={{ background: '#EEEDFE' }}>
                  <p className="text-xs mb-1" style={{ color: '#3C3489' }}>Sociaal</p>
                  <p className="text-3xl font-medium" style={{ color: '#8B5CF6' }}>{sociaalScore}/5</p>
                </div>
              </div>

              {/* Participatie */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-app)' }}>
                  <p className="text-xs text-gray-400 mb-1">Check-ins ontvangen</p>
                  <p className="text-2xl font-medium text-gray-900">{checkins.length}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-app)' }}>
                  <p className="text-xs text-gray-400 mb-1">Teamleden</p>
                  <p className="text-2xl font-medium text-gray-900">{team.length}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-app)' }}>
                  <p className="text-xs text-gray-400 mb-1">Participatiegraad</p>
                  <p className="text-2xl font-medium" style={{ color: participatie >= 80 ? '#1D9E75' : participatie >= 50 ? '#BA7517' : '#E24B4A' }}>
                    {participatie}%
                  </p>
                </div>
              </div>

              {/* Detail per metric */}
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-700 mb-4">Scores per indicator</p>
                <div className="grid grid-cols-2 gap-3">
                  {detailMetrics.map(m => (
                    <div key={m.label} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'var(--bg-app)' }}>
                      <span className="text-sm text-gray-600">{m.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(m.waarde / 5) * 100}%`, background: scoreKleur(m.waarde) }} />
                        </div>
                        <span className="text-sm font-medium w-8 text-right" style={{ color: scoreKleur(m.waarde) }}>{m.waarde}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waarschuwingen */}
              {waarschuwingen.length > 0 && (
                <div className="rounded-xl p-5 mb-8" style={{ background: '#FCEBEB', border: '0.5px solid #F09595' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: '#A32D2D' }}>Aandachtspunten</p>
                  <p className="text-sm" style={{ color: '#A32D2D' }}>
                    {waarschuwingen.length} medewerker{waarschuwingen.length > 1 ? 's hebben' : ' heeft'} een score onder 2.5/5.
                    Een persoonlijk gesprek wordt aanbevolen.
                  </p>
                </div>
              )}

              {/* Toelichtingen */}
              {toelichtingen.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-medium text-gray-700 mb-4">Anonieme toelichtingen ({toelichtingen.length})</p>
                  <div className="flex flex-col gap-3">
                    {toelichtingen.map(c => (
                      <div key={c.id} className="rounded-xl p-4" style={{ background: 'var(--bg-app)', borderLeft: '3px solid var(--MentaForce-primary)' }}>
                        <p className="text-sm text-gray-600 leading-relaxed">"{c.toelichting}"</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleDateString('nl-BE')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aanbevelingen */}
              <div className="rounded-xl p-5" style={{ background: '#E1F5EE', border: '0.5px solid #5DCAA5' }}>
                <p className="text-sm font-medium mb-3" style={{ color: '#0F6E56' }}>Aanbevelingen</p>
                <div className="flex flex-col gap-2">
                  {mentaalScore < 3 && (
                    <p className="text-sm" style={{ color: '#0F6E56' }}> Mentaal welzijn verdient aandacht. Overweeg een workshop stressmanagement of extra check-in momenten.</p>
                  )}
                  {fysiekScore < 3 && (
                    <p className="text-sm" style={{ color: '#0F6E56' }}> Fysiek welzijn is laag. Bekijk de werkplek ergonomie en stimuleer bewegingspauzes.</p>
                  )}
                  {sociaalScore < 3 && (
                    <p className="text-sm" style={{ color: '#0F6E56' }}> Sociale connectie kan beter. Organiseer een teamactiviteit of verbeter de interne communicatie.</p>
                  )}
                  {participatie < 80 && (
                    <p className="text-sm" style={{ color: '#0F6E56' }}> Participatiegraad is onder 80%. Stuur een herinnering naar medewerkers die de check-in nog niet hebben ingevuld.</p>
                  )}
                  {totaalScore >= 4 && (
                    <p className="text-sm" style={{ color: '#0F6E56' }}> Uitstekend resultaat! Blijf het huidige beleid handhaven en deel deze resultaten met het team als motivatie.</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                <p className="text-xs text-gray-400">MentaForce · Vitaliteitsplatform voor de werkplek</p>
                <p className="text-xs text-gray-400">Vertrouwelijk  alleen voor intern gebruik</p>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}