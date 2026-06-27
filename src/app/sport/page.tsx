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
import { getActiviteit } from '@/lib/activiteiten'
import { DOEL_CONFIG, type FitnessDoel } from '@/lib/gezondheid-berekeningen'

const ACT = getActiviteit('fysiek')

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

const NIVEAU_KLEUR: Record<string, string> = {
  beginner: '#10B981',
  gemiddeld: '#F59E0B',
  gevorderd: '#EF4444',
}

const SPIERKLEUR: Record<string, string> = {
  borst: '#EF4444', schouders: '#F97316', triceps: '#F59E0B',
  rug: '#3B82F6', biceps: '#6366F1', benen: '#8B5CF6',
  billen: '#EC4899', core: '#10B981', kuiten: '#06B6D4',
}

function spierKleur(s: string): string {
  const lc = s.toLowerCase()
  for (const [k, v] of Object.entries(SPIERKLEUR)) {
    if (lc.includes(k)) return v
  }
  return '#6B7280'
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SportPagina() {
  const router = useRouter()
  const [laden, setLaden]                       = useState(true)
  const [schema, setSchema]                     = useState<FitnessSchema | null>(null)
  const [logs, setLogs]                         = useState<TrainingLog[]>([])
  const [trainingsDezeWeek, setTrainingsDezeWeek] = useState(0)
  const [fitnessDoel, setFitnessDoel]           = useState<FitnessDoel | null>(null)

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
      <div className="mf-spinner" />
    </div>
  )

  const niveauKleur = NIVEAU_KLEUR[schema?.niveau ?? ''] ?? '#10B981'

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <Navbar />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${ACT.kleur}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={22} strokeWidth={1.8} style={{ color: ACT.kleur }} />
          </div>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACT.kleur, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: ACT.kleur, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ACT.label}</span>
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>Sport & Fitness</h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>Jouw trainingen deze week</p>
          </div>
          {fitnessDoel && DOEL_CONFIG[fitnessDoel] && (
            <span style={{
              marginLeft: 'auto', alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 20,
              color: DOEL_CONFIG[fitnessDoel].kleur,
              background: `color-mix(in srgb, ${DOEL_CONFIG[fitnessDoel].kleur} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${DOEL_CONFIG[fitnessDoel].kleur} 35%, transparent)`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOEL_CONFIG[fitnessDoel].kleur, flexShrink: 0 }} />
              {DOEL_CONFIG[fitnessDoel].label}
            </span>
          )}
        </div>

        {/* ── Geen schema: CTA ── */}
        {!schema ? (
          <Link href="/sport/genereer" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
            <div style={{
              background: 'linear-gradient(135deg, #1D9E75, #059669)',
              borderRadius: 20, padding: '28px 24px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <Sparkles size={28} strokeWidth={1.5} style={{ color: 'white', marginBottom: 12 }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>Maak jouw AI-schema</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 18 }}>
                Gepersonaliseerd op jouw doel, niveau en beschikbare tijd.
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#059669', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 12 }}>
                <Sparkles size={15} /> Genereer schema
              </div>
            </div>
          </Link>
        ) : (
          <>
            {/* ── Schema hero ── */}
            <div style={{
              background: 'linear-gradient(135deg, #1D9E75 0%, #14795a 100%)',
              borderRadius: 20, padding: '22px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>ACTIEF SCHEMA</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{schema.naam}</div>
                </div>
                <span style={{ background: niveauKleur + '33', color: niveauKleur, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${niveauKleur}55`, textTransform: 'capitalize' }}>
                  {schema.niveau}
                </span>
              </div>

              {/* Voortgang */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Voortgang deze week</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{trainingsDezeWeek}/{schema.sessies_per_week}×</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'white', width: `${Math.min(100, (trainingsDezeWeek / schema.sessies_per_week) * 100)}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>

              <Link href="/sport/training" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#14795a', fontWeight: 700, fontSize: 14, padding: '11px 20px', borderRadius: 12 }}>
                  <Play size={14} fill="#14795a" /> Training starten
                </div>
              </Link>
            </div>

            {/* ── Training dagkaarten ── */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 10px' }}>Jouw schema</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {schema.schema_json.map((dag, i) => (
                  <Link key={i} href="/sport/training" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      transition: 'border-color 0.12s',
                    }}>
                      {/* Dag-nummer cirkel */}
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--mf-green)' }}>{dag.dag}</span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 5, letterSpacing: '-0.01em' }}>
                          {dag.naam}
                        </div>
                        {/* Spiergroep pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {dag.spiergroepen.map((sg, si) => {
                            const kleur = spierKleur(sg)
                            return (
                              <span key={si} style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                background: kleur + '18', color: kleur,
                                border: `1px solid ${kleur}30`,
                              }}>
                                {sg}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Meta rechts */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-4)' }}>
                          <Clock size={10} />
                          {dag.geschatte_duur} min
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-4)' }}>
                          <Dumbbell size={10} />
                          {dag.oefeningen.length} oef.
                        </div>
                      </div>
                      <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Stats strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Deze week', waarde: trainingsDezeWeek, icon: <Flame size={14} />, kleur: '#F97316' },
            { label: 'Totaal', waarde: logs.length, icon: <BarChart2 size={14} />, kleur: '#8B5CF6' },
            { label: 'Per week', waarde: schema ? `${schema.sessies_per_week}×` : '—', icon: <Calendar size={14} />, kleur: '#06B6D4' },
          ].map(({ label, waarde, icon, kleur }) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 12px' }}>
              <div style={{ color: kleur, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{waarde}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Recente trainingen ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Recente trainingen</span>
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{logs.length} sessies</span>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Dumbbell size={32} strokeWidth={1.2} style={{ color: 'var(--text-4)', marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Nog geen trainingen</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>Start je eerste training!</div>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Flame size={16} strokeWidth={1.8} style={{ color: '#F97316' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.naam ?? 'Training'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{fmtDatum(log.datum)}</div>
                </div>
                {log.duur_minuten && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>
                    <Clock size={11} />
                    {log.duur_minuten} min
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Acties ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { href: '/sport/genereer', label: 'Nieuw schema', sub: 'AI-gegenereerd', icon: <Sparkles size={18} />, kleur: '#10B981' },
            { href: '/sport/voortgang', label: 'Voortgang', sub: 'Statistieken', icon: <TrendingUp size={18} />, kleur: '#8B5CF6' },
            { href: '/sport/oefeningen', label: 'Oefeningen', sub: 'Bibliotheek', icon: <Dumbbell size={18} />, kleur: '#F97316' },
            { href: '/sport/training', label: 'Training starten', sub: 'Direct beginnen', icon: <Zap size={18} />, kleur: '#EF4444' },
          ].map(({ href, label, sub, icon, kleur }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: kleur + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: kleur }}>
                  {icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
