'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Registratie = {
  id: string
  datum: string
  uren: number
  project: string
  beschrijving: string
  goedgekeurd: boolean
  created_at: string
}

const PROJECTEN = ['Intern', 'Klant A', 'Klant B', 'Training', 'Overleg', 'Administratie', 'Overig']

function weekDagen(): Date[] {
  const vandaag = new Date()
  const dag = vandaag.getDay() === 0 ? 6 : vandaag.getDay() - 1
  const maandag = new Date(vandaag)
  maandag.setDate(vandaag.getDate() - dag)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(maandag)
    d.setDate(maandag.getDate() + i)
    return d
  })
}

function dagNaam(d: Date): string {
  return d.toLocaleDateString('nl-BE', { weekday: 'short' })
}

export default function UrenPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [registraties, setRegistraties] = useState<Registratie[]>([])
  const [userId, setUserId] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const [actieveWeek, setActieveWeek] = useState<'huidig' | 'vorig'>('huidig')

  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [uren, setUren] = useState('')
  const [project, setProject] = useState('Intern')
  const [beschrijving, setBeschrijving] = useState('')

  const dagen = weekDagen()

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase.from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      const vanDatum = new Date()
      vanDatum.setDate(vanDatum.getDate() - (actieveWeek === 'vorig' ? 14 : 0))
      const van = new Date(vanDatum)
      const dag = van.getDay() === 0 ? 6 : van.getDay() - 1
      van.setDate(van.getDate() - dag - (actieveWeek === 'vorig' ? 7 : 0))

      const { data } = await supabase
        .from('tijdregistraties')
        .select('*')
        .eq('user_id', user.id)
        .order('datum', { ascending: false })

      if (data) setRegistraties(data as Registratie[])
      setLaden(false)
    }
    laad()
  }, [router, actieveWeek])

  async function opslaanRegistratie() {
    const u = parseFloat(uren)
    if (!uren || isNaN(u) || u <= 0 || u > 24) { setFout('Vul een geldig aantal uren in (0–24).'); return }
    setOpslaan(true); setFout('')

    const { data, error } = await supabase.from('tijdregistraties').insert({
      user_id: userId,
      bedrijf_id: bedrijfId,
      datum,
      uren: u,
      project,
      beschrijving: beschrijving.trim(),
      goedgekeurd: false,
    }).select().single()

    if (error) {
      setFout('Opslaan mislukt: ' + error.message)
    } else {
      setRegistraties(prev => [data as Registratie, ...prev])
      setFormulier(false)
      setUren(''); setBeschrijving('')
    }
    setOpslaan(false)
  }

  async function verwijder(id: string) {
    await supabase.from('tijdregistraties').delete().eq('id', id)
    setRegistraties(prev => prev.filter(r => r.id !== id))
  }

  const huidigeWeekDatums = new Set(dagen.map(d => d.toISOString().slice(0, 10)))
  const huidigeWeekReg = registraties.filter(r => huidigeWeekDatums.has(r.datum))
  const totaalUren = huidigeWeekReg.reduce((s, r) => s + r.uren, 0)
  const doelUren = 40

  const dagUren = new Map<string, number>()
  for (const r of registraties) {
    dagUren.set(r.datum, (dagUren.get(r.datum) ?? 0) + r.uren)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Urenregistratie</h1>
            <p className="text-sm text-gray-400 mt-0.5">Log je werkuren</p>
          </div>
          <button
            onClick={() => setFormulier(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#378ADD' }}
          >
            + Loggen
          </button>
        </div>

        {/* Week-overzicht kaart */}
        <div className="bg-white rounded-2xl p-5 mb-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Deze week</p>
            <p className="text-sm font-bold" style={{ color: totaalUren >= doelUren ? '#1D9E75' : '#378ADD' }}>
              {totaalUren}/{doelUren} uur
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (totaalUren / doelUren) * 100)}%`,
                background: totaalUren >= doelUren ? '#1D9E75' : '#378ADD',
              }} />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dagen.map(dag => {
              const sleutel = dag.toISOString().slice(0, 10)
              const u = dagUren.get(sleutel) ?? 0
              const isVandaag = sleutel === new Date().toISOString().slice(0, 10)
              const isWeekend = dag.getDay() === 0 || dag.getDay() === 6
              return (
                <div key={sleutel} className="flex flex-col items-center gap-1">
                  <p className="text-xs" style={{ color: isVandaag ? '#378ADD' : '#9ca3af', fontWeight: isVandaag ? 700 : 400 }}>
                    {dagNaam(dag)}
                  </p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                    style={{
                      background: u > 0 ? '#E6F1FB' : isWeekend ? '#F9FAFB' : '#F3F4F6',
                      color: u > 0 ? '#185FA5' : '#d1d5db',
                      border: isVandaag ? '2px solid #378ADD' : '2px solid transparent',
                    }}>
                    {u > 0 ? u : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Formulier */}
        {formulier && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-10"
              style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Uren loggen</h2>
                <button onClick={() => setFormulier(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Datum</label>
                <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Aantal uren</label>
                <input type="number" min="0.5" max="24" step="0.5" value={uren}
                  onChange={e => setUren(e.target.value)}
                  placeholder="bijv. 8"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Project</label>
                <select value={project} onChange={e => setProject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white">
                  {PROJECTEN.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Omschrijving <span className="text-gray-300 font-normal">(optioneel)</span>
                </label>
                <textarea rows={2} value={beschrijving} onChange={e => setBeschrijving(e.target.value)}
                  placeholder="Wat heb je gedaan?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-400" />
              </div>

              {fout && <p className="text-sm text-red-500 mb-3">{fout}</p>}

              <button onClick={opslaanRegistratie} disabled={opslaan || !uren}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition"
                style={{ background: '#378ADD' }}>
                {opslaan ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}

        {/* Recente registraties */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Recente registraties</p>

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#378ADD' }} />
          </div>
        ) : registraties.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-3xl mb-3">⏱️</p>
            <p className="text-gray-500 text-sm">Nog geen uren geregistreerd.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {registraties.slice(0, 20).map(r => (
              <div key={r.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: '#E6F1FB', color: '#185FA5' }}>
                    {r.uren}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.project}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.datum).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {r.beschrijving ? ` · ${r.beschrijving}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.goedgekeurd && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#E1F5EE', color: '#0F6E56' }}>✓</span>
                  )}
                  <button onClick={() => verwijder(r.id)}
                    className="text-gray-300 hover:text-red-400 transition text-sm">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
