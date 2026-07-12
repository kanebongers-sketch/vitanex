'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserRound, ShieldCheck } from 'lucide-react'

interface MijnCoach {
  koppeling_id: string
  coach_id: string
  coach_naam: string
  coach_avatar: string | null
  status: string
  inzage_toestemming: boolean
  sinds: string
}

export default function MijnCoachPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [coaches, setCoaches] = useState<MijnCoach[]>([])
  const [bezig, setBezig] = useState<string | null>(null)

  const laadCoaches = useCallback(async () => {
    const res = await authFetch('/api/coaching/mijn-coaches')
    if (res.ok) {
      const data = await res.json() as { coaches: MijnCoach[] }
      setCoaches(data.coaches ?? [])
    }
    setLaden(false)
  }, [])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await laadCoaches()
    }
    laad()
  }, [router, laadCoaches])

  async function zetToestemming(coachId: string, waarde: boolean) {
    setBezig(coachId)
    // Optimistische update
    setCoaches(prev => prev.map(c => c.coach_id === coachId ? { ...c, inzage_toestemming: waarde } : c))
    const res = await authFetch('/api/coaching/toestemming', {
      method: 'POST',
      body: JSON.stringify({ coach_id: coachId, waarde }),
    })
    if (!res.ok) {
      // Rollback bij fout
      setCoaches(prev => prev.map(c => c.coach_id === coachId ? { ...c, inzage_toestemming: !waarde } : c))
    }
    setBezig(null)
  }

  async function beeindig(coachId: string, naam: string) {
    if (!window.confirm(`Koppeling met ${naam} beëindigen? Je coach kan je gegevens daarna niet meer inzien.`)) return
    const res = await authFetch('/api/coaching/mijn-coaches', {
      method: 'POST',
      body: JSON.stringify({ coach_id: coachId }),
    })
    if (res.ok) setCoaches(prev => prev.filter(c => c.coach_id !== coachId))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 640, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Mijn coach
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Beheer wie jouw persoonlijke begeleiding verzorgt en wat ze mogen inzien.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : coaches.length === 0 ? (
          <Card style={{ padding: 8 }}>
            <EmptyState
              icon={UserRound}
              title="Je hebt nog geen coach"
              description="Zodra een coach jou koppelt, verschijnt die hier en kun je inzage in je welzijnsdata toestaan."
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {coaches.map(c => (
              <Card key={c.koppeling_id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <Avatar naam={c.coach_naam} avatarUrl={c.coach_avatar} size={48} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{c.coach_naam}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Je coach sinds {new Date(c.sinds).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Inzage-toestemming */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <ShieldCheck size={18} aria-hidden style={{ color: c.inzage_toestemming ? 'var(--mf-green)' : 'var(--text-4)', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
                      Deel mijn welzijnsdata met {c.coach_naam.split(' ')[0]}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                      Je coach ziet dan je check-ins, welzijnsprofiel en voortgang. Je kunt dit altijd weer intrekken.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={c.inzage_toestemming}
                    aria-label={`Inzage voor ${c.coach_naam} ${c.inzage_toestemming ? 'aan' : 'uit'}`}
                    disabled={bezig === c.coach_id}
                    onClick={() => zetToestemming(c.coach_id, !c.inzage_toestemming)}
                    style={{
                      position: 'relative', width: 44, height: 26, borderRadius: 100, border: 'none',
                      cursor: bezig === c.coach_id ? 'wait' : 'pointer', flexShrink: 0, padding: 0,
                      background: c.inzage_toestemming ? 'var(--mf-green)' : 'var(--border-strong)',
                      transition: 'background 0.18s var(--ease)',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: c.inzage_toestemming ? 21 : 3,
                      width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-card)',
                      transition: 'left 0.18s var(--ease)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => beeindig(c.coach_id, c.coach_naam)}
                  style={{ marginTop: 14, fontSize: 12, color: 'var(--mf-red)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}
                >
                  Koppeling beëindigen
                </button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
