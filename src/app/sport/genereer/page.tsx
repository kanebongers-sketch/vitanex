'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

type AgentFase = 'wachten' | 'bezig' | 'klaar'

const DOELEN = [
  { value: 'spiermassa', label: 'Spiermassa opbouwen', icon: '🏋️' },
  { value: 'afvallen', label: 'Afvallen / vet verbranden', icon: '🔥' },
  { value: 'conditie', label: 'Conditie verbeteren', icon: '❤️' },
  { value: 'kracht', label: 'Kracht opbouwen', icon: '⚡' },
  { value: 'flexibiliteit', label: 'Flexibiliteit', icon: '⭐' },
]

const NIVEAUS = ['Beginner', 'Gemiddeld', 'Gevorderd']
const SESSIES_OPTIES = [2, 3, 4, 5]
const TIJD_OPTIES = [30, 45, 60, 90]
const MATERIAAL_OPTIES = [
  { value: 'geen', label: 'Geen (bodyweight)' },
  { value: 'dumbbells', label: 'Dumbbells / halters' },
  { value: 'barbell', label: 'Barbell + rack' },
  { value: 'kabels', label: 'Kabelmachines' },
  { value: 'volledig', label: 'Volledig gym' },
]

export default function GenereerSchemaPage() {
  const router = useRouter()
  const [stap, setStap] = useState(1)
  const [doel, setDoel] = useState('')
  const [niveau, setNiveau] = useState('beginner')
  const [sessiesPerWeek, setSessiesPerWeek] = useState(3)
  const [beschikbareTijd, setBeschikbareTijd] = useState(45)
  const [benodigdheden, setBenodigdheden] = useState<string[]>(['geen'])
  const [blessures, setBlessures] = useState('')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [agentStatus, setAgentStatus] = useState<{ agent1: AgentFase; agent2: AgentFase; agent3: AgentFase }>({
    agent1: 'wachten', agent2: 'wachten', agent3: 'wachten',
  })

  const toggleMateriaal = (value: string) => {
    if (value === 'geen') {
      setBenodigdheden(['geen'])
      return
    }
    setBenodigdheden(prev => {
      const zonder = prev.filter(v => v !== 'geen')
      return zonder.includes(value) ? zonder.filter(v => v !== value) || ['geen'] : [...zonder, value]
    })
  }

  const kanVerder = () => {
    if (stap === 1) return doel !== ''
    if (stap === 2) return true
    if (stap === 3) return true
    return false
  }

  const startGenereren = async () => {
    setLaden(true)
    setFout(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setAgentStatus({ agent1: 'bezig', agent2: 'wachten', agent3: 'wachten' })

      const { data: disc } = await supabase
        .from('disc_inzendingen')
        .select('primair_profiel')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      await new Promise(r => setTimeout(r, 2000))
      setAgentStatus({ agent1: 'klaar', agent2: 'bezig', agent3: 'wachten' })

      const res = await fetch('/api/fitness/genereer-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          doel,
          niveau,
          sessies_per_week: sessiesPerWeek,
          beschikbare_tijd: beschikbareTijd,
          benodigdheden,
          blessures: blessures || undefined,
          disc_profiel: disc?.primair_profiel || undefined,
        }),
      })

      setAgentStatus({ agent1: 'klaar', agent2: 'klaar', agent3: 'bezig' })
      await new Promise(r => setTimeout(r, 1500))

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Genereren mislukt')
      }

      setAgentStatus({ agent1: 'klaar', agent2: 'klaar', agent3: 'klaar' })
      await new Promise(r => setTimeout(r, 800))
      router.push('/sport')
    } catch (e: unknown) {
      setFout(e instanceof Error ? e.message : 'Er ging iets mis')
      setLaden(false)
      setAgentStatus({ agent1: 'wachten', agent2: 'wachten', agent3: 'wachten' })
    }
  }

  useEffect(() => {
    if (stap === 4 && !laden) startGenereren()
  }, [stap])

  const agentLabels = [
    { key: 'agent1', label: 'Schema planner aan het werk...' },
    { key: 'agent2', label: 'Oefeningen worden samengesteld...' },
    { key: 'agent3', label: 'Coach voegt persoonlijk advies toe...' },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => router.push('/sport')}
            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }}
          >
            ← Annuleren
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            AI Schema Generator
          </h1>
          <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>
            Beantwoord 3 vragen — wij maken jouw schema
          </p>
        </div>

        {/* Stap indicator */}
        {stap < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                  background: stap === n ? '#1D9E75' : stap > n ? '#D1FAE5' : '#F3F4F6',
                  color: stap === n ? '#fff' : stap > n ? '#1D9E75' : '#9CA3AF',
                }}>
                  {stap > n ? '✓' : n}
                </div>
                {n < 3 && <div style={{ height: 2, width: 32, background: stap > n ? '#1D9E75' : '#E5E7EB' }} />}
              </div>
            ))}
            <span style={{ marginLeft: 8, fontSize: 13, color: '#6B7280' }}>Stap {stap} van 3</span>
          </div>
        )}

        {/* Stap 1: Doel */}
        {stap === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Wat is jouw doel?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOELEN.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDoel(d.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                    background: '#fff', borderRadius: 12,
                    border: `2px solid ${doel === d.value ? '#1D9E75' : 'transparent'}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{d.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: doel === d.value ? 600 : 500, color: doel === d.value ? '#1D9E75' : '#374151' }}>
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stap 2: Niveau & Tijd */}
        {stap === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Niveau en beschikbaarheid</h2>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Jouw niveau</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {NIVEAUS.map(n => (
                <button
                  key={n}
                  onClick={() => setNiveau(n.toLowerCase())}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: niveau === n.toLowerCase() ? '#1D9E75' : '#fff',
                    color: niveau === n.toLowerCase() ? '#fff' : '#374151',
                    border: `1.5px solid ${niveau === n.toLowerCase() ? '#1D9E75' : '#E5E7EB'}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
              Sessies per week
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {SESSIES_OPTIES.map(s => (
                <button
                  key={s}
                  onClick={() => setSessiesPerWeek(s)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    background: sessiesPerWeek === s ? '#1D9E75' : '#fff',
                    color: sessiesPerWeek === s ? '#fff' : '#374151',
                    border: `1.5px solid ${sessiesPerWeek === s ? '#1D9E75' : '#E5E7EB'}`,
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
              Tijd per sessie
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TIJD_OPTIES.map(t => (
                <button
                  key={t}
                  onClick={() => setBeschikbareTijd(t)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: beschikbareTijd === t ? '#1D9E75' : '#fff',
                    color: beschikbareTijd === t ? '#fff' : '#374151',
                    border: `1.5px solid ${beschikbareTijd === t ? '#1D9E75' : '#E5E7EB'}`,
                  }}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stap 3: Materiaal */}
        {stap === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Materiaal & beperkingen</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 18 }}>Selecteer wat je beschikbaar hebt</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {MATERIAAL_OPTIES.map(m => {
                const actief = benodigdheden.includes(m.value)
                return (
                  <button
                    key={m.value}
                    onClick={() => toggleMateriaal(m.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                      background: '#fff', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${actief ? '#1D9E75' : 'transparent'}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      background: actief ? '#1D9E75' : '#F3F4F6',
                      border: `2px solid ${actief ? '#1D9E75' : '#D1D5DB'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actief && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: actief ? '#1D9E75' : '#374151' }}>{m.label}</span>
                  </button>
                )
              })}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Blessures of beperkingen <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optioneel)</span>
            </label>
            <textarea
              value={blessures}
              onChange={e => setBlessures(e.target.value)}
              placeholder="bijv. knieklachten, rugproblemen"
              rows={3}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, color: '#374151',
                border: '1.5px solid #E5E7EB', background: '#fff', resize: 'none', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Stap 4: Genereren */}
        {stap === 4 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Schema wordt gemaakt</h2>
              <p style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>Onze AI agents zijn bezig voor jou</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {agentLabels.map(({ key, label }) => {
                const status = agentStatus[key]
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 12, background: status === 'klaar' ? '#F0FDF9' : status === 'bezig' ? '#FFFBEB' : '#F9FAFB',
                    border: `1.5px solid ${status === 'klaar' ? '#6EE7C7' : status === 'bezig' ? '#FDE68A' : '#F3F4F6'}`,
                  }}>
                    <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {status === 'klaar' && (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: 13 }}>✓</span>
                        </div>
                      )}
                      {status === 'bezig' && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: '3px solid #FDE68A', borderTopColor: '#F97316',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                      )}
                      {status === 'wachten' && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E5E7EB' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: status === 'bezig' ? 600 : 500,
                      color: status === 'klaar' ? '#065F46' : status === 'bezig' ? '#92400E' : '#9CA3AF',
                    }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {fout && (
              <div style={{ marginTop: 20, padding: '12px 16px', background: '#FEF2F2', borderRadius: 10, color: '#B91C1C', fontSize: 14 }}>
                {fout}
                <button
                  onClick={() => { setStap(4); setFout(null) }}
                  style={{ display: 'block', marginTop: 8, color: '#B91C1C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 }}
                >
                  Opnieuw proberen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigatie knoppen */}
        {stap < 4 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {stap > 1 && (
              <button
                onClick={() => setStap(s => s - 1)}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 600,
                  background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer',
                }}
              >
                Vorige
              </button>
            )}
            <button
              onClick={() => setStap(s => s + 1)}
              disabled={!kanVerder()}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 600,
                background: kanVerder() ? '#1D9E75' : '#D1D5DB',
                color: kanVerder() ? '#fff' : '#9CA3AF',
                border: 'none', cursor: kanVerder() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              {stap === 3 ? '✨ Schema genereren' : 'Volgende'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
