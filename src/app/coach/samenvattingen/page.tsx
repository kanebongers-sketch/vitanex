'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface Samenvatting {
  id: string
  week_start: string
  samenvatting: string
  aangemaakt_op: string
}

export default function CoachSamenvattingenPagina() {
  const router = useRouter()
  const [samenvattingen, setSamenvattingen] = useState<Samenvatting[]>([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/coach/samenvattingen')
      if (res.ok) {
        const json = await res.json() as { samenvattingen: Samenvatting[] }
        setSamenvattingen(json.samenvattingen ?? [])
      }
      setLaden(false)
    }
    laad()
  }, [router])

  function formatWeek(weekStart: string) {
    const d = new Date(weekStart)
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>
        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Coach geheugen
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              AI-samenvattingen van jouw gesprekken
            </p>
          </div>
          <Link href="/coach" style={{
            background: '#111827', color: 'white', textDecoration: 'none',
            padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          }}>
            Naar coach →
          </Link>
        </header>

        {samenvattingen.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 20, padding: '40px 24px',
            textAlign: 'center', border: '1px solid #E5E7EB',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Nog geen samenvattingen
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
              Na 6+ berichten met de AI Coach sla ik automatisch<br />een samenvatting op om je beter te helpen.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {samenvattingen.map((s, i) => (
              <div key={s.id} style={{
                background: 'white', borderRadius: 16, padding: '18px',
                border: '1px solid #E5E7EB',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === 0 ? '#1D9E75' : '#E5E7EB',
                    }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#1D9E75' : '#9CA3AF' }}>
                      {i === 0 ? 'Meest recent' : `Week ${i + 1}`}
                    </p>
                  </div>
                  <p style={{ fontSize: 10, color: '#9CA3AF' }}>
                    Week van {formatWeek(s.week_start)}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>
                  {s.samenvatting}
                </p>
              </div>
            ))}

            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
              Samenvattingen worden automatisch aangemaakt tijdens gesprekken. Ze worden gebruikt om de coach beter te laten aansluiten op jouw situatie.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

