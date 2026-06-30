'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import {
  Dumbbell, Flame, Clock, ChevronRight, Sparkles, Play,
  TrendingUp, Calendar, BarChart2, Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { DOEL_CONFIG, type FitnessDoel } from '@/lib/gezondheid-berekeningen'

// ── Types ────────────────────────────────────────────────────────────────────

type Oefening = {
  naam: string
  naam_en?: string
  sets: number
  herhalingen: string
  heeft_gewicht?: boolean
}

type Trainingsdag = {
  dag: number
  naam: string
  spiergroepen: string[]
  coaching_tekst: string
  geschatte_duur: number
  oefeningen: Oefening[]
}

type FitnessSchema = {
  id: string
  naam: string
  doel: string
  niveau: string
  sessies_per_week: number
  schema_json: Trainingsdag[]
}

type TrainingLog = {
  id: string
  datum: string
  naam: string | null
  duur_minuten: number | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDatum(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function beginVanWeek(): string {
  const nu = new Date()
  const diff = nu.getDay() === 0 ? 6 : nu.getDay() - 1
  const ma = new Date(nu)
  ma.setDate(nu.getDate() - diff)
  return ma.toISOString().split('T')[0]
}

// Niveau → status-token (data/status-kleur, geen decoratief gebruik).
type NiveauTone = { kleur: string; achtergrond: string; rand: string }
const NIVEAU_TONE: Record<string, NiveauTone> = {
  beginner:  { kleur: 'var(--mf-green)', achtergrond: 'var(--mf-green-light)', rand: 'color-mix(in srgb, var(--mf-green) 35%, transparent)' },
  gemiddeld: { kleur: 'var(--mf-amber)', achtergrond: 'var(--mf-amber-light)', rand: 'color-mix(in srgb, var(--mf-amber) 35%, transparent)' },
  gevorderd: { kleur: 'var(--mf-red)',   achtergrond: 'var(--mf-red-light)',   rand: 'color-mix(in srgb, var(--mf-red) 35%, transparent)' },
}
const NIVEAU_FALLBACK: NiveauTone = { kleur: 'var(--text-2)', achtergrond: 'var(--bg-subtle)', rand: 'var(--border-strong)' }

// ── Component ────────────────────────────────────────────────────────────────

export default function SportPagina() {
  const router = useRouter()
  const [laden, setLaden]                       = useState(true)
  const [schema, setSchema]                     = useState<FitnessSchema | null>(null)
  const [logs, setLogs]                         = useState<TrainingLog[]>([])
  const [trainingsDezeWeek, setTrainingsDezeWeek] = useState(0)
  const [fitnessDoel, setFitnessDoel]           = useState<FitnessDoel | null>(null)

  // 0 = maandag … 6 = zondag; roteert over de schemadagen
  const vandaagDagIndex = schema
    ? ((new Date().getDay() + 6) % 7) % schema.schema_json.length
    : -1

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [schemaRes, logsRes, weekRes, profielRes] = await Promise.all([
        supabase.from('fitness_schemas')
          .select('id, naam, doel, niveau, sessies_per_week, schema_json')
          .eq('user_id', user.id).eq('actief', true)
          .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('training_logs')
          .select('id, datum, naam, duur_minuten')
          .eq('user_id', user.id).order('datum', { ascending: false }).limit(10),
        supabase.from('training_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('datum', beginVanWeek()),
        supabase.from('profiles')
          .select('fitness_doel')
          .eq('id', user.id).maybeSingle(),
      ])

      setSchema(schemaRes.data ?? null)
      setLogs(logsRes.data ?? [])
      setTrainingsDezeWeek(weekRes.count ?? 0)
      setFitnessDoel((profielRes.data?.fitness_doel as FitnessDoel | null) ?? null)
      setLaden(false)
    }
    laad()
  }, [router])

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mf-spinner" role="status" aria-label="Laden" />
    </div>
  )

  const niveauTone = NIVEAU_TONE[schema?.niveau ?? ''] ?? NIVEAU_FALLBACK
  const weekPct = schema ? Math.min(100, (trainingsDezeWeek / schema.sessies_per_week) * 100) : 0

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <Navbar />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--mentaforce-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={22} strokeWidth={1.8} style={{ color: 'var(--mentaforce-primary)' }} aria-hidden />
          </div>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mentaforce-primary)', flexShrink: 0 }} aria-hidden />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mentaforce-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fysiek</span>
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>Sport & Fitness</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Jouw trainingen deze week</p>
          </div>
          {fitnessDoel && DOEL_CONFIG[fitnessDoel] && (
            <Badge variant="neutral" style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOEL_CONFIG[fitnessDoel].kleur, flexShrink: 0 }} aria-hidden />
              {DOEL_CONFIG[fitnessDoel].label}
            </Badge>
          )}
        </header>

        {/* ── Geen schema: CTA ── */}
        {!schema ? (
          <Link href="/sport/genereer" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
            <Card interactive style={{
              padding: '28px 24px', position: 'relative', overflow: 'hidden',
              borderColor: 'color-mix(in srgb, var(--mentaforce-primary) 30%, var(--border))',
            }}>
              <div aria-hidden style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'var(--mentaforce-primary-light)' }} />
              <Sparkles size={28} strokeWidth={1.5} style={{ color: 'var(--mentaforce-primary)', marginBottom: 12, position: 'relative' }} aria-hidden />
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6, position: 'relative' }}>Maak jouw AI-schema</div>
              <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 18, position: 'relative' }}>
                Gepersonaliseerd op jouw doel, niveau en beschikbare tijd.
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 'var(--radius-btn)', position: 'relative' }}>
                <Sparkles size={15} aria-hidden /> Genereer schema
              </div>
            </Card>
          </Link>
        ) : (
          <>
            {/* ── Schema hero ── */}
            <Card style={{ padding: '22px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              <div aria-hidden style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, var(--mentaforce-primary-light) 0%, transparent 70%)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
                <div>
                  <div className="mf-overline" style={{ marginBottom: 4 }}>Actief schema</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{schema.naam}</div>
                </div>
                <span style={{ background: niveauTone.achtergrond, color: niveauTone.kleur, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${niveauTone.rand}`, textTransform: 'capitalize' }}>
                  {schema.niveau}
                </span>
              </div>

              {/* Voortgang */}
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <Progress
                  value={weekPct}
                  label={`Voortgang deze week`}
                  ariaLabel={`Voortgang deze week: ${trainingsDezeWeek} van ${schema.sessies_per_week} trainingen`}
                  thickness={6}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{trainingsDezeWeek}/{schema.sessies_per_week}×</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
                <Link href="/sport/training" style={{ textDecoration: 'none' }}>
                  <div className="mf-pressable" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', fontWeight: 700, fontSize: 14, padding: '11px 20px', borderRadius: 'var(--radius-btn)' }}>
                    <Play size={14} fill="currentColor" aria-hidden /> Training starten
                  </div>
                </Link>
                <Link href="/sport/genereer" style={{ textDecoration: 'none' }}>
                  <div className="mf-pressable" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-subtle)', color: 'var(--text-1)', fontWeight: 600, fontSize: 13, padding: '11px 16px', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-strong)' }}>
                    <Sparkles size={13} aria-hidden /> Wijzig plan
                  </div>
                </Link>
              </div>
            </Card>

            {/* ── Training dagkaarten ── */}
            <section style={{ marginBottom: 20 }}>
              <h2 className="mf-overline" style={{ margin: '0 0 10px' }}>Jouw schema</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {schema.schema_json.map((dag, i) => {
                  const isVandaag = i === vandaagDagIndex
                  return (
                    <Link key={i} href="/sport/training" style={{ textDecoration: 'none' }}>
                      <Card interactive style={{
                        background: isVandaag ? 'var(--mentaforce-primary-light)' : 'var(--bg-card)',
                        borderColor: isVandaag ? 'var(--mentaforce-primary)' : 'var(--border)',
                        borderWidth: 1.5, borderStyle: 'solid',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        position: 'relative',
                      }}>
                        {isVandaag && (
                          <Badge variant="accent" style={{ position: 'absolute', top: 10, right: 44, fontSize: 9, padding: '2px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Vandaag</Badge>
                        )}

                        {/* Dag-nummer cirkel */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: 'var(--mentaforce-primary-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--mentaforce-primary)' }}>{dag.dag}</span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, letterSpacing: '-0.01em' }}>
                            {dag.naam}
                          </div>
                          {/* Spiergroep pills */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: dag.oefeningen.length > 0 ? 5 : 0 }}>
                            {dag.spiergroepen.map((sg, si) => (
                              <span key={si} style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border)',
                              }}>
                                {sg}
                              </span>
                            ))}
                          </div>
                          {/* Oefeningen preview */}
                          {dag.oefeningen.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {dag.oefeningen.slice(0, 2).map(o => o.naam).join(' · ')}
                              {dag.oefeningen.length > 2 && ` +${dag.oefeningen.length - 2}`}
                            </div>
                          )}
                        </div>

                        {/* Meta rechts */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)' }}>
                            <Clock size={10} aria-hidden />
                            {dag.geschatte_duur} min
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)' }}>
                            <Dumbbell size={10} aria-hidden />
                            {dag.oefeningen.length} oef.
                          </div>
                        </div>
                        <ChevronRight size={14} strokeWidth={2} style={{ color: isVandaag ? 'var(--mentaforce-primary)' : 'var(--text-4)', flexShrink: 0 }} aria-hidden />
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {/* ── Stats strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Deze week', waarde: trainingsDezeWeek, icon: <Flame size={14} aria-hidden />, kleur: 'var(--mf-orange)' },
            { label: 'Totaal', waarde: logs.length, icon: <BarChart2 size={14} aria-hidden />, kleur: 'var(--mf-purple)' },
            { label: 'Per week', waarde: schema ? `${schema.sessies_per_week}×` : '—', icon: <Calendar size={14} aria-hidden />, kleur: 'var(--mf-blue)' },
          ].map(({ label, waarde, icon, kleur }) => (
            <Card key={label} style={{ padding: '14px 12px' }}>
              <div style={{ color: kleur, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{waarde}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginTop: 2 }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* ── Recente trainingen ── */}
        <Card style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Recente trainingen</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{logs.length} sessies</span>
          </div>

          {logs.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="Nog geen trainingen"
              description="Start je eerste training!"
            />
          ) : (
            logs.map((log, i) => (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--mf-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Flame size={16} strokeWidth={1.8} style={{ color: 'var(--mf-orange)' }} aria-hidden />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.naam ?? 'Training'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{fmtDatum(log.datum)}</div>
                </div>
                {log.duur_minuten && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
                    <Clock size={11} aria-hidden />
                    {log.duur_minuten} min
                  </div>
                )}
              </div>
            ))
          )}
        </Card>

        {/* ── Acties ── */}
        <nav aria-label="Sport-acties" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { href: '/sport/genereer', label: 'Nieuw schema', sub: 'AI-gegenereerd', icon: <Sparkles size={18} aria-hidden /> },
            { href: '/sport/voortgang', label: 'Voortgang', sub: 'Statistieken', icon: <TrendingUp size={18} aria-hidden /> },
            { href: '/sport/oefeningen', label: 'Oefeningen', sub: 'Bibliotheek', icon: <Dumbbell size={18} aria-hidden /> },
            { href: '/sport/training', label: 'Training starten', sub: 'Direct beginnen', icon: <Zap size={18} aria-hidden /> },
          ].map(({ href, label, sub, icon }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <Card interactive style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--mentaforce-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--mentaforce-primary)' }}>
                  {icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>
                </div>
              </Card>
            </Link>
          ))}
        </nav>

      </main>
    </div>
  )
}
