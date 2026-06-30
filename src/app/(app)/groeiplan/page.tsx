'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  RefreshCw, Sparkles, Target, TrendingUp, Leaf,
  Moon, Brain, Zap, Crosshair, Scale, Flame, CalendarDays, CalendarRange, Pin,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'


interface Actie {
  actie: string
  domein: string
  termijn: string
}

interface Groeiplan {
  id: string
  periode_start: string
  doelen: string[]
  sterke_punten: string[]
  aandachtspunten: string[]
  acties: Actie[]
  aangemaakt_op: string
}

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

// Termijn → badge-variant + label + icoon (kleur is nooit de enige drager).
const TERMIJN_META: Record<string, { variant: BadgeVariant; label: string; icoon: LucideIcon }> = {
  week:     { variant: 'success', label: 'Deze week',   icoon: CalendarDays },
  maand:    { variant: 'accent',  label: 'Deze maand',  icoon: CalendarRange },
  kwartaal: { variant: 'warning', label: 'Dit kwartaal', icoon: CalendarRange },
}
const TERMIJN_VOLGORDE = ['week', 'maand', 'kwartaal']

const DOMEIN_ICOON: Record<string, LucideIcon> = {
  slaap: Moon, stress: Brain, energie: Zap, focus: Crosshair, balans: Scale, motivatie: Flame,
}

export default function GroeiplanPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [groeiplan, setGroeiplan] = useState<Groeiplan | null>(null)
  const [laden, setLaden] = useState(true)
  const [genereren, setGenereren] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/groeiplan')
      if (res.ok) {
        const json = await res.json() as { groeiplan: Groeiplan | null }
        setGroeiplan(json.groeiplan)
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function genereerNieuwPlan() {
    setGenereren(true)
    try {
      const res = await authFetch('/api/groeiplan', { method: 'POST' })
      if (!res.ok) throw new Error('Het plan kon niet gegenereerd worden.')
      const json = await res.json() as { groeiplan: Groeiplan }
      setGroeiplan(json.groeiplan)
    } catch (e) {
      toast({
        title: 'Genereren mislukt',
        description: e instanceof Error ? e.message : 'Probeer het later opnieuw.',
        variant: 'error',
      })
    } finally {
      setGenereren(false)
    }
  }

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Persoonlijk groeiplan
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
              AI-gegenereerd op basis van jouw data
            </p>
          </div>
          {groeiplan && (
            <Button
              variant="secondary"
              size="sm"
              onClick={genereerNieuwPlan}
              loading={genereren}
              leftIcon={<RefreshCw size={14} aria-hidden />}
            >
              Nieuw
            </Button>
          )}
        </header>

        {!groeiplan && !genereren ? (
          <Card style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 84, height: 84, borderRadius: '50%',
                background: 'var(--mentaforce-primary-light)',
                border: '1px solid var(--border-strong)',
              }}>
                <TrendingUp size={36} strokeWidth={1.5} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
              </span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
              Genereer jouw groeiplan
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 24 }}>
              Op basis van je check-ins, DISC-profiel en burnout-data maakt de AI een persoonlijk groeiplan voor jou.
            </p>
            <Button onClick={genereerNieuwPlan} size="lg" leftIcon={<Sparkles size={18} aria-hidden />}>
              Plan genereren
            </Button>
          </Card>
        ) : genereren ? (
          <Card style={{ padding: '32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
              <div className="mf-spinner" />
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>AI analyseert jouw data…</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Dit duurt 5-10 seconden</p>
              </div>
            </div>
            {/* Skeleton-voorbeeld van het komende plan */}
            <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton height={92} radius="var(--radius-card)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Skeleton height={120} radius="var(--radius-card)" />
                <Skeleton height={120} radius="var(--radius-card)" />
              </div>
              <Skeleton height={140} radius="var(--radius-card)" />
            </div>
          </Card>
        ) : groeiplan ? (
          <>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 20, textAlign: 'right' }}>
              Gegenereerd op {new Date(groeiplan.aangemaakt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
            </p>

            {/* Doelen */}
            <Card style={{ padding: 18, marginBottom: 14 }}>
              <p className="mf-overline" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Target size={13} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
                Mijn doelen
              </p>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(groeiplan.doelen ?? []).map((d, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span aria-hidden style={{
                      width: 22, height: 22, borderRadius: 'var(--radius-xs)',
                      background: 'var(--mentaforce-primary-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      fontSize: 11, fontWeight: 800, color: 'var(--mentaforce-primary)',
                    }}>
                      {i + 1}
                    </span>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{d}</p>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Sterke punten + Aandachtspunten */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <Card style={{ padding: 16, background: 'var(--mentaforce-primary-light)' }}>
                <p className="mf-overline" style={{ color: 'var(--mentaforce-primary)', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} aria-hidden /> Sterk
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(groeiplan.sterke_punten ?? []).map((s, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4, display: 'flex', gap: 6 }}>
                      <span aria-hidden style={{ color: 'var(--mentaforce-primary)' }}>•</span>{s}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card style={{ padding: 16, background: 'var(--mf-orange-light)' }}>
                <p className="mf-overline" style={{ color: 'var(--mf-orange)', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Leaf size={12} aria-hidden /> Groeipunten
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(groeiplan.aandachtspunten ?? []).map((a, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4, display: 'flex', gap: 6 }}>
                      <span aria-hidden style={{ color: 'var(--mf-orange)' }}>•</span>{a}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Acties — gegroepeerd per termijn */}
            {(() => {
              const groups = TERMIJN_VOLGORDE
                .map(t => ({ termijn: t, acties: (groeiplan.acties ?? []).filter(a => a.termijn === t) }))
                .filter(g => g.acties.length > 0)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {groups.map(g => {
                    const meta = TERMIJN_META[g.termijn]
                    const TermijnIcoon = meta?.icoon ?? CalendarDays
                    return (
                      <Card key={g.termijn} style={{ padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Badge variant={meta?.variant ?? 'neutral'}>
                            <TermijnIcoon size={12} aria-hidden />
                            {meta?.label ?? g.termijn}
                          </Badge>
                        </div>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {g.acties.map((a, i) => {
                            const DomeinIcoon = DOMEIN_ICOON[a.domein] ?? Pin
                            const last = i === g.acties.length - 1
                            return (
                              <li key={i} style={{
                                display: 'flex', gap: 12,
                                marginBottom: last ? 0 : 10,
                                paddingBottom: last ? 0 : 10,
                                borderBottom: last ? 'none' : '1px solid var(--border)',
                              }}>
                                <span aria-hidden style={{ flexShrink: 0, color: 'var(--text-3)', marginTop: 1 }}>
                                  <DomeinIcoon size={18} strokeWidth={1.8} />
                                </span>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.4 }}>{a.actie}</p>
                                  <Badge variant="neutral" style={{ fontSize: 10, textTransform: 'capitalize' }}>{a.domein}</Badge>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </Card>
                    )
                  })}
                </div>
              )
            })()}
          </>
        ) : null}
      </main>
    </div>
  )
}
