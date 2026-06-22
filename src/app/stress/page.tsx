'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

const TECHNIEKEN = [
  { id: 'box', label: 'Box breathing', beschrijving: '4-4-4-4 ritme' },
  { id: '478', label: '4-7-8 ademhaling', beschrijving: 'Kalmeer je zenuwstelsel' },
  { id: 'grounding', label: 'Grounding 5-4-3-2-1', beschrijving: '5 zintuigen oefening' },
  { id: 'pmr', label: 'Progressieve ontspanning', beschrijving: 'Spiergroepen loslaten' },
]

interface StressLog {
  id: string
  stress_niveau: number
  aangemaakt_op: string
  notitie: string | null
  techniek: string | null
}

type AtemFase = 'in' | 'vast' | 'uit' | 'rust' | 'idle'

export default function StressPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [niveau, setNiveau] = useState<number>(5)
  const [notitie, setNotitie] = useState('')
  const [gekozeTechniek, setGekozeTechniek] = useState<string | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [logs, setLogs] = useState<StressLog[]>([])
  const [succesBericht, setSuccesBericht] = useState<string | null>(null)

  // Ademhaling animatie state
  const [ademFase, setAdemFase] = useState<AtemFase>('idle')
  const [ademCyclus, setAdemCyclus] = useState(0)
  const [ademBezig, setAdemBezig] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const res = await authFetch('/api/stress?limit=30')
      if (res.ok) {
        const json = await res.json() as { logs: StressLog[] }
        setLogs(json.logs ?? [])
      }
      setLaden(false)
    }
    laad()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [router])

  function startBoxBreathing() {
    if (ademBezig) {
      setAdemBezig(false)
      setAdemFase('idle')
      setAdemCyclus(0)
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    setAdemBezig(true)
    setAdemCyclus(1)
    runCyclus(1)
  }

  function runCyclus(cyclus: number) {
    if (cyclus > 4) {
      setAdemFase('idle')
      setAdemBezig(false)
      setAdemCyclus(0)
      return
    }
    setAdemCyclus(cyclus)
    setAdemFase('in')
    timerRef.current = setTimeout(() => {
      setAdemFase('vast')
      timerRef.current = setTimeout(() => {
        setAdemFase('uit')
        timerRef.current = setTimeout(() => {
          setAdemFase('rust')
          timerRef.current = setTimeout(() => {
            runCyclus(cyclus + 1)
          }, 4000)
        }, 4000)
      }, 4000)
    }, 4000)
  }

  async function verstuur() {
    setOpslaan(true)
    try {
      const res = await authFetch('/api/stress', {
        method: 'POST',
        body: JSON.stringify({ stress_niveau: niveau, notitie: notitie || undefined, techniek: gekozeTechniek || undefined }),
      })
      if (res.ok) {
        const json = await res.json() as { log: StressLog }
        setLogs(prev => [json.log, ...prev.slice(0, 6)])
        setNotitie('')
        setSuccesBericht('Stress niveau opgeslagen ✓')
        setTimeout(() => router.push('/vandaag'), 1500)
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  const FASE_TEKST: Record<AtemFase, string> = {
    idle: 'Druk om te starten',
    in: 'Adem IN',
    vast: 'Vasthouden',
    uit: 'Adem UIT',
    rust: 'Rust',
  }

  const NIVEAU_KLEUR = (n: number) =>
    n <= 3 ? 'var(--mf-green)' : n <= 6 ? 'var(--mf-amber)' : 'var(--mf-red)'

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Stressmanagement
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
            Log je stressniveau en oefen ontspanningstechnieken
          </p>
        </header>

        {succesBericht && (
          <div style={{ background: 'var(--mf-green-light)', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--mf-green-dark)', fontWeight: 600 }}>
            {succesBericht}
          </div>
        )}

        {/* Stressniveau slider */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '20px', border: '1px solid var(--border)', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 16 }}>
            Hoe gestrest voel je je nu?
          </p>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: NIVEAU_KLEUR(niveau) }}>{niveau}</span>
            <span style={{ fontSize: 18, color: 'var(--text-4)' }}>/10</span>
          </div>
          <input
            type="range" min={1} max={10} value={niveau}
            onChange={e => setNiveau(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: NIVEAU_KLEUR(niveau) }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-4)' }}>Heel rustig</span>
            <span style={{ fontSize: 10, color: 'var(--text-4)' }}>Heel gestrest</span>
          </div>
        </div>

        {/* Notitie */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 10 }}>
            Wat speelt er? (optioneel)
          </p>
          <textarea
            value={notitie}
            onChange={e => setNotitie(e.target.value)}
            placeholder="Werklast, gesprek, deadline..."
            maxLength={200}
            rows={2}
            style={{
              width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
              padding: '10px 12px', fontSize: 13, color: 'var(--text-1)',
              outline: 'none', resize: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', background: 'var(--bg-card)',
            }}
          />
        </div>

        {/* Technieken */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
            Gebruikte techniek (optioneel)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TECHNIEKEN.map(t => (
              <button key={t.id} onClick={() => setGekozeTechniek(prev => prev === t.id ? null : t.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: gekozeTechniek === t.id ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                border: `1.5px solid ${gekozeTechniek === t.id ? '#1D9E75' : 'var(--border)'}`,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-4)' }}>{t.beschrijving}</p>
                </div>
                {gekozeTechniek === t.id && <span style={{ color: 'var(--mf-green)', fontSize: 16 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={verstuur}
          disabled={opslaan}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, marginBottom: 24,
            background: opslaan ? 'var(--text-3)' : 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
            boxShadow: opslaan ? 'none' : '0 4px 16px rgba(29,158,117,0.35)',
            color: 'white', border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 700,
          }}
        >
          {opslaan ? 'Opslaan…' : 'Stress loggen →'}
        </button>

        {/* Box breathing oefening */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '20px', border: '1px solid var(--border)', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 16 }}>
            Box breathing — 4×4 cycli
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              onClick={startBoxBreathing}
              style={{
                width: 120, height: 120, borderRadius: '50%',
                background: ademBezig ? '#1D9E7515' : 'var(--bg-subtle)',
                border: `3px solid ${ademBezig ? '#1D9E75' : 'var(--border)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.5s ease, border-color 0.3s',
                transform: ademFase === 'in' ? 'scale(1.15)' : ademFase === 'uit' ? 'scale(0.88)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {FASE_TEKST[ademFase]}
              </span>
              {ademBezig && <span style={{ fontSize: 10, color: 'var(--mf-green)', marginTop: 2 }}>{ademCyclus}/4</span>}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>
              {ademBezig ? 'Tik om te stoppen' : '4 sec inademen · 4 vast · 4 uitademen · 4 rust'}
            </p>
          </div>
        </div>

        {/* 7-daagse stresstrip */}
        {logs.length > 0 && (() => {
          const vandaag = new Date()
          const vandaagStr = vandaag.toISOString().split('T')[0]
          const dagMap = new Map<string, number[]>()
          logs.forEach(l => {
            const d = l.aangemaakt_op.split('T')[0]
            if (!dagMap.has(d)) dagMap.set(d, [])
            dagMap.get(d)!.push(l.stress_niveau)
          })
          const strip = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(vandaag)
            d.setDate(d.getDate() - (6 - i))
            const ds = d.toISOString().split('T')[0]
            const waarden = dagMap.get(ds) ?? []
            const gem = waarden.length ? Math.round(waarden.reduce((a, b) => a + b, 0) / waarden.length) : null
            return { ds, dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2), gem, isVandaag: ds === vandaagStr }
          })
          const gemDezeWeek = (() => {
            const vals = strip.map(s => s.gem).filter((v): v is number => v !== null)
            return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
          })()
          return (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                {strip.map(({ ds, dag, gem, isVandaag }) => {
                  const kleur = gem === null ? 'var(--bg-subtle)' : gem <= 3 ? 'var(--mf-green)' : gem <= 6 ? 'var(--mf-amber)' : 'var(--mf-red)'
                  return (
                    <div key={ds} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%', height: 32, borderRadius: 6,
                        background: gem !== null ? kleur : 'var(--bg-subtle)',
                        opacity: gem !== null ? 0.85 : 0.4,
                        outline: isVandaag ? `2px solid ${gem !== null ? kleur : 'var(--border-strong)'}` : 'none',
                        outlineOffset: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {gem !== null && <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{gem}</span>}
                      </div>
                      <span style={{ fontSize: 8, color: isVandaag ? 'var(--text-2)' : 'var(--text-4)', fontWeight: isVandaag ? 800 : 400, textTransform: 'capitalize' }}>{dag}</span>
                    </div>
                  )
                })}
              </div>
              {gemDezeWeek !== null && (
                <div style={{ textAlign: 'center', paddingLeft: 12, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: NIVEAU_KLEUR(gemDezeWeek), margin: 0, lineHeight: 1 }}>{gemDezeWeek}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>gem<br />week</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Recente logs */}
        {logs.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 10 }}>
              Recente logs
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  background: 'var(--bg-card)', borderRadius: 12, padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: NIVEAU_KLEUR(log.stress_niveau) + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, color: NIVEAU_KLEUR(log.stress_niveau),
                  }}>
                    {log.stress_niveau}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {log.notitie && <p style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.notitie}</p>}
                    {log.techniek && <p style={{ fontSize: 10, color: 'var(--text-4)' }}>{TECHNIEKEN.find(t => t.id === log.techniek)?.label}</p>}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-4)', flexShrink: 0 }}>
                    {new Date(log.aangemaakt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

