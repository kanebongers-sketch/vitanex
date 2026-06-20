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

// Alle mogelijke achievements — behaalde worden opgezocht, rest wordt vergrendeld getoond
const ALLE_ACHIEVEMENTS = [
  { slug: 'eerste-checkin',    naam: 'Eerste check-in',    icon: '📋', xp_beloning: 50,  categorie: 'check-in', beschrijving: 'Voltooi je allereerste wekelijkse check-in.' },
  { slug: 'week-streak',       naam: 'Week op rij',         icon: '🔥', xp_beloning: 75,  categorie: 'streak',   beschrijving: '7 dagen actief op MentaForce.' },
  { slug: 'maand-streak',      naam: 'Maand streak',        icon: '⚡', xp_beloning: 200, categorie: 'streak',   beschrijving: '30 dagen ononderbroken actief.' },
  { slug: 'vijf-checkins',     naam: '5 check-ins',         icon: '✅', xp_beloning: 100, categorie: 'check-in', beschrijving: 'Voltooi 5 wekelijkse check-ins.' },
  { slug: 'coach-start',       naam: 'Coach debuut',        icon: '🤝', xp_beloning: 50,  categorie: 'coaching', beschrijving: 'Start je eerste gesprek met de AI Coach.' },
  { slug: 'team-player',       naam: 'Team speler',         icon: '👥', xp_beloning: 75,  categorie: 'team',     beschrijving: 'Stuur je eerste teambericht.' },
  { slug: 'beweger',           naam: 'Beweger',             icon: '🏃', xp_beloning: 50,  categorie: 'sport',    beschrijving: 'Log 3 sportactiviteiten in één week.' },
  { slug: 'dankbaar',          naam: 'Dankbaar hart',       icon: '💚', xp_beloning: 50,  categorie: 'voeding',  beschrijving: 'Schrijf 5 dankbaarheidsmomenten.' },
  { slug: 'honderd-dagen',     naam: 'Centurion',           icon: '🏆', xp_beloning: 500, categorie: 'mijlpaal', beschrijving: '100 dagen actief op het platform.' },
  { slug: 'perfect-week',      naam: 'Perfecte week',       icon: '⭐', xp_beloning: 150, categorie: 'mijlpaal', beschrijving: 'Log elke dag van de week een activiteit.' },
]

const CAT_LABELS: Record<string, string> = {
  'check-in': 'Check-ins',
  coaching: 'Coaching',
  sport: 'Sport',
  voeding: 'Voeding',
  streak: 'Streaks',
  team: 'Team',
  mijlpaal: 'Mijlpalen',
}

const CAT_KLEUREN: Record<string, { kleur: string; bg: string; rand: string }> = {
  'check-in': { kleur: '#185FA5', bg: '#EFF6FF', rand: '#BFDBFE' },
  coaching:   { kleur: '#7C3AED', bg: '#EDE9FE', rand: '#C4B5FD' },
  sport:      { kleur: '#B45309', bg: '#FEF3C7', rand: '#FCD34D' },
  voeding:    { kleur: '#059669', bg: '#D1FAE5', rand: '#6EE7B7' },
  streak:     { kleur: '#EA580C', bg: '#FFF7ED', rand: '#FED7AA' },
  team:       { kleur: '#0369A1', bg: '#E0F2FE', rand: '#7DD3FC' },
  mijlpaal:   { kleur: '#9D174D', bg: '#FDF2F8', rand: '#F9A8D4' },
}

