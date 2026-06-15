'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

const REFLECTIE_VRAGEN = [
  { id: 'hoogtepunt', vraag: 'Wat was het hoogtepunt van deze week?', placeholder: 'Het moment dat me het meest energiek maakte...' },
  { id: 'uitdaging', vraag: 'Wat was de grootste uitdaging?', placeholder: 'Iets wat me moeilijk afging of stress gaf...' },
  { id: 'leermoment', vraag: 'Wat heb ik geleerd of ontdekt over mezelf?', placeholder: 'Een inzicht, patroon of nieuwe vaardigheid...' },
  { id: 'energie', vraag: 'Wat gaf me energie? Wat kostte energie?', placeholder: 'Activiteiten, mensen of situaties die...' },
  { id: 'volgende_week', vraag: 'Wat wil ik volgende week anders doen?', placeholder: 'EÃ©n concrete verandering of intentie...' },
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
    setTimeout(() => setOpgeslagen(false), 2500)

    const { data: bijgewerkt } = await supabase
      .from('reflectie_entries').select('id, week_start, antwoorden, aangemaakt_op')
      .eq('user_id', userId).order('week_start', { ascending: false }).limit(8)
    setEerdere(bijgewerkt ?? [])
  }

  const weekLabel = new Date(weekStart).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
  const ingevuld = Object.values(antwoorden).filter(v => v.trim()).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>Wekelijkse reflectie</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Week van {weekLabel} Â· {ingevuld}/{REFLECTIE_VRAGEN.length} vragen beantwoord</p>
          </div>
          <button
            onClick={() => setToonHistorie(v => !v)}
            style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 10, padding: '7px 14px', background: 'white', cursor: 'pointer' }}
          >
            {toonHistorie ? 'Huidige week' : `Historie (${eerdere.length})`}
          </button>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="mf-spinner" /></div>
        ) : toonHistorie ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {eerdere.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingTop: 40 }}>Nog geen eerdere reflecties</p>
            ) : eerdere.map(e => {
              const datum = new Date(e.week_start).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
              const aantalIngevuld = Object.values(e.antwoorden ?? {}).filter(v => v.trim()).length
              return (
                <div key={e.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Week van {datum}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>{aantalIngevuld} van 6 vragen</p>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: 2, background: i < aantalIngevuld ? '#1D9E75' : '#E5E7EB' }} />
                      ))}
                    </div>
                  </div>
                  {e.antwoorden?.hoogtepunt && (
                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '2px solid #1D9E75', paddingLeft: 10 }}>
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
              <div key={vraag.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: antwoorden[vraag.id]?.trim() ? '#E1F5EE' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: antwoorden[vraag.id]?.trim() ? '#1D9E75' : '#9CA3AF', flexShrink: 0 }}>
                    {antwoorden[vraag.id]?.trim() ? 'âœ“' : i + 1}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', lineHeight: 1.4 }}>{vraag.vraag}</p>
                </div>
                <textarea
                  rows={3}
                  value={antwoorden[vraag.id] ?? ''}
                  onChange={e => setAntwoorden(prev => ({ ...prev, [vraag.id]: e.target.value }))}
                  placeholder={vraag.placeholder}
                  style={{
                    width: '100%', border: '1px solid #E5E7EB', borderRadius: 10,
                    padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'vertical',
                    lineHeight: 1.6, boxSizing: 'border-box', color: '#374151',
                    minHeight: 80,
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
                  color: 'white', border: 'none', cursor: 'pointer', background: '#1D9E75',
                  opacity: (opslaan || Object.values(antwoorden).every(v => !v.trim())) ? 0.5 : 1,
                }}
              >
                {opslaan ? 'Opslaan...' : opgeslagen ? 'âœ“ Opgeslagen!' : 'Reflectie opslaan'}
              </button>
              <Link
                href="/journal"
                style={{ padding: '14px 18px', borderRadius: 14, fontSize: 14, fontWeight: 600, color: '#6B7280', border: '1px solid #E5E7EB', textDecoration: 'none', background: 'white', display: 'flex', alignItems: 'center' }}
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

