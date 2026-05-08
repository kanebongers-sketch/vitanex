'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Entry = {
  id: string
  inhoud: string
  stemming: number | null
  aangemaakt_op: string
}

const STEMMINGEN = [
  { waarde: 1, emoji: '??', label: 'Slecht' },
  { waarde: 2, emoji: '??', label: 'Matig' },
  { waarde: 3, emoji: '??', label: 'Oké' },
  { waarde: 4, emoji: '??', label: 'Goed' },
  { waarde: 5, emoji: '??', label: 'Super' },
]

const PROMPTS = [
  'Hoe was mijn dag werkelijk?',
  'Waar maak ik me zorgen over?',
  'Wat gaf me energie vandaag?',
  'Wat nam energie weg?',
  'Wat ben ik dankbaar voor?',
  'Wat wil ik morgen anders doen?',
]

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function JournalPagina() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [laden, setLaden] = useState(true)
  const [nieuwTonen, setNieuwTonen] = useState(false)
  const [tekst, setTekst] = useState('')
  const [stemming, setStemming] = useState<number | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [uitgevouwen, setUitgevouwen] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('journal_entries')
        .select('id, inhoud, stemming, aangemaakt_op')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(50)

      setEntries(data || [])
      setLaden(false)
    }
    laad()
  }, [router])

  async function slaOp() {
    if (!tekst.trim() || !userId) return
    setOpslaan(true)

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: userId, inhoud: tekst.trim(), stemming })
      .select('id, inhoud, stemming, aangemaakt_op')
      .single()

    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setTekst('')
      setStemming(null)
      setNieuwTonen(false)
    }
    setOpslaan(false)
  }

  async function verwijder(id: string) {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Gedachten dump</h1>
            <p className="text-gray-500 text-sm mt-0.5">Schrijf vrij  alleen zichtbaar voor jou.</p>
          </div>
          <button
            onClick={() => setNieuwTonen(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition"
            style={{ background: 'var(--MentaForce-primary)' }}
          >
            + Nieuw
          </button>
        </div>

        {/* Nieuw entry form */}
        {nieuwTonen && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Nieuwe aantekening</p>

            {/* Mood picker */}
            <div className="flex items-center gap-1 mb-4">
              <span className="text-xs text-gray-400 mr-2">Stemming:</span>
              {STEMMINGEN.map(s => (
                <button
                  key={s.waarde}
                  onClick={() => setStemming(stemming === s.waarde ? null : s.waarde)}
                  title={s.label}
                  className="text-xl transition-all"
                  style={{
                    opacity: stemming !== null && stemming !== s.waarde ? 0.3 : 1,
                    transform: stemming === s.waarde ? 'scale(1.3)' : 'scale(1)',
                  }}
                >
                  {s.emoji}
                </button>
              ))}
            </div>

            {/* Prompt suggestions */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setTekst(prev => prev ? `${prev}\n\n${p}\n` : `${p}\n`)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 hover:bg-gray-50 transition"
                >
                  {p}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              rows={6}
              value={tekst}
              onChange={e => setTekst(e.target.value)}
              placeholder="Begin te schrijven..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-gray-400 leading-relaxed"
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setNieuwTonen(false); setTekst(''); setStemming(null) }}
                className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-500 hover:bg-gray-50 transition"
              >
                Annuleer
              </button>
              <button
                onClick={slaOp}
                disabled={!tekst.trim() || opslaan}
                className="text-sm rounded-xl px-4 py-2 text-white font-medium transition disabled:opacity-40"
                style={{ background: 'var(--MentaForce-primary)' }}
              >
                {opslaan ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}

        {/* Entries */}
        {laden ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--MentaForce-primary)' }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">??</p>
            <p className="text-gray-700 font-medium mb-1">Nog geen aantekeningen</p>
            <p className="text-gray-400 text-sm">Schrijf je eerste gedachten neer. Het helpt echt.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map(e => {
              const s = STEMMINGEN.find(m => m.waarde === e.stemming)
              const isOpen = uitgevouwen === e.id
              const preview = e.inhoud.length > 140 ? e.inhoud.slice(0, 140) + '' : e.inhoud
              return (
                <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {s && <span className="text-xl">{s.emoji}</span>}
                      <p className="text-xs text-gray-400 capitalize">{formatDatum(e.aangemaakt_op)}</p>
                    </div>
                    <button
                      onClick={() => verwijder(e.id)}
                      className="text-gray-300 hover:text-red-400 transition text-xs"
                      title="Verwijder"
                    >
                      ?
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {isOpen ? e.inhoud : preview}
                  </p>
                  {e.inhoud.length > 140 && (
                    <button
                      onClick={() => setUitgevouwen(isOpen ? null : e.id)}
                      className="text-xs mt-2 font-medium"
                      style={{ color: 'var(--MentaForce-primary)' }}
                    >
                      {isOpen ? 'Minder tonen' : 'Meer tonen'}
                    </button>
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
