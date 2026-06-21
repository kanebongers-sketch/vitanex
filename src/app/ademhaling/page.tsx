'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface Techniek {
  id: string
  naam: string
  beschrijving: string
  fasen: { naam: string; seconden: number; kleur: string }[]
  rondes: number
  doel: string
}

const TECHNIEKEN: Techniek[] = [
  {
    id: '478',
    naam: '4-7-8 ontspanning',
    beschrijving: 'Kalmeert het zenuwstelsel, helpt bij stress en slaap.',
    doel: 'Ontspanning & slaap',
    rondes: 4,
    fasen: [
      { naam: 'Inademen', seconden: 4, kleur: 'var(--mf-green)' },
      { naam: 'Vasthouden', seconden: 7, kleur: 'var(--mf-purple)' },
      { naam: 'Uitademen', seconden: 8, kleur: 'var(--mf-blue)' },
    ],
  },
  {
    id: 'box',
    naam: 'Box breathing',
    beschrijving: 'Gebruikt door Navy SEALs. Verbetert focus en kalmte onder druk.',
    doel: 'Focus & stressreductie',
    rondes: 4,
    fasen: [
      { naam: 'Inademen', seconden: 4, kleur: 'var(--mf-green)' },
      { naam: 'Vasthouden', seconden: 4, kleur: 'var(--mf-purple)' },
      { naam: 'Uitademen', seconden: 4, kleur: 'var(--mf-blue)' },
      { naam: 'Vasthouden', seconden: 4, kleur: 'var(--mf-purple)' },
    ],
  },
  {
    id: 'coherent',
    naam: 'Coherente ademhaling',
    beschrijving: '5 ademhalingen per minuut voor maximale HRV en balans.',
    doel: 'Hart-brein coherentie',
    rondes: 5,
    fasen: [
      { naam: 'Inademen', seconden: 6, kleur: 'var(--mf-green)' },
      { naam: 'Uitademen', seconden: 6, kleur: 'var(--mf-blue)' },
    ],
  },
  {
    id: 'wim',
    naam: 'Powerademhaling',
    beschrijving: 'Energiegevende hyperventilatie gevolgd door retentie.',
    doel: 'Energie & vitaliteit',
    rondes: 3,
    fasen: [
      { naam: 'Snel inademen', seconden: 2, kleur: 'var(--mf-amber)' },
      { naam: 'Loslaten', seconden: 2, kleur: 'var(--mf-red)' },
      { naam: 'Retentie', seconden: 15, kleur: 'var(--mf-purple)' },
    ],
  },
]

export default function AdemhalingPage() {
  const router = useRouter()
  const [gekozen, setGekozen] = useState<Techniek | null>(null)
  const [bezig, setBezig] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const [ronde, setRonde] = useState(0)
  const [fase, setFase] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<Date | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function start() {
    if (!gekozen) return
    setBezig(true)
    setKlaar(false)
    setRonde(0)
    setFase(0)
    setCountdown(gekozen.fasen[0].seconden)
    startRef.current = new Date()
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setFase(f => {
            const volgende = f + 1
            if (volgende >= gekozen!.fasen.length) {
              setRonde(r => {
                const volgendeRonde = r + 1
                if (volgendeRonde >= gekozen!.rondes) {
                  clearInterval(timerRef.current!)
                  setBezig(false)
                  setKlaar(true)
                  const duur = Math.round((new Date().getTime() - startRef.current!.getTime()) / 60000)
                  authFetch('/api/focus/sessie', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'adem', duur_minuten: Math.max(1, duur) }),
                  }).catch(() => {})
                  return volgendeRonde
                }
                return volgendeRonde
              })
              setCountdown(gekozen!.fasen[0].seconden)
              return 0
            }
            setCountdown(gekozen!.fasen[volgende].seconden)
            return volgende
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setBezig(false)
    setKlaar(false)
    setRonde(0)
    setFase(0)
    setCountdown(0)
  }

  const huidigeF = gekozen?.fasen[fase]
  const totaleSec = gekozen?.fasen.reduce((s, f) => s + f.seconden, 0) ?? 0

  const cirkelPct = huidigeF ? (1 - (countdown / huidigeF.seconden)) : 0
  const r = 80
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - cirkelPct)

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 680, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 6 }}>Ademhalingsoefeningen</h1>
        <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 28 }}>Bewezen technieken om stress te verminderen en focus te verbeteren.</p>

        {!bezig && !klaar ? (
          <>
            {/* Technieken grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {TECHNIEKEN.map(t => (
                <div
                  key={t.id}
                  onClick={() => setGekozen(t)}
                  style={{
                    background: 'var(--bg-card)', borderRadius: 16, padding: '18px 20px',
                    border: `1.5px solid ${gekozen?.id === t.id ? '#1D9E75' : 'var(--border)'}`,
                    cursor: 'pointer',
                    boxShadow: gekozen?.id === t.id ? '0 0 0 3px #1D9E7520' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {t.fasen.map(f => (
                      <div key={f.naam} style={{ height: 4, flex: f.seconden, borderRadius: 100, background: f.kleur }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{t.naam}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.4, marginBottom: 8 }}>{t.beschrijving}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--mf-green)', background: '#1D9E7515', padding: '2px 8px', borderRadius: 100 }}>{t.doel}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{t.rondes} rondes · {Math.round((t.fasen.reduce((s, f) => s + f.seconden, 0) * t.rondes) / 60)} min</span>
                  </div>
                </div>
              ))}
            </div>

            {gekozen && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>Fasen — {gekozen.naam}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {gekozen.fasen.map((f, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 6, background: f.kleur, borderRadius: 100, marginBottom: 6 }} />
                      <p style={{ fontSize: 11, fontWeight: 600, color: f.kleur }}>{f.naam}</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{f.seconden}s</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={start}
              disabled={!gekozen}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, background: 'var(--mf-green)',
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
                opacity: gekozen ? 1 : 0.4,
              }}
            >
              Start oefening →
            </button>
          </>
        ) : klaar ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧘</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Goed gedaan!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>
              Je hebt {gekozen?.rondes} rondes {gekozen?.naam} voltooid.<br/>
              Neem even de tijd om de rust te voelen.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setKlaar(false); setGekozen(null) }} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Andere oefening
              </button>
              <button onClick={start} style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--mf-green)', color: 'white', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Herhalen
              </button>
            </div>
          </div>
        ) : (
          /* Actieve sessie */
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 24 }}>
              Ronde {ronde + 1} van {gekozen!.rondes}
            </p>

            {/* Cirkel */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
              <svg width={200} height={200}>
                <circle cx={100} cy={100} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={8} />
                <circle
                  cx={100} cy={100} r={r} fill="none"
                  stroke={huidigeF?.kleur ?? 'var(--mf-green)'}
                  strokeWidth={8}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
                <text x="100" y="90" textAnchor="middle" style={{ fontSize: 40, fontWeight: 800, fill: 'var(--text-1)', dominantBaseline: 'middle' }} dominantBaseline="middle">
                  {countdown}
                </text>
                <text x="100" y="125" textAnchor="middle" style={{ fontSize: 13, fill: huidigeF?.kleur, fontWeight: 600 }}>
                  {huidigeF?.naam}
                </text>
              </svg>
            </div>

            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
              {gekozen!.fasen.map((f, i) => (
                <div key={i} style={{ height: 6, width: 32, borderRadius: 100, background: i === fase ? f.kleur : 'var(--border)', transition: 'background 0.3s' }} />
              ))}
            </div>

            <button
              onClick={stop}
              style={{ padding: '12px 28px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-3)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Stoppen
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

