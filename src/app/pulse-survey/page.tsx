'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

interface Vraag {
  id: string
  vraag: string
  type: 'scale' | 'nps' | 'multiple_choice' | 'text'
  opties: string[] | null
}

export default function PulseSurveyPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [vragen, setVragen] = useState<Vraag[]>([])
  const [alIngevuld, setAlIngevuld] = useState(false)
  const [antwoorden, setAntwoorden] = useState<Record<string, string | number>>({})
  const [stap, setStap] = useState(0)
  const [verzenden, setVerzenden] = useState(false)
  const [klaar, setKlaar] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/pulse-survey')
      if (res.ok) {
        const data = await res.json() as { vragen: Vraag[]; al_ingevuld: boolean }
        setVragen(data.vragen)
        setAlIngevuld(data.al_ingevuld)
      }
      setLaden(false)
    })
  }, [router])

  function stelAntwoord(vraagId: string, waarde: string | number) {
    setAntwoorden(prev => ({ ...prev, [vraagId]: waarde }))
  }

  function volgende() {
    if (stap < vragen.length - 1) setStap(s => s + 1)
  }

  function vorige() {
    if (stap > 0) setStap(s => s - 1)
  }

  async function verzend() {
    setVerzenden(true)
    const res = await authFetch('/api/pulse-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        antwoorden: Object.entries(antwoorden).map(([vraag_id, antwoord]) => ({ vraag_id, antwoord })),
      }),
    })
    if (res.ok) setKlaar(true)
    setVerzenden(false)
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  if (alIngevuld || klaar) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '72px 40px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
            <GlowOrb color={[0.114, 0.620, 0.459]} intensity={0.55} size={100} />
          </div>
          <div style={{ fontSize: 48, position: 'relative', zIndex: 1 }}>✓</div>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 10 }}>
          {klaar ? 'Bedankt voor je bijdrage!' : 'Al ingevuld deze week'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
          {klaar
            ? 'Jouw antwoorden zijn anoniem verzameld. Je helpt zo om het welzijn op de werkvloer te verbeteren.'
            : 'Je hebt de wekelijkse pulse survey al ingevuld. Kom volgende week terug!'}
        </p>
        <button
          onClick={() => router.push('/home')}
          style={{ marginTop: 28, padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          Terug naar home
        </button>
      </main>
    </div>
  )

  if (vragen.length === 0) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '72px 40px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-4)' }}>Geen pulse survey actief voor jouw organisatie.</p>
      </main>
    </div>
  )

  const huidigeVraag = vragen[stap]
  const voortgang = ((stap) / vragen.length) * 100
  const huidigeAntwoord = antwoorden[huidigeVraag.id]
  const isLaatste = stap === vragen.length - 1
  const isBeantwoord = huidigeAntwoord !== undefined && huidigeAntwoord !== ''

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 620, margin: '0 auto' }}>

        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>Vraag {stap + 1} van {vragen.length}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-green)' }}>{Math.round(voortgang)}%</p>
          </div>
          <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${voortgang}%`, background: 'var(--mf-green)', borderRadius: 100, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Vraagkaart */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '32px 28px', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.4, marginBottom: 28 }}>
            {huidigeVraag.vraag}
          </p>

          {/* Scale 1—5 */}
          {huidigeVraag.type === 'scale' && (
            <div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => stelAntwoord(huidigeVraag.id, n)}
                    style={{
                      width: 56, height: 56, borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700,
                      background: huidigeAntwoord === n ? 'var(--mf-green)' : 'var(--bg-subtle)',
                      color: huidigeAntwoord === n ? 'white' : 'var(--text-2)',
                      transition: 'all 0.15s ease',
                    }}
                  >{n}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Zeer slecht</span>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Uitstekend</span>
              </div>
            </div>
          )}

          {/* NPS 0—10 */}
          {huidigeVraag.type === 'nps' && (
            <div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                {Array.from({ length: 11 }, (_, i) => i).map(n => (
                  <button
                    key={n}
                    onClick={() => stelAntwoord(huidigeVraag.id, n)}
                    style={{
                      width: 46, height: 46, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                      background: huidigeAntwoord === n ? 'var(--mf-green)' : 'var(--bg-subtle)',
                      color: huidigeAntwoord === n ? 'white' : 'var(--text-2)',
                      transition: 'all 0.15s ease',
                    }}
                  >{n}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Zeer onwaarschijnlijk</span>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Zeer waarschijnlijk</span>
              </div>
            </div>
          )}

          {/* Multiple choice */}
          {huidigeVraag.type === 'multiple_choice' && huidigeVraag.opties && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {huidigeVraag.opties.map(optie => (
                <button
                  key={optie}
                  onClick={() => stelAntwoord(huidigeVraag.id, optie)}
                  style={{
                    padding: '13px 18px', borderRadius: 12, textAlign: 'left', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', border: '1.5px solid',
                    borderColor: huidigeAntwoord === optie ? 'var(--mf-green)' : 'var(--border)',
                    background: huidigeAntwoord === optie ? 'var(--mf-green-light)' : 'var(--bg-card)',
                    color: 'var(--text-2)', transition: 'all 0.15s ease',
                  }}
                >{optie}</button>
              ))}
            </div>
          )}

          {/* Open tekst */}
          {huidigeVraag.type === 'text' && (
            <textarea
              rows={4}
              value={(huidigeAntwoord as string) ?? ''}
              onChange={e => stelAntwoord(huidigeVraag.id, e.target.value)}
              placeholder="Jouw antwoord..."
              style={{
                width: '100%', border: '1.5px solid var(--border)', borderRadius: 12,
                padding: '12px 16px', fontSize: 14, outline: 'none', resize: 'vertical',
                lineHeight: 1.6, boxSizing: 'border-box', color: 'var(--text-2)', minHeight: 100,
                background: 'var(--bg-card)',
              }}
            />
          )}
        </div>

        {/* Navigatie */}
        <div style={{ display: 'flex', gap: 10 }}>
          {stap > 0 && (
            <button
              onClick={vorige}
              style={{ padding: '13px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-3)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              ← Vorige
            </button>
          )}
          <button
            onClick={isLaatste ? verzend : volgende}
            disabled={!isBeantwoord || verzenden}
            style={{
              flex: 1, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
              color: 'white', fontWeight: 600, fontSize: 14,
              opacity: !isBeantwoord || verzenden ? 0.4 : 1,
            }}
          >
            {verzenden ? 'Verzenden...' : isLaatste ? 'Verzend survey →' : 'Volgende →'}
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', marginTop: 14 }}>
          Jouw antwoorden zijn volledig anoniem en worden alleen als team-aggregaat getoond.
        </p>
      </main>
    </div>
  )
}
