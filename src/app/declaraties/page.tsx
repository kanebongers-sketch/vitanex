'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type DeclaratieStatus = 'ingediend' | 'goedgekeurd' | 'afgewezen'
type DeclaratieCategorie = 'reiskosten' | 'maaltijd' | 'materiaal' | 'training' | 'representatie' | 'overig'

type Declaratie = {
  id: string
  datum: string
  bedrag: number
  categorie: DeclaratieCategorie
  beschrijving: string
  status: DeclaratieStatus
  created_at: string
  reviewer_notitie?: string | null
}

const CAT_LABELS: Record<DeclaratieCategorie, string> = {
  reiskosten: 'Reiskosten',
  maaltijd: 'Maaltijd',
  materiaal: 'Materiaal',
  training: 'Training',
  representatie: 'Representatie',
  overig: 'Overig',
}

const CAT_EMOJI: Record<DeclaratieCategorie, string> = {
  reiskosten: '🚗',
  maaltijd: '🍽️',
  materiaal: '📦',
  training: '🎓',
  representatie: '🤝',
  overig: '💰',
}

const STATUS_STIJL: Record<DeclaratieStatus, { bg: string; color: string; label: string }> = {
  ingediend:   { bg: '#FAEEDA', color: '#854F0B', label: 'In behandeling' },
  goedgekeurd: { bg: '#E1F5EE', color: '#0F6E56', label: 'Goedgekeurd' },
  afgewezen:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Afgewezen' },
}

export default function DeclaratiesPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [declaraties, setDeclaraties] = useState<Declaratie[]>([])
  const [userId, setUserId] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [bedrag, setBedrag] = useState('')
  const [categorie, setCategorie] = useState<DeclaratieCategorie>('reiskosten')
  const [beschrijving, setBeschrijving] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase.from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      const { data } = await supabase
        .from('declaraties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setDeclaraties(data as Declaratie[])
      setLaden(false)
    }
    laad()
  }, [router])

  async function indienen() {
    const b = parseFloat(bedrag.replace(',', '.'))
    if (!bedrag || isNaN(b) || b <= 0) { setFout('Vul een geldig bedrag in.'); return }
    if (!beschrijving.trim()) { setFout('Omschrijving is verplicht.'); return }
    setOpslaan(true); setFout('')

    const { data, error } = await supabase.from('declaraties').insert({
      user_id: userId,
      bedrijf_id: bedrijfId,
      datum,
      bedrag: b,
      categorie,
      beschrijving: beschrijving.trim(),
      status: 'ingediend',
    }).select().single()

    if (error) {
      setFout('Opslaan mislukt: ' + error.message)
    } else {
      setDeclaraties(prev => [data as Declaratie, ...prev])
      setFormulier(false)
      setBedrag(''); setBeschrijving(''); setCategorie('reiskosten')
    }
    setOpslaan(false)
  }

  const openstaand = declaraties.filter(d => d.status === 'ingediend').reduce((s, d) => s + d.bedrag, 0)
  const totaalGoedgekeurd = declaraties.filter(d => d.status === 'goedgekeurd').reduce((s, d) => s + d.bedrag, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Declaraties</h1>
            <p className="text-sm text-gray-400 mt-0.5">Onkostenvergoedingen</p>
          </div>
          <button
            onClick={() => setFormulier(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#8B5CF6' }}
          >
            + Indienen
          </button>
        </div>

        {/* Statistieken */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-xs text-gray-400 mb-1">Openstaand</p>
            <p className="text-xl font-bold" style={{ color: '#BA7517' }}>
              €{openstaand.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-xs text-gray-400 mb-1">Goedgekeurd</p>
            <p className="text-xl font-bold" style={{ color: '#1D9E75' }}>
              €{totaalGoedgekeurd.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Formulier */}
        {formulier && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-10"
              style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Declaratie indienen</h2>
                <button onClick={() => setFormulier(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              {/* Categorie */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Categorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CAT_LABELS) as DeclaratieCategorie[]).map(c => (
                    <button key={c} onClick={() => setCategorie(c)}
                      className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs transition"
                      style={{
                        background: categorie === c ? '#EDE9FE' : 'white',
                        borderColor: categorie === c ? '#8B5CF6' : '#e5e7eb',
                        color: categorie === c ? '#5B21B6' : '#6b7280',
                        fontWeight: categorie === c ? 600 : 400,
                      }}>
                      <span className="text-xl">{CAT_EMOJI[c]}</span>
                      <span>{CAT_LABELS[c]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Datum</label>
                  <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Bedrag (€)</label>
                  <input type="text" inputMode="decimal" value={bedrag}
                    onChange={e => setBedrag(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400" />
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Omschrijving</label>
                <textarea rows={2} value={beschrijving} onChange={e => setBeschrijving(e.target.value)}
                  placeholder="Beschrijf de declaratie..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-purple-400" />
              </div>

              {fout && <p className="text-sm text-red-500 mb-3">{fout}</p>}

              <button onClick={indienen} disabled={opslaan}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition"
                style={{ background: '#8B5CF6' }}>
                {opslaan ? 'Indienen...' : 'Declaratie indienen'}
              </button>
            </div>
          </div>
        )}

        {/* Lijst */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Mijn declaraties</p>

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#8B5CF6' }} />
          </div>
        ) : declaraties.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-3xl mb-3">💰</p>
            <p className="text-gray-500 text-sm">Nog geen declaraties.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {declaraties.map(d => {
              const stijl = STATUS_STIJL[d.status]
              return (
                <div key={d.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CAT_EMOJI[d.categorie as DeclaratieCategorie]}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{CAT_LABELS[d.categorie as DeclaratieCategorie]}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(d.datum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-sm font-bold text-gray-900">
                        €{d.bedrag.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: stijl.bg, color: stijl.color }}>
                        {stijl.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-11">{d.beschrijving}</p>
                  {d.reviewer_notitie && (
                    <div className="mt-2 ml-11 text-xs rounded-lg px-3 py-2"
                      style={{ background: d.status === 'goedgekeurd' ? '#E1F5EE' : '#FCEBEB', color: d.status === 'goedgekeurd' ? '#0F6E56' : '#A32D2D' }}>
                      <strong>Notitie:</strong> {d.reviewer_notitie}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
