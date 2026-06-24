'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
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

const LEVELS = [
  { min: 0,    max: 100,  naam: 'Beginner',    emoji: '🌱' },
  { min: 100,  max: 300,  naam: 'Groeier',     emoji: '🌿' },
  { min: 300,  max: 600,  naam: 'Gevorderd',   emoji: '🌳' },
  { min: 600,  max: 1000, naam: 'Expert',      emoji: '⭐' },
  { min: 1000, max: 2000, naam: 'Meester',     emoji: '🏆' },
  { min: 2000, max: Infinity, naam: 'Legende', emoji: '💎' },
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
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: '20px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 70%)' }} />
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-md)',
                background: 'var(--mf-amber-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, position: 'relative', zIndex: 1,
              }}>
                {niveau.emoji}
              </div>
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
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>
                {niveau.min} XP
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>
                {volgend ? `${volgend.min} XP — ${volgend.naam} ${volgend.emoji}` : 'Max niveau!'}
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, levelPct)}%`,
                background: 'linear-gradient(90deg, var(--mf-amber) 0%, var(--mf-amber-mid) 100%)',
                borderRadius: 100,
                transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
          </div>
        </section>

        {achievements.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '56px 24px',
            border: '2px dashed var(--border-strong)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
              Nog geen prestaties behaald
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px' }}>
              Doe check-ins, gebruik de AI Coach en log trainingen om je eerste badges te verdienen.
            </p>
            <a
              href="/vandaag"
              style={{
                display: 'inline-block',
                background: 'var(--mf-green)',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                padding: '12px 24px',
                borderRadius: 'var(--radius-btn)',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(29,158,117,0.3)',
              }}
            >
              Start vandaag →
            </a>
          </div>
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
                      <article key={a.achievements.slug} style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-xs)',
                        padding: '14px 16px',
                        border: `1.5px solid ${kleur}20`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                      }}>
                        <div style={{
                          width: 48, height: 48,
                          borderRadius: 'var(--radius-md)',
                          background: `${kleur}12`,
                          border: `1.5px solid ${kleur}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: 22,
                        }}>
                          {a.achievements.icon}
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
