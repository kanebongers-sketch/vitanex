'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface Achievement {
  behaald_op: string
  achievements: {
    slug: string
    naam: string
    icon: string
    xp_beloning: number
    categorie: string
    beschrijving: string
  }
}

const CAT_LABELS: Record<string, string> = {
  'check-in': 'Check-ins',
  coaching: 'Coaching',
  sport: 'Sport',
  voeding: 'Voeding',
  streak: 'Streaks',
  team: 'Team',
  mijlpaal: 'Mijlpalen',
}

const CAT_KLEUREN: Record<string, string> = {
  'check-in': '#185FA5',
  coaching: '#7C3AED',
  sport: '#B45309',
  voeding: '#059669',
  streak: '#EA580C',
  team: '#0369A1',
  mijlpaal: '#9D174D',
}

export default function AchievementsPagina() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [laden, setLaden] = useState(true)
  const [totaalXP, setTotaalXP] = useState(0)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      try {
        const res = await authFetch('/api/achievements/check')
        if (res.ok) {
          const json = await res.json() as { achievements: Achievement[] }
          const lijst = json.achievements ?? []
          setAchievements(lijst)
          setTotaalXP(lijst.reduce((sum, a) => sum + (a.achievements?.xp_beloning ?? 0), 0))
        }
      } catch { /* niet-kritiek */ }
      setLaden(false)
    }
    laad()
  }, [router])

  const groeperenOpCategorie = () => {
    const map = new Map<string, Achievement[]>()
    for (const a of achievements) {
      const cat = a.achievements?.categorie ?? 'overig'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(a)
    }
    return map
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  const perCategorie = groeperenOpCategorie()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Prestaties
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>
            {achievements.length} behaald · {totaalXP} XP verdiend
          </p>
        </header>

        {achievements.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 20, padding: '48px 24px',
            border: '2px dashed #E5E7EB', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              Nog geen prestaties behaald
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.55 }}>
              Doe check-ins, gebruik de AI Coach en log trainingen om je eerste badges te verdienen.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Array.from(perCategorie.entries()).map(([cat, items]) => {
              const kleur = CAT_KLEUREN[cat] ?? '#9CA3AF'
              return (
                <section key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: kleur }} />
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: kleur }}>
                      {CAT_LABELS[cat] ?? cat} ({items.length})
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(a => (
                      <article key={a.achievements.slug} style={{
                        background: 'white', borderRadius: 14, padding: '14px 16px',
                        border: `1.5px solid ${kleur}20`,
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: `${kleur}12`, border: `1.5px solid ${kleur}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: 22,
                        }}>
                          {a.achievements.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                            {a.achievements.naam}
                          </p>
                          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, lineHeight: 1.4 }}>
                            {a.achievements.beschrijving}
                          </p>
                          <p style={{ fontSize: 10, color: '#9CA3AF' }}>
                            {new Date(a.behaald_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: kleur }}>{a.achievements.xp_beloning}</p>
                          <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>XP</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
