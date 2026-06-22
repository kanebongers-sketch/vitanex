'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

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
  Makkelijk: { kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
  Gemiddeld:  { kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)' },
  Uitdagend:  { kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)' },
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mf-spinner" />
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />

      <main style={{ padding: '24px 24px 72px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Uitdagingen</h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Doe mee aan een wellness-uitdaging</p>
        </div>

        {/* Active challenges */}
        {actieven.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Actief bezig</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {actieven.map(actief => {
                const uitdaging = UITDAGINGEN.find(u => u.id === actief.id)
                if (!uitdaging) return null
                const verstreken = Math.min(dagenVerstreken(actief.startDatum), uitdaging.duur)
                const procent = Math.round((verstreken / uitdaging.duur) * 100)
                const voltooid = verstreken >= uitdaging.duur

                const ringR = 20
                const ringCirc = 2 * Math.PI * ringR
                return (
                  <div key={actief.id} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Progress ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <svg width={52} height={52} viewBox="0 0 52 52">
                        <circle cx={26} cy={26} r={ringR} fill="none" stroke="var(--bg-subtle)" strokeWidth={5} />
                        <circle cx={26} cy={26} r={ringR} fill="none"
                          stroke={voltooid ? 'var(--mf-green)' : 'var(--mf-amber)'}
                          strokeWidth={5} strokeLinecap="round"
                          strokeDasharray={`${ringCirc * procent / 100} ${ringCirc}`}
                          transform="rotate(-90 26 26)"
                          style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                        <text x="26" y="30" textAnchor="middle" fontSize={10} fontWeight="800"
                          fill={voltooid ? 'var(--mf-green)' : 'var(--text-1)'}>
                          {voltooid ? '✓' : `${procent}%`}
                        </text>
                      </svg>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{uitdaging.emoji}</span>{uitdaging.titel}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{verstreken}/{uitdaging.duur} dagen</p>
                        </div>
                        {voltooid ? (
                          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>
                            Voltooid!
                          </span>
                        ) : (
                          <button onClick={() => stopUitdaging(actief.id)} style={{ flexShrink: 0, fontSize: 11, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Stoppen
                          </button>
                        )}
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${procent}%`, background: voltooid ? 'var(--mf-green)' : 'var(--mf-amber)', borderRadius: 100, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Available challenges */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Beschikbare uitdagingen</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
            {UITDAGINGEN.map(uitdaging => {
              const isActief = actieveIds.has(uitdaging.id)
              const stijl = MOEILIJKHEID_STIJL[uitdaging.moeilijkheid]

              return (
                <div
                  key={uitdaging.id}
                  style={{
                    background: 'var(--bg-card)', borderRadius: 16, padding: '16px',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    opacity: isActief ? 0.85 : 1,
                  }}
                >
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{uitdaging.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3 }}>{uitdaging.titel}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4, lineHeight: 1.4 }}>{uitdaging.sub}</p>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-subtle)', color: 'var(--text-3)' }}>
                      📅 {uitdaging.duur} dagen
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: stijl.bg, color: stijl.kleur }}>
                      {uitdaging.moeilijkheid}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-4)' }}>👥 {uitdaging.deelnemers} deelnemers</p>

                  {isActief ? (
                    <span style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>
                      Actief ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => startUitdaging(uitdaging.id)}
                      style={{ width: '100%', padding: '8px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'white', background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)', transition: 'transform 0.15s ease', }}
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
