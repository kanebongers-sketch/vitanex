'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { CoachHeader, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { UserRound, ShieldCheck, Unlink } from 'lucide-react'

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
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 640, margin: '0 auto' }}>
        <CoachHeader
          eyebrow="Persoonlijke begeleiding"
          titel="Mijn coach"
          subtitel="Beheer wie jou begeleidt en bepaal zelf wat je coach mag inzien. Je houdt de regie — altijd."
        />

        {laden ? (
          <CoachSkeleton rijen={1} />
        ) : coaches.length === 0 ? (
          <CoachEmpty
            icon={UserRound}
            titel="Je hebt nog geen coach"
            tekst="Zodra een coach jou koppelt, verschijnt die hier en kun je inzage in je welzijnsdata toestaan."
          />
        ) : (
          <div className="mf-coach-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {coaches.map(c => {
              const voornaam = c.coach_naam.split(' ')[0]
              const bezigNu = bezig === c.coach_id
              return (
                <Card key={c.koppeling_id} className="mf-card-glow" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Coach-identiteit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '20px 22px' }}>
                    <Avatar naam={c.coach_naam} avatarUrl={c.coach_avatar} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="mf-overline" style={{ color: 'var(--mf-green)', marginBottom: 5 }}>Jouw coach</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{c.coach_naam}</p>
                      <p className="mf-caption" style={{ marginTop: 2 }}>
                        Sinds {new Date(c.sinds).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Inzage-toestemming */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '16px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                    <ShieldCheck
                      size={18}
                      aria-hidden
                      style={{ color: c.inzage_toestemming ? 'var(--mf-green)' : 'var(--text-4)', flexShrink: 0, marginTop: 1, transition: 'color 0.2s var(--ease)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
                        Deel mijn welzijnsdata met {voornaam}
                      </p>
                      <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
                        Je coach ziet dan je check-ins, welzijnsprofiel en voortgang. Je kunt dit altijd weer intrekken.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={c.inzage_toestemming}
                      aria-label={`Inzage voor ${c.coach_naam} ${c.inzage_toestemming ? 'aan' : 'uit'}`}
                      disabled={bezigNu}
                      onClick={() => zetToestemming(c.coach_id, !c.inzage_toestemming)}
                      className="mf-coach-switch"
                      data-aan={c.inzage_toestemming ? 'true' : 'false'}
                      style={{ cursor: bezigNu ? 'wait' : 'pointer', opacity: bezigNu ? 0.7 : 1 }}
                    >
                      <span className="knop" />
                    </button>
                  </div>

                  {/* Koppeling beëindigen */}
                  <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => beeindig(c.coach_id, c.coach_naam)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--mf-red)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600, borderRadius: 6 }}
                    >
                      <Unlink size={14} aria-hidden /> Koppeling beëindigen
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
