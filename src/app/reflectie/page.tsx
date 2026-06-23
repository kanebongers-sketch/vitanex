'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

const REFLECTIE_VRAGEN = [
  { id: 'hoogtepunt', vraag: 'Wat was het hoogtepunt van deze week?', placeholder: 'Het moment dat me het meest energiek maakte...' },
  { id: 'uitdaging', vraag: 'Wat was de grootste uitdaging?', placeholder: 'Iets wat me moeilijk afging of stress gaf...' },
  { id: 'leermoment', vraag: 'Wat heb ik geleerd of ontdekt over mezelf?', placeholder: 'Een inzicht, patroon of nieuwe vaardigheid...' },
  { id: 'energie', vraag: 'Wat gaf me energie? Wat kostte energie?', placeholder: 'Activiteiten, mensen of situaties die...' },
  { id: 'volgende_week', vraag: 'Wat wil ik volgende week anders doen?', placeholder: 'Eén concrete verandering of intentie...' },
  { id: 'dankbaarheid', vraag: 'Waar ben ik dankbaar voor deze week?', placeholder: 'Klein of groot, persoonlijk of professioneel...' },
]

interface ReflectieEntry {
  id: string
  week_start: string
  antwoorden: Record<string, string>
  aangemaakt_op: string
}

export default function ReflectiePage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({})
  const [opslaan, setOpslaan] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [eerdere, setEerdere] = useState<ReflectieEntry[]>([])
  const [toonHistorie, setToonHistorie] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const weekStart = (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().slice(0, 10)
  })()

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [{ data: huidig }, { data: historie }] = await Promise.all([
        supabase.from('reflectie_entries').select('antwoorden')
          .eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('reflectie_entries').select('id, week_start, antwoorden, aangemaakt_op')
          .eq('user_id', user.id).order('week_start', { ascending: false }).limit(8),
      ])

      if (huidig?.antwoorden) setAntwoorden(huidig.antwoorden)
      setEerdere(historie ?? [])
      setLaden(false)
    }
    laad()
  }, [router, weekStart])

  async function slaOp() {
    if (!userId || Object.values(antwoorden).every(v => !v.trim())) return
    setOpslaan(true)

    await supabase.from('reflectie_entries').upsert({
      user_id: userId,
      week_start: weekStart,
      antwoorden,
    }, { onConflict: 'user_id,week_start' })

    setOpgeslagen(true)
    setOpslaan(false)

    const { data: bijgewerkt } = await supabase
      .from('reflectie_entries').select('id, week_start, antwoorden, aangemaakt_op')
      .eq('user_id', userId).order('week_start', { ascending: false }).limit(8)
    setEerdere(bijgewerkt ?? [])

    setTimeout(() => {
      setOpgeslagen(false)
      router.push('/vandaag')
    }, 1500)
  }

  const weekLabel = new Date(weekStart).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
  const ingevuld = Object.values(antwoorden).filter(v => v.trim()).length

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <GlowOrb
              color={[0.231, 0.510, 0.965]}
              intensity={ingevuld / REFLECTIE_VRAGEN.length}
              size={88}
            />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1, #111827)', letterSpacing: '-0.03em', marginBottom: 4 }}>Wekelijkse reflectie</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3, #9CA3AF)' }}>Week van {weekLabel} · {ingevuld}/{REFLECTIE_VRAGEN.length} vragen beantwoord</p>
            </div>
          </div>
          <button
            onClick={() => setToonHistorie(v => !v)}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 14px', background: 'var(--bg-card)', cursor: 'pointer' }}
          >
            {toonHistorie ? 'Huidige week' : `Historie (${eerdere.length})`}
          </button>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="mf-spinner" /></div>
        ) : toonHistorie ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {eerdere.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', paddingTop: 40 }}>Nog geen eerdere reflecties</p>
            ) : eerdere.map(e => {
              const datum = new Date(e.week_start).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
              const aantalIngevuld = Object.values(e.antwoorden ?? {}).filter(v => v.trim()).length
              return (
                <div key={e.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1, #111827)' }}>Week van {datum}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)' }}>{aantalIngevuld} van 6 vragen</p>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: 2, background: i < aantalIngevuld ? 'var(--mf-green)' : 'var(--border)' }} />
                      ))}
                    </div>
                  </div>
                  {e.antwoorden?.hoogtepunt && (
                    <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '2px solid #1D9E75', paddingLeft: 10 }}>
                      "{e.antwoorden.hoogtepunt.slice(0, 120)}{e.antwoorden.hoogtepunt.length > 120 ? '...' : ''}"
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {REFLECTIE_VRAGEN.map((vraag, i) => (
              <div key={vraag.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: antwoorden[vraag.id]?.trim() ? 'var(--mf-green-light, #E1F5EE)' : 'var(--surface-2, #F3F4F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: antwoorden[vraag.id]?.trim() ? 'var(--mf-green, #1D9E75)' : 'var(--text-3, #9CA3AF)', flexShrink: 0 }}>
                    {antwoorden[vraag.id]?.trim() ? '✓' : i + 1}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1, #1F2937)', lineHeight: 1.4 }}>{vraag.vraag}</p>
                </div>
                <textarea
                  rows={3}
                  value={antwoorden[vraag.id] ?? ''}
                  onChange={e => setAntwoorden(prev => ({ ...prev, [vraag.id]: e.target.value }))}
                  placeholder={vraag.placeholder}
                  style={{
                    width: '100%', border: '1px solid var(--border)', borderRadius: 10,
                    padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'vertical',
                    lineHeight: 1.6, boxSizing: 'border-box', color: 'var(--text-1, #374151)',
                    background: 'var(--bg-card)', minHeight: 80,
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={slaOp}
                disabled={opslaan || Object.values(antwoorden).every(v => !v.trim())}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 600,
                  color: 'white', border: 'none', cursor: 'pointer',
                  background: opgeslagen
                    ? 'var(--mf-green, #1D9E75)'
                    : 'linear-gradient(135deg, var(--mf-green, #1D9E75) 0%, var(--mf-green-dark, #0F6E56) 100%)',
                  opacity: (opslaan || Object.values(antwoorden).every(v => !v.trim())) ? 0.5 : 1,
                  transition: 'background 0.3s ease',
                }}
              >
                {opslaan ? 'Opslaan...' : opgeslagen ? '✓ Opgeslagen!' : 'Reflectie opslaan'}
              </button>
              <Link
                href="/journal"
                style={{ padding: '14px 18px', borderRadius: 14, fontSize: 14, fontWeight: 600, color: 'var(--text-2)', border: '1px solid var(--border)', textDecoration: 'none', background: 'var(--bg-card)', display: 'flex', alignItems: 'center' }}
              >
                Naar journal
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

