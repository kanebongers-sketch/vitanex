'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

type Fase = 'focus' | 'pauze' | 'lang-pauze' | 'klaar'
type Modus = { label: string; focus: number; pauze: number; langPauze: number; ronden: number; kleur: string }

const MODI: Modus[] = [
  { label: 'Klassiek', focus: 25, pauze: 5, langPauze: 15, ronden: 4, kleur: '#E24B4A' },
  { label: 'Deep work', focus: 50, pauze: 10, langPauze: 30, ronden: 3, kleur: '#1D9E75' },
  { label: 'Quick', focus: 15, pauze: 3, langPauze: 10, ronden: 4, kleur: '#6366f1' },
]

function formatTijd(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PomodoroPage() {
  const router = useRouter()
  const [klaar, setKlaar] = useState(false)
  const [modus, setModus] = useState(0)
  const [fase, setFase] = useState<Fase>('klaar')
  const [ronde, setRonde] = useState(0)
  const [secOver, setSecOver] = useState(0)
  const [gaandeMinuten, setGaandeMinuten] = useState(0)
  const [notitie, setNotitie] = useState('')
  const [voltooide, setVoltooide] = useState<{ type: string; minuten: number; tijd: string }[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTijdRef = useRef<number | null>(null)

  const huidigemodus = MODI[modus]

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setKlaar(true)
    })
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [router])

  function startFocus() {
    setFase('focus')
    setRonde(r => r + 1)
    startTijdRef.current = Date.now()
    setSecOver(huidigemodus.focus * 60)
    setGaandeMinuten(0)
    startTimer('focus')
  }

  function startTimer(huidige: Fase) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const duur = huidige === 'focus'
      ? huidigemodus.focus * 60
      : huidige === 'lang-pauze'
        ? huidigemodus.langPauze * 60
        : huidigemodus.pauze * 60

    let resterende = duur
    intervalRef.current = setInterval(() => {
      resterende--
      setSecOver(resterende)
      if (huidige === 'focus' && startTijdRef.current) {
        const verstreken = Math.floor((Date.now() - startTijdRef.current) / 60000)
        setGaandeMinuten(verstreken)
      }
      if (resterende <= 0) {
        clearInterval(intervalRef.current!)
        eindig(huidige)
      }
    }, 1000)
    setSecOver(duur)
  }

  function eindig(geeindigde: Fase) {
    if (geeindigde === 'focus') {
      const minuten = huidigemodus.focus
      const tijd = new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
      setVoltooide(prev => [{ type: 'Pomodoro', minuten, tijd }, ...prev])
      authFetch('/api/focus/sessie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pomodoro', duur_minuten: minuten, notitie: notitie.trim() || null }),
      })

      if (ronde >= huidigemodus.ronden) {
        setFase('lang-pauze')
        startTimer('lang-pauze')
      } else {
        setFase('pauze')
        startTimer('pauze')
      }
    } else {
      setFase('klaar')
      if (ronde >= huidigemodus.ronden) setRonde(0)
    }
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (fase === 'focus' && startTijdRef.current) {
      const verstreken = Math.floor((Date.now() - startTijdRef.current) / 60000)
      if (verstreken >= 5) {
        setVoltooide(prev => [{ type: 'Gedeeltelijk', minuten: verstreken, tijd: new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }) }, ...prev])
        authFetch('/api/focus/sessie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'pomodoro', duur_minuten: verstreken, notitie: notitie.trim() || null }),
        })
      }
    }
    setFase('klaar')
    setRonde(0)
    startTijdRef.current = null
  }

  if (!klaar) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  const gefasseKleur = fase === 'focus' ? huidigemodus.kleur : fase === 'pauze' ? '#1D9E75' : fase === 'lang-pauze' ? '#6366f1' : 'var(--text-4)'
  const faseLabel = fase === 'focus' ? 'Focus' : fase === 'pauze' ? 'Pauze' : fase === 'lang-pauze' ? 'Lange pauze' : 'Klaar'
  const maxSec = fase === 'focus' ? huidigemodus.focus * 60
    : fase === 'pauze' ? huidigemodus.pauze * 60
      : fase === 'lang-pauze' ? huidigemodus.langPauze * 60 : 1
  const progress = fase === 'klaar' ? 0 : 1 - (secOver / maxSec)
  const r = 80
  const circ = 2 * Math.PI * r

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 600, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Pomodoro timer</h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Gestructureerde focus met pauzes voor optimale productiviteit</p>
        </div>

        {/* Modus selector */}
        {fase === 'klaar' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {MODI.map((m, i) => (
              <button
                key={m.label}
                onClick={() => setModus(i)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  border: `2px solid ${modus === i ? m.kleur : 'var(--border)'}`,
                  background: modus === i ? `${m.kleur}0F` : 'var(--bg-card)',
                  color: modus === i ? m.kleur : 'var(--text-4)',
                  cursor: 'pointer',
                }}
              >
                <p>{m.label}</p>
                <p style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>{m.focus}m · {m.pauze}m pauze</p>
              </button>
            ))}
          </div>
        )}

        {/* Timer ring */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: '40px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <svg width={r * 2 + 20} height={r * 2 + 20} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth="8" />
              <circle
                cx={r + 10} cy={r + 10} r={r}
                fill="none" stroke={gefasseKleur} strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: gefasseKleur }}>{faseLabel}</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
                {fase === 'klaar' ? formatTijd(huidigemodus.focus * 60) : formatTijd(secOver)}
              </p>
              {ronde > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-4)' }}>Ronde {ronde}/{huidigemodus.ronden}</p>
              )}
            </div>
          </div>

          {/* Ronde stippen */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {Array.from({ length: huidigemodus.ronden }, (_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < ronde ? huidigemodus.kleur : 'var(--border)' }} />
            ))}
          </div>

          {/* Knoppen */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {fase === 'klaar' ? (
              <button
                onClick={startFocus}
                style={{ padding: '14px 40px', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)' }}
              >
                Start focus
              </button>
            ) : fase === 'focus' ? (
              <button
                onClick={stop}
                style={{ padding: '14px 32px', borderRadius: 14, fontSize: 14, fontWeight: 600, color: '#E24B4A', border: '2px solid #E24B4A', cursor: 'pointer', background: 'var(--bg-card)' }}
              >
                Stop
              </button>
            ) : (
              <>
                <button
                  onClick={startFocus}
                  style={{ padding: '14px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)' }}
                >
                  Volgende ronde
                </button>
                <button
                  onClick={() => { setFase('klaar'); setRonde(0) }}
                  style={{ padding: '14px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600, color: 'var(--text-3)', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-card)' }}
                >
                  Stoppen
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notitie */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 8 }}>Waar focus je op?</p>
          <input
            type="text"
            placeholder="Bijv. E-mails beantwoorden, rapport schrijven..."
            value={notitie}
            onChange={e => setNotitie(e.target.value)}
            style={{ width: '100%', border: 'none', fontSize: 14, color: 'var(--text-2)', outline: 'none', background: 'transparent', boxSizing: 'border-box' }}
          />
        </div>

        {/* Voltooide sessies vandaag */}
        {voltooide.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: 12 }}>Voltooide sessies</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {voltooide.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.type === 'Gedeeltelijk' ? '#F59E0B' : huidigemodus.kleur }} />
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-4)' }}>
                    <span>{s.minuten} min</span>
                    <span>{s.tijd}</span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--bg-subtle)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Totaal vandaag</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: huidigemodus.kleur }}>
                  {voltooide.reduce((s, v) => s + v.minuten, 0)} min
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
