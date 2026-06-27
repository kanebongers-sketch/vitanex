'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'


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

// Intake fitness_doel → formulier-doel (de waarden die deze pagina gebruikt).
const INTAKE_DOEL_NAAR_FORM: Record<string, string> = {
  afvallen: 'afvallen',
  aankomen: 'spiermassa',
  fitter: 'conditie',
  onderhouden: 'kracht',
}

// Intake activiteitsniveau → realistisch niveau + sessies per week.
const INTAKE_ACTIVITEIT_NAAR_TRAINING: Record<string, { niveau: string; sessies: number }> = {
  sedentair: { niveau: 'beginner', sessies: 2 },
  licht: { niveau: 'beginner', sessies: 3 },
  gemiddeld: { niveau: 'gemiddeld', sessies: 3 },
  actief: { niveau: 'gemiddeld', sessies: 4 },
  zeer_actief: { niveau: 'gevorderd', sessies: 5 },
}

export default function GenereerSchemaPage() {
  const router = useRouter()
  const [stap, setStap] = useState(1)
  const [doel, setDoel] = useState('')
  const [niveau, setNiveau] = useState('beginner')
  const [sessiesPerWeek, setSessiesPerWeek] = useState(3)
  const [beschikbareTijd, setBeschikbareTijd] = useState(45)
  const [benodigdheden, setBenodigdheden] = useState<string[]>(['geen'])
  const [blessures, setBlessures] = useState('')
  const [vanuitIntake, setVanuitIntake] = useState(false)
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

      // Health check — snel checken of de server juist geconfigureerd is
      setAgentStatus({ agent1: 'bezig', agent2: 'wachten', agent3: 'wachten' })
      const healthRes = await authFetch('/api/fitness/health')
      if (!healthRes.ok) {
        const h = await healthRes.json().catch(() => ({}))
        throw new Error(h.error || 'Server niet beschikbaar')
      }

      const { data: disc } = await supabase
        .from('disc_inzendingen')
        .select('primair_profiel')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      await new Promise(r => setTimeout(r, 800))
      setAgentStatus({ agent1: 'klaar', agent2: 'bezig', agent3: 'wachten' })

      const abortCtrl = new AbortController()
      const timeout = setTimeout(() => abortCtrl.abort(), 90_000)

      let res: Response
      try {
        res = await authFetch('/api/fitness/genereer-schema', {
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
          signal: abortCtrl.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      setAgentStatus({ agent1: 'klaar', agent2: 'klaar', agent3: 'bezig' })
      await new Promise(r => setTimeout(r, 1000))

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Genereren mislukt (HTTP ${res.status})`)
      }

      setAgentStatus({ agent1: 'klaar', agent2: 'klaar', agent3: 'klaar' })
      await new Promise(r => setTimeout(r, 800))
      router.push('/sport')
    } catch (e: unknown) {
      const msg = e instanceof Error
        ? (e.name === 'AbortError' ? 'Tijdsoverschrijding — probeer het opnieuw' : e.message)
        : 'Er ging iets mis'
      setFout(msg)
      setLaden(false)
      setAgentStatus({ agent1: 'wachten', agent2: 'wachten', agent3: 'wachten' })
    }
  }

  useEffect(() => {
    // Prefill de keuzes vanuit het intake-profiel; blijven bewerkbaar.
    async function prefillVanuitProfiel() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profiel } = await supabase
        .from('profiles')
        .select('fitness_doel, activiteitsniveau')
        .eq('id', user.id)
        .maybeSingle()

      if (!profiel) return
      let prefilled = false

      const formDoel = profiel.fitness_doel ? INTAKE_DOEL_NAAR_FORM[profiel.fitness_doel] : undefined
      if (formDoel) {
        setDoel(formDoel)
        prefilled = true
      }

      const training = profiel.activiteitsniveau
        ? INTAKE_ACTIVITEIT_NAAR_TRAINING[profiel.activiteitsniveau]
        : undefined
      if (training) {
        setNiveau(training.niveau)
        setSessiesPerWeek(training.sessies)
        prefilled = true
      }

      if (prefilled) setVanuitIntake(true)
    }
    prefillVanuitProfiel()
  }, [])

  useEffect(() => {
    // Start de generatie buiten de synchrone effect-body; bewust alleen
    // afhankelijk van stap — generatie hoort eenmalig te starten bij stap 4
    if (stap === 4 && !laden) Promise.resolve().then(startGenereren)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stap])

  const agentLabels = [
    { key: 'agent1', label: 'Schema planner aan het werk...' },
    { key: 'agent2', label: 'Oefeningen worden samengesteld...' },
    { key: 'agent3', label: 'Coach voegt persoonlijk advies toe...' },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => router.push('/sport')}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }}
          >
            ← Annuleren
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
            AI Schema Generator
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: 4, fontSize: 14 }}>
            Beantwoord 3 vragen — wij maken jouw schema
          </p>
        </div>

        {/* Intake-hint */}
        {stap < 4 && vanuitIntake && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px',
            background: 'var(--mf-green-light)', border: '1px solid var(--mf-green)', borderRadius: 12,
          }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <span style={{ fontSize: 13, color: 'var(--mf-green-dark)', lineHeight: 1.4 }}>
              We hebben je doel en niveau alvast ingevuld op basis van je intake. Je kunt alles nog aanpassen.
            </span>
          </div>
        )}

        {/* Stap indicator */}
        {stap < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                  background: stap === n ? 'var(--mf-green)' : stap > n ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                  color: stap === n ? '#fff' : stap > n ? 'var(--mf-green)' : 'var(--text-3)',
                }}>
                  {stap > n ? '✓' : n}
                </div>
                {n < 3 && <div style={{ height: 2, width: 32, background: stap > n ? 'var(--mf-green)' : 'var(--border)' }} />}
              </div>
            ))}
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-2)' }}>Stap {stap} van 3</span>
          </div>
        )}

        {/* Stap 1: Doel */}
        {stap === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>Wat is jouw doel?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOELEN.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDoel(d.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                    background: 'var(--bg-card, white)', borderRadius: 12,
                    border: `2px solid ${doel === d.value ? 'var(--mf-green)' : 'transparent'}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{d.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: doel === d.value ? 600 : 500, color: doel === d.value ? 'var(--mf-green)' : 'var(--text-2)' }}>
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 20 }}>Niveau en beschikbaarheid</h2>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Jouw niveau</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {NIVEAUS.map(n => (
                <button
                  key={n}
                  onClick={() => setNiveau(n.toLowerCase())}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: niveau === n.toLowerCase() ? 'var(--mf-green)' : '#fff',
                    color: niveau === n.toLowerCase() ? '#fff' : 'var(--text-2)',
                    border: `1.5px solid ${niveau === n.toLowerCase() ? 'var(--mf-green)' : 'var(--border)'}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>
              Sessies per week
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {SESSIES_OPTIES.map(s => (
                <button
                  key={s}
                  onClick={() => setSessiesPerWeek(s)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    background: sessiesPerWeek === s ? 'var(--mf-green)' : '#fff',
                    color: sessiesPerWeek === s ? '#fff' : 'var(--text-2)',
                    border: `1.5px solid ${sessiesPerWeek === s ? 'var(--mf-green)' : 'var(--border)'}`,
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>
              Tijd per sessie
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TIJD_OPTIES.map(t => (
                <button
                  key={t}
                  onClick={() => setBeschikbareTijd(t)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: beschikbareTijd === t ? 'var(--mf-green)' : '#fff',
                    color: beschikbareTijd === t ? '#fff' : 'var(--text-2)',
                    border: `1.5px solid ${beschikbareTijd === t ? 'var(--mf-green)' : 'var(--border)'}`,
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Materiaal & beperkingen</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 18 }}>Selecteer wat je beschikbaar hebt</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {MATERIAAL_OPTIES.map(m => {
                const actief = benodigdheden.includes(m.value)
                return (
                  <button
                    key={m.value}
                    onClick={() => toggleMateriaal(m.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                      background: 'var(--bg-card, white)', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${actief ? 'var(--mf-green)' : 'transparent'}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      background: actief ? 'var(--mf-green)' : 'var(--bg-subtle)',
                      border: `2px solid ${actief ? 'var(--mf-green)' : '#D1D5DB'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actief && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: actief ? 'var(--mf-green)' : 'var(--text-2)' }}>{m.label}</span>
                  </button>
                )
              })}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
              Blessures of beperkingen <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optioneel)</span>
            </label>
            <textarea
              value={blessures}
              onChange={e => setBlessures(e.target.value)}
              placeholder="bijv. knieklachten, rugproblemen"
              rows={3}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, color: 'var(--text-2)',
                border: '1.5px solid var(--border)', background: 'var(--bg-card, white)', resize: 'none', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Stap 4: Genereren */}
        {stap === 4 && (
          <div style={{ background: 'var(--bg-card, white)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm, 0 2px 12px rgba(0,0,0,0.07))' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 70%)' }} />
                </div>
                <div style={{ fontSize: 36, position: 'relative', zIndex: 1 }}>🤖</div>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Schema wordt gemaakt</h2>
              <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>Onze AI agents zijn bezig voor jou</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {agentLabels.map(({ key, label }) => {
                const status = agentStatus[key]
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 12, background: status === 'klaar' ? 'var(--mf-green-light)' : status === 'bezig' ? 'var(--mf-amber-light)' : 'var(--bg-subtle)',
                    border: `1.5px solid ${status === 'klaar' ? '#6EE7C7' : status === 'bezig' ? '#FDE68A' : 'var(--bg-subtle)'}`,
                  }}>
                    <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {status === 'klaar' && (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--mf-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: 13 }}>✓</span>
                        </div>
                      )}
                      {status === 'bezig' && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: '3px solid #FDE68A', borderTopColor: 'var(--mf-orange)',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                      )}
                      {status === 'wachten' && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--border)' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: status === 'bezig' ? 600 : 500,
                      color: status === 'klaar' ? 'var(--mf-green-dark)' : status === 'bezig' ? 'var(--mf-amber-dark)' : 'var(--text-3)',
                    }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {fout && (
              <div style={{
                marginTop: 20, padding: '16px 18px',
                background: '#FEF2F2', border: '1.5px solid #FCA5A5',
                borderRadius: 12, color: '#B91C1C',
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Fout bij genereren</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{fout}</div>
                <button
                  onClick={() => { setFout(null); setLaden(false); Promise.resolve().then(startGenereren) }}
                  style={{
                    display: 'inline-block', marginTop: 12, padding: '8px 18px',
                    background: '#B91C1C', color: '#fff', fontWeight: 600,
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  }}
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
                  background: 'var(--bg-subtle)', color: 'var(--text-2)', border: 'none', cursor: 'pointer',
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
                background: kanVerder() ? 'var(--mf-green)' : 'var(--text-4)',
                color: kanVerder() ? '#fff' : 'var(--text-3)',
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
