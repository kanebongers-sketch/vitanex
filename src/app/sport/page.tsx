'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

type Trainingsdag = {
  dag: number
  naam: string
  spiergroepen: string[]
  coaching_tekst: string
  geschatte_duur: number
  oefeningen: Array<{
    naam: string
    sets: number
    herhalingen: string
    rusttijd_sec: number
    gewicht_tip: string
    uitvoering_tip: string
  }>
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

function fmtDatum(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function beginVanWeek(): string {
  const nu = new Date()
  const dag = nu.getDay()
  const diff = dag === 0 ? 6 : dag - 1
  const maandag = new Date(nu)
  maandag.setDate(nu.getDate() - diff)
  return maandag.toISOString().split('T')[0]
}

const NIVEAU_HEX: Record<string, string> = {
  gevorderd: '#E24B4A',
  gemiddeld: '#BA7517',
}

function NiveauBadge({ niveau }: { niveau: string }) {
  const kleur = NIVEAU_HEX[niveau] ?? '#1D9E75'
  return (
    <span style={{
      backgroundColor: kleur + '1A',
      color: kleur,
      fontSize: 12,
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: 20,
      textTransform: 'capitalize' as const,
    }}>{niveau}</span>
  )
}

function StatKaart({ label, waarde, icoon }: { label: string; waarde: string | number; icoon: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card, #FFFFFF)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ color: 'var(--text-4)' }}>{icoon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{waarde}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function SnelleActie({ href, label, icoon, kleur }: { href: string; label: string; icoon: React.ReactNode; kleur: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: kleur + '1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: kleur,
        }}>{icoon}</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{label}</span>
        <svg style={{ marginLeft: 'auto', color: 'var(--text-4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}

export default function SportPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [schema, setSchema] = useState<FitnessSchema | null>(null)
  const [logs, setLogs] = useState<TrainingLog[]>([])
  const [trainingsDezeWeek, setTrainingsDezeWeek] = useState(0)

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const weekStart = beginVanWeek()

      const [schemaRes, logsRes, weekRes] = await Promise.all([
        supabase
          .from('fitness_schemas')
          .select('id, naam, doel, niveau, sessies_per_week, schema_json')
          .eq('user_id', user.id)
          .eq('actief', true)
          .order('aangemaakt_op', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('training_logs')
          .select('id, datum, naam, duur_minuten')
          .eq('user_id', user.id)
          .order('datum', { ascending: false })
          .limit(5),
        supabase
          .from('training_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('datum', weekStart),
      ])

      setSchema(schemaRes.data ?? null)
      setLogs(logsRes.data ?? [])
      setTrainingsDezeWeek(weekRes.count ?? 0)
      setLaden(false)
    }
    laadData()
  }, [router])

  if (laden) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app, #F4F6F8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="mf-spinner" />
      </div>
    )
  }

  const totaleLogs = logs.length
  const laatsteDatum = logs[0]?.datum ? fmtDatum(logs[0].datum) : 'Nog niet getraind'

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app, #F4F6F8)', paddingBottom: 72 }}>
      <Navbar />

      <div style={{ padding: '28px 20px', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Sport & Fitness</h1>
          <p style={{ color: 'var(--text-3)', marginTop: 4, fontSize: 15 }}>Beheer je trainingen en schema</p>
        </div>

        {!schema ? (
          <div style={{
            backgroundColor: '#F97316',
            borderRadius: 20,
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 160, height: 160,
              borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)',
            }} />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M7 4l-3 8 3 8M17 4l3 8-3 8" strokeLinecap="round" />
            </svg>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>Start jouw fitnessreis</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
                Laat AI een gepersonaliseerd schema voor jou maken op basis van jouw doelen en niveau.
              </div>
            </div>
            <Link href="/sport/genereer" style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white',
                color: '#F97316',
                fontWeight: 700,
                fontSize: 15,
                padding: '12px 24px',
                borderRadius: 12,
                display: 'inline-block',
              }}>
                Genereer jouw AI fitnessschema →
              </div>
            </Link>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #1D9E75 0%, #14795a 100%)',
            borderRadius: 20,
            padding: '28px 24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 180, height: 180,
              borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>ACTIEF SCHEMA</div>
                <div style={{ fontSize: 21, fontWeight: 800 }}>{schema.naam}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{schema.doel}</div>
              </div>
              <NiveauBadge niveau={schema.niveau} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{schema.sessies_per_week}×</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>per week</div>
              </div>
              <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{trainingsDezeWeek}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>gedaan deze week</div>
              </div>
            </div>
            <Link href="/sport/training" style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white',
                color: '#1D9E75',
                fontWeight: 700,
                fontSize: 15,
                padding: '12px 24px',
                borderRadius: 12,
                display: 'inline-block',
              }}>
                Training starten →
              </div>
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <StatKaart
            label="Trainingen deze week"
            waarde={trainingsDezeWeek}
            icoon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
            }
          />
          <StatKaart
            label="Trainingen totaal"
            waarde={totaleLogs >= 5 ? '5+' : totaleLogs}
            icoon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
          />
          <StatKaart
            label="Sessies per week"
            waarde={schema?.sessies_per_week ?? '—'}
            icoon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
            }
          />
          <StatKaart
            label="Laatste training"
            waarde={laatsteDatum}
            icoon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16" strokeLinecap="round" />
              </svg>
            }
          />
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card, #FFFFFF)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Recente trainingen</h2>
            <Link href="/sport/geschiedenis" style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>
              Bekijk alle →
            </Link>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💪</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>Nog geen trainingen geregistreerd</div>
              <div style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 4 }}>Start je eerste training en schrijf geschiedenis!</div>
            </div>
          ) : (
            <div>
              {logs.map((log, i) => (
                <div key={log.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  borderTop: i === 0 ? '1px solid var(--border)' : undefined,
                  borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : undefined,
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#F97316' + '1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                      <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.naam ?? 'Training'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 1 }}>{fmtDatum(log.datum)}</div>
                  </div>
                  {log.duur_minuten && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0 }}>
                      {log.duur_minuten} min
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Snelle acties</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <SnelleActie
              href="/sport/genereer"
              label="AI Schema genereren"
              kleur="#1D9E75"
              icoon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              }
            />
            <SnelleActie
              href="/sport/training"
              label="Training starten"
              kleur="#F97316"
              icoon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              }
            />
            <SnelleActie
              href="/sport/voortgang"
              label="Voortgang bekijken"
              kleur="#8B5CF6"
              icoon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
            <SnelleActie
              href="/sport/oefeningen"
              label="Oefeningen bekijken"
              kleur="#EC4899"
              icoon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </div>

      </div>
    </div>
  )
}
