'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Categorie = 'mentaal' | 'fysiek' | 'werk' | 'sociaal'

type Doel = {
  id: string
  titel: string
  categorie: Categorie
  doelDatum?: string
  notities?: string
  voltooid: boolean
  aangemaakt: string
}

const CATEGORIE_CONFIG: Record<Categorie, { emoji: string; label: string; kleur: string }> = {
  mentaal: { emoji: '🧠', label: 'Mentaal',  kleur: '#8B5CF6' },
  fysiek:  { emoji: '💪', label: 'Fysiek',   kleur: '#1D9E75' },
  werk:    { emoji: '💼', label: 'Werk',     kleur: '#378ADD' },
  sociaal: { emoji: '🤝', label: 'Sociaal',  kleur: '#F59E0B' },
}

const SNELLE_SUGGESTIES = [
  'Minder telefoon voor het slapengaan',
  '10 minuten mediteren per dag',
  'Elke dag 8000 stappen',
  'Één uur per week leren',
]

const STORAGE_KEY = 'mf-doelen'

function nieuwId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function laadDoelen(): Doel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function slaDoelen(doelen: Doel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doelen))
}

export default function DoelenPage() {
  const router = useRouter()
  const [klaar, setKlaar] = useState(false)
  const [doelen, setDoelen] = useState<Doel[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [hoverDoel, setHoverDoel] = useState<string | null>(null)

  // Form state
  const [formTitel, setFormTitel] = useState('')
  const [formCategorie, setFormCategorie] = useState<Categorie>('mentaal')
  const [formDatum, setFormDatum] = useState('')
  const [formNotities, setFormNotities] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setDoelen(laadDoelen())
      setKlaar(true)
    }
    check()
  }, [router])

  function toggleVoltooid(id: string) {
    const bijgewerkt = doelen.map(d => d.id === id ? { ...d, voltooid: !d.voltooid } : d)
    setDoelen(bijgewerkt)
    slaDoelen(bijgewerkt)
  }

  function verwijderDoel(id: string) {
    const bijgewerkt = doelen.filter(d => d.id !== id)
    setDoelen(bijgewerkt)
    slaDoelen(bijgewerkt)
  }

  function voegDoelToe(titel: string, cat: Categorie = formCategorie) {
    if (!titel.trim()) return
    const nieuw: Doel = {
      id: nieuwId(),
      titel: titel.trim(),
      categorie: cat,
      doelDatum: formDatum || undefined,
      notities: formNotities.trim() || undefined,
      voltooid: false,
      aangemaakt: new Date().toISOString(),
    }
    const bijgewerkt = [nieuw, ...doelen]
    setDoelen(bijgewerkt)
    slaDoelen(bijgewerkt)
    resetForm()
    setModalOpen(false)
  }

  function resetForm() {
    setFormTitel('')
    setFormCategorie('mentaal')
    setFormDatum('')
    setFormNotities('')
  }

  // Progress this month
  const nu = new Date()
  const startMaand = new Date(nu.getFullYear(), nu.getMonth(), 1).toISOString()
  const dezenMaand = doelen.filter(d => d.aangemaakt >= startMaand)
  const voltooideDezenMaand = dezenMaand.filter(d => d.voltooid).length

  if (!klaar) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mijn doelen</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {dezenMaand.length > 0
                ? `${voltooideDezenMaand}/${dezenMaand.length} voltooid deze maand`
                : 'Stel je eerste doel in'}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition active:scale-95"
            style={{ background: '#1D9E75' }}
          >
            <span className="text-base">+</span> Nieuw doel
          </button>
        </div>

        {/* Progress bar */}
        {dezenMaand.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Voortgang deze maand</span>
              <span className="font-semibold" style={{ color: '#1D9E75' }}>
                {dezenMaand.length > 0 ? Math.round((voltooideDezenMaand / dezenMaand.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  background: '#1D9E75',
                  width: dezenMaand.length > 0
                    ? `${(voltooideDezenMaand / dezenMaand.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        )}

        {/* Goals list */}
        {doelen.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-500 text-sm">Nog geen doelen gesteld – begin klein!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {doelen.map(doel => {
              const cfg = CATEGORIE_CONFIG[doel.categorie]
              return (
                <div
                  key={doel.id}
                  className="bg-white rounded-2xl p-4 flex items-start gap-3 relative transition"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  onMouseEnter={() => setHoverDoel(doel.id)}
                  onMouseLeave={() => setHoverDoel(null)}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleVoltooid(doel.id)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition"
                    style={{
                      borderColor: doel.voltooid ? '#1D9E75' : '#d1d5db',
                      background: doel.voltooid ? '#1D9E75' : 'white',
                    }}
                  >
                    {doel.voltooid && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-gray-900"
                      style={{ textDecoration: doel.voltooid ? 'line-through' : 'none', opacity: doel.voltooid ? 0.5 : 1 }}
                    >
                      {doel.titel}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: cfg.kleur + '1a', color: cfg.kleur }}
                      >
                        {cfg.emoji} {cfg.label}
                      </span>
                      {doel.doelDatum && (
                        <span className="text-xs text-gray-400">
                          📅 {new Date(doel.doelDatum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {doel.notities && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{doel.notities}</p>
                    )}
                  </div>

                  {/* Delete on hover */}
                  {hoverDoel === doel.id && (
                    <button
                      onClick={() => verwijderDoel(doel.id)}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Quick suggestions */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Snelle suggesties</p>
          <div className="flex flex-col gap-2">
            {SNELLE_SUGGESTIES.map(s => (
              <button
                key={s}
                onClick={() => {
                  setFormTitel(s)
                  setModalOpen(true)
                }}
                className="flex items-center gap-3 text-left text-sm text-gray-700 hover:text-gray-900 py-1.5 transition group"
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: '#E1F5EE', color: '#1D9E75' }}>+</span>
                {s}
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* Add goal modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); resetForm() } }}
        >
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6" style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Nieuw doel</h3>
              <button
                onClick={() => { setModalOpen(false); resetForm() }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Titel */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Omschrijving *</label>
                <input
                  type="text"
                  value={formTitel}
                  onChange={e => setFormTitel(e.target.value)}
                  placeholder="Wat wil je bereiken?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-400 transition"
                  autoFocus
                />
              </div>

              {/* Categorie */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Categorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(CATEGORIE_CONFIG) as [Categorie, typeof CATEGORIE_CONFIG.mentaal][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setFormCategorie(key)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition"
                      style={{
                        borderColor: formCategorie === key ? cfg.kleur : '#e5e7eb',
                        background: formCategorie === key ? cfg.kleur + '15' : 'white',
                        color: formCategorie === key ? cfg.kleur : '#6b7280',
                      }}
                    >
                      <span>{cfg.emoji}</span> {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datum */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Doeldatum (optioneel)</label>
                <input
                  type="date"
                  value={formDatum}
                  onChange={e => setFormDatum(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-400 transition"
                />
              </div>

              {/* Notities */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notities (optioneel)</label>
                <textarea
                  value={formNotities}
                  onChange={e => setFormNotities(e.target.value)}
                  placeholder="Waarom is dit doel belangrijk voor jou?"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-400 transition resize-none"
                />
              </div>

              <button
                onClick={() => voegDoelToe(formTitel)}
                disabled={!formTitel.trim()}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#1D9E75' }}
              >
                Doel toevoegen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
