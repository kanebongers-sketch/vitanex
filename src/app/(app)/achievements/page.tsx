'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { berekenLevel, LEVEL_NAMEN, xpVoortgang, laadXPData } from '@/lib/xp'
import { laadXPVanServer } from '@/lib/xp-sync'
import VitaVoortgangViering from '@/components/vita/VitaVoortgangViering'


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
  streak:     'var(--mf-amber)',
  team:       'var(--mf-blue)',
  mijlpaal:   'var(--mf-red)',
}

export default function AchievementsPagina() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [laden, setLaden] = useState(true)
  // Eén canonieke voortgang: de Fit Level-XP uit user_xp (dezelfde als /niveau).
  const [fitXP, setFitXP] = useState(0)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Toon direct de lokale Fit-XP; de server overschrijft zo nodig.
      setFitXP(laadXPData().xp)

      try {
        // Eerst awarden: de server berekent op basis van echte statistieken
        // welke achievements behaald zijn en kent ze toe (+ XP naar je Fit Level).
        // Faalt dit zacht, dan tonen we gewoon de reeds behaalde lijst.
        await authFetch('/api/achievements/check', { method: 'POST' }).catch(() => {})
        const res = await authFetch('/api/achievements/check')
        if (res.ok) {
          const json = await res.json() as { achievements: Achievement[] }
          setAchievements(json.achievements ?? [])
        }
      } catch { /* niet-kritiek */ }

      // Fit Level-XP als bron van waarheid ophalen — ná het awarden, dus incl. de
      // zojuist toegekende achievement-XP.
      const server = await laadXPVanServer()
      if (server) setFitXP(server.xp)

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
  const niveau = berekenLevel(fitXP)
  const niveauNaam = LEVEL_NAMEN[niveau] ?? 'Starter'
  const vg = xpVoortgang(fitXP, niveau)

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

        {/* Vita erkent je badges (echte behaalde-status uit de server) */}
        <div style={{ marginBottom: 20 }}>
          <VitaVoortgangViering variant="badges" behaald={achievements.length} />
        </div>

        {/* Fit Level card — dezelfde bron als /niveau (user_xp.xp) */}
        <Card style={{ padding: 20, marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-md)',
              background: 'var(--mentaforce-primary-light)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--mentaforce-primary)', flexShrink: 0,
            }}>
              <Award size={28} aria-hidden />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 2px' }}>
                Fit Level {niveau}
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                {niveauNaam}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                {fitXP} XP · {achievements.length} badges
              </p>
            </div>
          </div>

          {/* Level voortgangsbalk */}
          <Progress
            value={vg.pct}
            ariaLabel={`Voortgang naar het volgende niveau: ${vg.pct}%`}
            color="var(--mentaforce-primary)"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>
              {fitXP} XP
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>
              {niveau >= 10 ? 'Max niveau!' : `nog ${vg.nodig} XP tot Fit Level ${niveau + 1}`}
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
