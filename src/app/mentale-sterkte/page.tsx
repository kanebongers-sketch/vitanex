'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import dynamic from 'next/dynamic'

const GlowOrb = dynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

const VRAGEN = [
  'Als ik een tegenslag ervaar, herstel ik me snel.',
  'Ik kan omgaan met onzekerheid zonder overmatige stress.',
  'Ik stel prioriteiten goed en voorkom overbelasting.',
  'Ik durf nee te zeggen als mijn grenzen worden overschreden.',
  'Ik heb een duidelijk gevoel van wat mij motiveert.',
  'Ik heb goede sociale steun om op terug te vallen.',
  'Ik slaap voldoende en herstel goed van inspanning.',
  'Ik houd mijn negatieve gedachten goed onder controle.',
]

const SCHAAL = [
  { waarde: 1, label: 'Nooit' },
  { waarde: 2, label: 'Zelden' },
  { waarde: 3, label: 'Soms' },
  { waarde: 4, label: 'Vaak' },
  { waarde: 5, label: 'Altijd' },
]

interface Resultaat {
  score: number
  niveau: string
  analyse: string
  per_vraag: { vraag: string; score: number }[]
}

export default function MentaleSterktePagina() {
  const router = useRouter()
  const [antwoorden, setAntwoorden] = useState<number[]>(new Array(VRAGEN.length).fill(0))
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const [huidigVraag, setHuidigVraag] = useState(0)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setLaden(false)
    }
    check()
  }, [router])

  function stelAntwoord(vraagIdx: number, waarde: number) {
    setAntwoorden(prev => prev.map((v, i) => i === vraagIdx ? waarde : v))
    if (vraagIdx < VRAGEN.length - 1) {
      setTimeout(() => setHuidigVraag(vraagIdx + 1), 300)
    }
  }

  async function verstuur() {
    if (antwoorden.some(a => a === 0)) return
    setBezig(true)
    try {
      const res = await authFetch('/api/quiz/mentale-sterkte', {
        method: 'POST',
        body: JSON.stringify({ antwoorden }),
      })
      if (res.ok) {
        const json = await res.json() as Resultaat
        setResultaat(json)
      }
    } catch { /* stil falen */ }
    setBezig(false)
  }

  function opnieuw() {
    setResultaat(null)
    setAntwoorden(new Array(VRAGEN.length).fill(0))
    setHuidigVraag(0)
  }

  const klaarVoorVerstuur = antwoorden.every(a => a > 0)

  const NIVEAU_KLEUR: Record<string, string> = {
    'Sterk': 'var(--mf-green)', 'Gemiddeld': 'var(--mf-amber)',
    'Kwetsbaar': 'var(--mf-orange)', 'Aandacht nodig': 'var(--mf-red)',
  }

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        {!resultaat ? (
          <>
            <header style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
                Mentale veerkracht quiz
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
                8 vragen · AI-analyse · 2 minuten
              </p>
              {/* Voortgangsbalk */}
              <div style={{ marginTop: 14, height: 4, borderRadius: 9999, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 9999,
                  background: 'linear-gradient(90deg, var(--mf-green, #1D9E75), var(--mf-green-dark, #15785A))',
                  width: `${(antwoorden.filter(a => a > 0).length / VRAGEN.length) * 100}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4, textAlign: 'right' }}>
                {antwoorden.filter(a => a > 0).length}/{VRAGEN.length} beantwoord
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VRAGEN.map((vraag, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)', borderRadius: 16, padding: '16px 18px',
                  border: `1.5px solid ${huidigVraag === i ? 'var(--mf-green-light)' : antwoorden[i] > 0 ? 'var(--mf-green-light)' : 'var(--border)'}`,
                  transition: 'border-color 0.2s ease',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text-4)', fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>
                    {vraag}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {SCHAAL.map(s => (
                      <button
                        key={s.waarde}
                        onClick={() => stelAntwoord(i, s.waarde)}
                        title={s.label}
                        style={{
                          flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: antwoorden[i] === s.waarde ? 'var(--mf-green, #1D9E75)' : 'var(--bg-subtle, #F3F4F6)',
                          color: antwoorden[i] === s.waarde ? 'white' : 'var(--text-3, #6B7280)',
                          fontWeight: 700, fontSize: 11,
                          transition: 'background 0.12s ease',
                        }}
                      >
                        {s.waarde}
                      </button>
                    ))}
                  </div>
                  {antwoorden[i] > 0 && (
                    <p style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 4, textAlign: 'center' }}>
                      {SCHAAL.find(s => s.waarde === antwoorden[i])?.label}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {klaarVoorVerstuur && (
              <button
                onClick={verstuur}
                disabled={bezig}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, marginTop: 20,
                  background: bezig ? 'var(--text-3)' : 'linear-gradient(135deg, var(--mf-green, #1D9E75) 0%, var(--mf-green-dark, #15785A) 100%)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
                  boxShadow: bezig ? 'none' : '0 4px 14px rgba(29,158,117,0.35)',
                }}
              >
                {bezig ? 'AI analyseert…' : 'Bekijk mijn analyse →'}
              </button>
            )}
          </>
        ) : (
          <>
            <header style={{ marginBottom: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <GlowOrb
                  color={
                    resultaat.score >= 80 ? [0.114, 0.620, 0.459] :
                    resultaat.score >= 60 ? [0.949, 0.522, 0.141] :
                    resultaat.score >= 40 ? [0.949, 0.388, 0.141] :
                    [0.887, 0.294, 0.290]
                  }
                  intensity={resultaat.score / 100}
                  size={120}
                />
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: NIVEAU_KLEUR[resultaat.niveau] ?? 'var(--text-1)', marginBottom: 4 }}>
                {resultaat.niveau}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-4)' }}>Score: {resultaat.score}/100</p>

              <div style={{ height: 8, borderRadius: 9999, background: 'var(--border)', margin: '16px auto 0', maxWidth: 280, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 9999, width: `${resultaat.score}%`,
                  background: `linear-gradient(90deg, ${NIVEAU_KLEUR[resultaat.niveau] ?? '#1D9E75'}80, ${NIVEAU_KLEUR[resultaat.niveau] ?? '#1D9E75'})`,
                  transition: 'width 1s ease',
                }} />
              </div>
            </header>

            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '20px', border: '1px solid var(--border)', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
                AI Analyse
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{resultaat.analyse}</p>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
                Jouw scores per vraag
              </p>
              {resultaat.per_vraag.map((pv, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-2)', flex: 1, marginRight: 8 }}>{pv.vraag}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pv.score >= 4 ? 'var(--mf-green)' : pv.score >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)', flexShrink: 0 }}>
                      {pv.score}/5
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 9999, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 9999, width: `${(pv.score / 5) * 100}%`, background: pv.score >= 4 ? 'var(--mf-green)' : pv.score >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={opnieuw}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: 'var(--bg-card)', color: 'var(--text-2)',
                  border: '1.5px solid var(--border)', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Opnieuw doen
              </button>
              <button
                onClick={() => router.push('/coach')}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--mf-green, #1D9E75) 0%, var(--mf-green-dark, #15785A) 100%)', color: 'white',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(29,158,117,0.3)',
                }}
              >
                Bespreek met coach →
              </button>
            </div>
          </>
        )}

      </main>
    </div>
  )
}