export default function AchievementsPagina() {
  const router = useRouter()
  const [behaaldeSlugs, setBehaaldeSlugs] = useState<Set<string>>(new Set())
  const [behaaldeMeta, setBehaaldeMeta] = useState<Record<string, string>>({}) // slug → behaald_op
  const [totaalXP, setTotaalXP] = useState(0)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      try {
        const res = await authFetch('/api/achievements/check')
        if (res.ok) {
          const json = await res.json() as { achievements: Achievement[] }
          const lijst = json.achievements ?? []
          const slugSet = new Set(lijst.map(a => a.achievements?.slug))
          const meta: Record<string, string> = {}
          let xp = 0
          for (const a of lijst) {
            meta[a.achievements?.slug] = a.behaald_op
            xp += a.achievements?.xp_beloning ?? 0
          }
          setBehaaldeSlugs(slugSet)
          setBehaaldeMeta(meta)
          setTotaalXP(xp)
        }
      } catch { /* niet-kritiek */ }
      setLaden(false)
    }
    laad()
  }, [router])

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  const aantalBehaald = behaaldeSlugs.size
  const groeperenOpCategorie = () => {
    const map = new Map<string, typeof ALLE_ACHIEVEMENTS>()
    for (const a of ALLE_ACHIEVEMENTS) {
      const cat = a.categorie
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(a)
    }
    return map
  }
  const perCategorie = groeperenOpCategorie()

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1, #111827)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Prestaties
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-3, #9CA3AF)' }}>
              {aantalBehaald} van {ALLE_ACHIEVEMENTS.length} behaald
            </p>
            {totaalXP > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--mf-orange-light, #FFF7ED), var(--mf-orange-soft, #FFEDD5))',
                color: 'var(--mf-orange, #EA580C)',
                border: '1px solid var(--mf-orange-border, #FED7AA)',
                borderRadius: 20, padding: '3px 10px',
              }}>
                ⚡ {totaalXP} XP
              </span>
            )}
          </div>

          {/* Voortgangsbalk */}
          <div style={{ marginTop: 12, height: 6, background: 'var(--border, rgba(0,0,0,0.07))', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.round(aantalBehaald / ALLE_ACHIEVEMENTS.length * 100)}%`,
              background: 'linear-gradient(90deg, var(--mf-green-dark, #0F6E56), var(--mf-green, #1D9E75))',
              borderRadius: 9999,
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </header>

        {aantalBehaald === 0 ? (
          <div style={{
            background: 'var(--bg-card, white)', borderRadius: 20, padding: '48px 24px',
            border: '2px dashed var(--border, #E5E7EB)', textAlign: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1, #374151)', marginBottom: 8 }}>
              Nog geen prestaties behaald
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3, #9CA3AF)', lineHeight: 1.55 }}>
              Doe check-ins, gebruik de AI Coach en log trainingen om je eerste badges te verdienen.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Array.from(perCategorie.entries()).map(([cat, items]) => {
              const stijl = CAT_KLEUREN[cat] ?? { kleur: '#9CA3AF', bg: '#F3F4F6', rand: '#E5E7EB' }
              return (
                <section key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: stijl.kleur }} />
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: stijl.kleur }}>
                      {CAT_LABELS[cat] ?? cat} ({items.filter(i => behaaldeSlugs.has(i.slug)).length}/{items.length})
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(a => {
                      const bereikt = behaaldeSlugs.has(a.slug)
                      const behaaldOp = behaaldeMeta[a.slug]
                      return (
                        <article key={a.slug} style={{
                          background: bereikt ? stijl.bg : 'var(--bg-card, white)',
                          borderRadius: 14,
                          padding: '14px 16px',
                          border: bereikt ? `1.5px solid ${stijl.rand}` : '1.5px solid var(--border, rgba(0,0,0,0.07))',
                          display: 'flex', alignItems: 'center', gap: 14,
                          opacity: bereikt ? 1 : 0.5,
                          filter: bereikt ? 'none' : 'grayscale(0.5)',
                          transition: 'all 0.2s ease',
                          boxShadow: bereikt ? `0 2px 8px ${stijl.kleur}18` : 'none',
                        }}>
                          {/* Badge icoon */}
                          <div style={{
                            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                            background: bereikt ? `${stijl.kleur}18` : 'var(--bg-subtle, #F9FAFB)',
                            border: bereikt ? `1.5px solid ${stijl.kleur}30` : '1.5px solid var(--border, rgba(0,0,0,0.07))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24,
                          }}>
                            {bereikt ? a.icon : '🔒'}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: bereikt ? 'var(--text-1, #111827)' : 'var(--text-3, #9CA3AF)', marginBottom: 2 }}>
                              {a.naam}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-3, #6B7280)', marginBottom: bereikt && behaaldOp ? 4 : 0, lineHeight: 1.4 }}>
                              {a.beschrijving}
                            </p>
                            {bereikt && behaaldOp && (
                              <p style={{ fontSize: 10, color: stijl.kleur, fontWeight: 600 }}>
                                Behaald op {new Date(behaaldOp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: bereikt ? stijl.kleur : 'var(--text-4, #D1D5DB)' }}>
                              {a.xp_beloning}
                            </p>
                            <p style={{ fontSize: 9, color: bereikt ? stijl.kleur : 'var(--text-4, #D1D5DB)', fontWeight: 600 }}>XP</p>
                          </div>
                        </article>
                      )
                    })}
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
