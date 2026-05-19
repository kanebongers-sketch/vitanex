'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Moeilijkheid = 'Makkelijk' | 'Gemiddeld' | 'Uitdagend'

type Uitdaging = {
  id: string
  emoji: string
  titel: string
  sub: string
  duur: number
  categorie: string
  deelnemers: number
  moeilijkheid: Moeilijkheid
}

type ActieveUitdaging = {
  id: string
  startDatum: string
}

const UITDAGINGEN: Uitdaging[] = [
  { id: '10slaap',    emoji: '😴', titel: '10 dagen beter slapen',    sub: 'Ga elke dag op hetzelfde tijdstip naar bed',   duur: 10, categorie: 'slaap',  deelnemers: 47,  moeilijkheid: 'Makkelijk' },
  { id: '21beweging', emoji: '🏃', titel: '21 dagen bewegen',         sub: '20 minuten per dag actief zijn',               duur: 21, categorie: 'fysiek', deelnemers: 123, moeilijkheid: 'Gemiddeld' },
  { id: '7focus',     emoji: '🎯', titel: '7 dagen deep focus',       sub: 'Elke dag 90 min ononderbroken werken',         duur: 7,  categorie: 'werk',   deelnemers: 89,  moeilijkheid: 'Uitdagend' },
  { id: '14stress',   emoji: '🌿', titel: '14 dagen minder stress',   sub: 'Dagelijkse ademhaling + reflectie',            duur: 14, categorie: 'mentaal',deelnemers: 201, moeilijkheid: 'Makkelijk' },
  { id: '30water',    emoji: '💧', titel: '30 dagen 2L water',        sub: '2 liter water per dag drinken',               duur: 30, categorie: 'fysiek', deelnemers: 156, moeilijkheid: 'Makkelijk' },
  { id: '7journaal',  emoji: '📓', titel: '7 dagen journalen',        sub: 'Elke avond 5 minuten schrijven',              duur: 7,  categorie: 'mentaal',deelnemers: 78,  moeilijkheid: 'Makkelijk' },
]

const MOEILIJKHEID_STIJL: Record<Moeilijkheid, { kleur: string; bg: string }> = {
  Makkelijk: { kleur: '#1D9E75', bg: '#E1F5EE' },
  Gemiddeld:  { kleur: '#F59E0B', bg: '#FEF3C7' },
  Uitdagend:  { kleur: '#EF4444', bg: '#FEE2E2' },
}

const STORAGE_KEY = 'mf-uitdagingen'

function laadActief(): ActieveUitdaging[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function slaActief(lijst: ActieveUitdaging[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lijst))
}

function dagenVerstreken(startDatum: string): number {
  const start = new Date(startDatum)
  const nu = new Date()
  return Math.floor((nu.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export default function UitdagingenPage() {
  const router = useRouter()
  const [klaar, setKlaar] = useState(false)
  const [actieven, setActieven] = useState<ActieveUitdaging[]>([])

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setActieven(laadActief())
      setKlaar(true)
    }
    check()
  }, [router])

  function startUitdaging(id: string) {
    if (actieven.find(a => a.id === id)) return
    const bijgewerkt = [...actieven, { id, startDatum: new Date().toISOString() }]
    setActieven(bijgewerkt)
    slaActief(bijgewerkt)
  }

  function stopUitdaging(id: string) {
    const bijgewerkt = actieven.filter(a => a.id !== id)
    setActieven(bijgewerkt)
    slaActief(bijgewerkt)
  }

  const actieveIds = new Set(actieven.map(a => a.id))

  if (!klaar) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Uitdagingen</h2>
          <p className="text-sm text-gray-400 mt-0.5">Doe mee aan een wellness-uitdaging</p>
        </div>

        {/* Active challenges */}
        {actieven.length > 0 && (
          <section className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Actief bezig</p>
            <div className="flex flex-col gap-3">
              {actieven.map(actief => {
                const uitdaging = UITDAGINGEN.find(u => u.id === actief.id)
                if (!uitdaging) return null
                const verstreken = Math.min(dagenVerstreken(actief.startDatum), uitdaging.duur)
                const procent = Math.round((verstreken / uitdaging.duur) * 100)
                const klaar = verstreken >= uitdaging.duur

                return (
                  <div key={actief.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{uitdaging.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{uitdaging.titel}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{uitdaging.sub}</p>
                        </div>
                      </div>
                      {klaar ? (
                        <span className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#E1F5EE', color: '#1D9E75' }}>
                          ✓ Voltooid!
                        </span>
                      ) : (
                        <button
                          onClick={() => stopUitdaging(actief.id)}
                          className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition"
                        >
                          Stoppen
                        </button>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            background: klaar ? '#1D9E75' : '#1D9E75',
                            width: `${procent}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {verstreken}/{uitdaging.duur} dagen
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Available challenges */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Beschikbare uitdagingen</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {UITDAGINGEN.map(uitdaging => {
              const isActief = actieveIds.has(uitdaging.id)
              const stijl = MOEILIJKHEID_STIJL[uitdaging.moeilijkheid]

              return (
                <div
                  key={uitdaging.id}
                  className="bg-white rounded-2xl p-4 flex flex-col gap-3"
                  style={{
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isActief ? 0.85 : 1,
                  }}
                >
                  <div className="text-3xl leading-none">{uitdaging.emoji}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{uitdaging.titel}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-snug">{uitdaging.sub}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      📅 {uitdaging.duur} dagen
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: stijl.bg, color: stijl.kleur }}
                    >
                      {uitdaging.moeilijkheid}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">👥 {uitdaging.deelnemers} deelnemers</p>

                  {isActief ? (
                    <span className="w-full py-2 rounded-xl text-xs font-semibold text-center" style={{ background: '#E1F5EE', color: '#1D9E75' }}>
                      Actief ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => startUitdaging(uitdaging.id)}
                      className="w-full py-2 rounded-xl text-white text-xs font-semibold transition active:scale-95"
                      style={{ background: '#1D9E75' }}
                    >
                      Starten
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

      </main>
    </div>
  )
}
