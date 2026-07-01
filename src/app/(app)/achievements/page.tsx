'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Sprout, Leaf, TreeDeciduous, Star, Gem, Award, type LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'


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
  coaching:   'Coaching',
  sport:      'Sport',
  voeding:    'Voeding',
  streak:     'Streaks',
  team:       'Team',
  mijlpaal:   'Mijlpalen',
}

const CAT_KLEUREN: Record<string, string> = {
  'check-in': 'var(--mf-blue)',
  coaching:   'var(--mf-purple)',
  sport:      'var(--mf-amber-dark)',
  voeding:    'var(--mf-green)',
  streak:     'var(--mf-orange)',
  team:       'var(--mf-blue)',
  mijlpaal:   'var(--mf-rose)',
}

interface Level {
  min: number
  max: number
  naam: string
  Icon: LucideIcon
}

const LEVELS: Level[] = [
  { min: 0,    max: 100,  naam: 'Beginner',    Icon: Sprout },
  { min: 100,  max: 300,  naam: 'Groeier',     Icon: Leaf },
  { min: 300,  max: 600,  naam: 'Gevorderd',   Icon: TreeDeciduous },
  { min: 600,  max: 1000, naam: 'Expert',      Icon: Star },
  { min: 1000, max: 2000, naam: 'Meester',     Icon: Trophy },
  { min: 2000, max: Infinity, naam: 'Legende', Icon: Gem },
]

function huidigLevel(xp: number) {
  return LEVELS.find(l => xp >= l.min && xp < l.max) ?? LEVELS[LEVELS.length - 1]
}

function volgendLevel(xp: number) {
  const idx = LEVELS.findIndex(l => xp >= l.min && xp < l.max)
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
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
        // Eerst awarden: de server berekent op basis van echte statistieken
        // welke achievements behaald zijn en kent ze toe (+ XP naar je Fit Level).
        // Faalt dit zacht, dan tonen we gewoon de reeds behaalde lijst.
        await authFetch('/api/achievements/check', { method: 'POST' }).catch(() => {})
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
  const niveau = huidigLevel(totaalXP)
  const volgend = volgendLevel(totaalXP)
  const levelPct = volgend
    ? ((totaalXP - niveau.min) / (volgend.min - niveau.min)) * 100
    : 100

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', margin: '0 0 4px' }}>
            Gamificatie
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            Jouw prestaties
          </h1>
        </header>

        {/* XP Level card */}
        <Card style={{ padding: 20, marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-md)',
              background: 'var(--mf-amber-light)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--mf-amber-dark)', flexShrink: 0,
            }}>
              <niveau.Icon size={28} aria-label={`Niveau ${niveau.naam}`} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 2px' }}>
                Huidig niveau
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                {niveau.naam}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                {totaalXP} XP · {achievements.length} badges
              </p>
            </div>
          </div>

          {/* Level voortgangsbalk */}
          <Progress
            value={Math.min(100, levelPct)}
            ariaLabel={`Voortgang naar ${volgend ? volgend.naam : 'maximaal niveau'}: ${Math.round(Math.min(100, levelPct))}%`}
            color="var(--mentaforce-primary)"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>
              {niveau.min} XP
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {volgend ? (
                <>
                  {volgend.min} XP — {volgend.naam}
                  <volgend.Icon size={12} aria-hidden style={{ flexShrink: 0 }} />
                </>
              ) : 'Max niveau!'}
            </span>
          </div>
        </Card>

        {achievements.length === 0 ? (
          <Card style={{ padding: '16px 24px' }}>
            <EmptyState
              icon={Trophy}
              title="Nog geen prestaties behaald"
              description="Doe check-ins, gebruik de AI Coach en log trainingen om je eerste badges te verdienen."
              action={
                <Button onClick={() => router.push('/vandaag')}>
                  Start vandaag
                </Button>
              }
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Array.from(perCategorie.entries()).map(([cat, items]) => {
              const kleur = CAT_KLEUREN[cat] ?? 'var(--text-3)'
              return (
                <section key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: kleur }} />
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: kleur, margin: 0 }}>
                      {CAT_LABELS[cat] ?? cat} ({items.length})
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(a => (
                      <Card
                        key={a.achievements.slug}
                        style={{
                          padding: '14px 16px',
                          borderColor: `color-mix(in srgb, ${kleur} 25%, transparent)`,
                          boxShadow: 'var(--shadow-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                        }}
                      >
                        <div style={{
                          width: 48, height: 48,
                          borderRadius: 'var(--radius-md)',
                          background: `color-mix(in srgb, ${kleur} 12%, transparent)`,
                          border: `1.5px solid color-mix(in srgb, ${kleur} 25%, transparent)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, color: kleur,
                        }}>
                          <Award size={22} aria-label={a.achievements.naam} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px' }}>
                            {a.achievements.naam}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 4px', lineHeight: 1.4 }}>
                            {a.achievements.beschrijving}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-4)', margin: 0 }}>
                            {new Date(a.behaald_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: kleur, margin: 0 }}>{a.achievements.xp_beloning}</p>
                          <p style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600, margin: '2px 0 0' }}>XP</p>
                        </div>
                      </Card>
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
