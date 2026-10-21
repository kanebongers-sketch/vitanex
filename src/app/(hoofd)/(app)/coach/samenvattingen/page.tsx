'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'


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
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>
        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Wat Vita onthoudt
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              AI-samenvattingen van jouw gesprekken
            </p>
          </div>
          <Link href="/coach" style={{
            background: 'var(--text-1)', color: 'var(--bg-app)', textDecoration: 'none',
            padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          }}>
            Naar Vita →
          </Link>
        </header>

        {samenvattingen.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '40px 24px',
            textAlign: 'center', border: '1px solid var(--border)',
          }}>
            <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 12 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
              </div>
              <span style={{
                position: 'relative', zIndex: 1,
                width: 64, height: 64, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
              }}>
                <Brain size={30} strokeWidth={1.5} aria-hidden />
              </span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Nog geen samenvattingen
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Na een paar berichten met Vita wordt er automatisch<br />een samenvatting opgeslagen om je beter te helpen.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {samenvattingen.map((s, i) => (
              <div key={s.id} style={{
                background: 'var(--bg-card)', borderRadius: 16, padding: '18px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === 0 ? 'var(--mf-green)' : 'var(--border)',
                    }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--mf-green)' : 'var(--text-3)' }}>
                      {i === 0 ? 'Meest recent' : `Week ${i + 1}`}
                    </p>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    Week van {formatWeek(s.week_start)}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
                  {s.samenvatting}
                </p>
              </div>
            ))}

            <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>
              Samenvattingen worden automatisch aangemaakt tijdens gesprekken. Ze helpen Vita beter aan te sluiten op jouw situatie.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

