'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Angry, Frown, Meh, Smile, Laugh, BatteryLow, BatteryMedium, Zap, Rocket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { ActiviteitBadge } from '@/components/navigatie/ActiviteitBadge'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'
import VitaStemmingBegeleider from '@/components/vita/VitaStemmingBegeleider'

interface StemmingOptie {
  waarde: number
  emoji: string
  icoon: LucideIcon
  label: string
  kleur: string
  achtergrond: string
}

const STEMMING_OPTIES: StemmingOptie[] = [
  { waarde: 1, emoji: '😫', icoon: Angry, label: 'Slecht',   kleur: 'var(--mf-red)',       achtergrond: 'var(--mf-red-light)'    },
  { waarde: 2, emoji: '😔', icoon: Frown, label: 'Matig',    kleur: 'var(--mf-orange)',    achtergrond: 'var(--mf-amber-light)'  },
  { waarde: 3, emoji: '😐', icoon: Meh,   label: 'Neutraal', kleur: 'var(--text-3)',       achtergrond: 'var(--bg-subtle)'       },
  { waarde: 4, emoji: '🙂', icoon: Smile, label: 'Goed',     kleur: 'var(--mf-green)',     achtergrond: 'var(--mf-green-light)'  },
  { waarde: 5, emoji: '😄', icoon: Laugh, label: 'Super!',   kleur: 'var(--mf-green-dark)', achtergrond: 'var(--mf-green-light)' },
]

interface EnergieOptie {
  waarde: number
  icoon: LucideIcon
  label: string
}

const ENERGIE_OPTIES: EnergieOptie[] = [
  { waarde: 1, icoon: BatteryLow,    label: 'Leeg'   },
  { waarde: 2, icoon: BatteryMedium, label: 'Laag'   },
  { waarde: 3, icoon: Zap,           label: 'Normaal' },
  { waarde: 4, icoon: Zap,           label: 'Goed'    },
  { waarde: 5, icoon: Rocket,        label: 'Vol!'    },
]

interface StemmingLog {
  id: string
  stemming: number
  energie: number | null
  emoji: string | null
  notitie: string | null
  aangemaakt_op: string
}

function stemmingKleur(s: number): string {
  if (s >= 4) return 'var(--mf-green)'
  if (s >= 3) return 'var(--mf-orange)'
  return 'var(--mf-red)'
}

export default function StemmingPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [logs, setLogs] = useState<StemmingLog[]>([])
  const [stemming, setStemming] = useState<number>(3)
  const [energie, setEnergie] = useState<number>(3)
  const [notitie, setNotitie] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)
  // De stemming zoals die daadwerkelijk is opgeslagen — stuurt Vita's reactie.
  // Losgekoppeld van `stemming` zodat een latere kiezer-wijziging Vita niet verschuift.
  const [gelogdeStemming, setGelogdeStemming] = useState<number | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/stemming?limit=10')
      if (res.ok) {
        const json = await res.json() as { logs: StemmingLog[] }
        setLogs(json.logs ?? [])
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function verstuur() {
    setOpslaan(true)
    try {
      const res = await authFetch('/api/stemming', {
        method: 'POST',
        body: JSON.stringify({
          stemming,
          energie,
          emoji: STEMMING_OPTIES.find(o => o.waarde === stemming)?.emoji,
          notitie: notitie || undefined,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { log: StemmingLog }
        setLogs(prev => [json.log, ...prev.slice(0, 9)])
        setNotitie('')
        setGelogdeStemming(stemming)
        setSucces(true)
        vitaEvent('mood_logged')
        setTimeout(() => router.push('/home'), 1500)
      } else {
        toast({
          title: 'Opslaan mislukt',
          description: 'Je stemming kon niet worden opgeslagen. Probeer het opnieuw.',
          variant: 'error',
        })
      }
    } catch {
      toast({
        title: 'Geen verbinding',
        description: 'Controleer je internetverbinding en probeer het opnieuw.',
        variant: 'error',
      })
    } finally {
      setOpslaan(false)
    }
  }

  const geselecteerd = STEMMING_OPTIES.find(o => o.waarde === stemming)!
  const GeselecteerdIcoon = geselecteerd.icoon

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 900, margin: '0 auto' }}>

        <header style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', margin: '0 0 4px' }}>
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <ActiviteitBadge activiteit="stemming" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            Dagelijkse stemming
          </h1>
        </header>

        {/* Vita reageert empathisch op de zojuist opgeslagen stemming. */}
        {succes && gelogdeStemming !== null ? (
          <div role="status" style={{ marginBottom: 20 }}>
            <VitaStemmingBegeleider fase="reactie" stemming={gelogdeStemming} />
          </div>
        ) : succes ? (
          <div role="status" style={{
            background: 'var(--mf-green-light)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--text-1)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle2 size={16} aria-hidden style={{ color: 'var(--mf-green)', flexShrink: 0 }} /> Stemming opgeslagen — goed bezig!
          </div>
        ) : (
          /* Vóór het loggen: Vita nodigt kort en warm uit. */
          <div style={{ marginBottom: 20 }}>
            <VitaStemmingBegeleider fase="uitnodiging" />
          </div>
        )}

        <div className={logs.length > 0 ? 'mf-home-layout' : ''} style={{ alignItems: 'start' }}>
        <div>{/* form column */}

        {/* Stemming hero card */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border)',
          padding: '24px 20px',
          marginBottom: 14,
        }}>
          <p id="stemming-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 18px' }}>
            Hoe voel je je nu?
          </p>

          {/* Stemming hero — gekozen lucide-icoon, groot */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 112, height: 112, borderRadius: '50%',
              background: geselecteerd.achtergrond,
              border: `2px solid color-mix(in srgb, ${geselecteerd.kleur} 19%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 32px color-mix(in srgb, ${geselecteerd.kleur} 13%, transparent)`,
              transition: 'background 0.3s ease, box-shadow 0.3s ease',
            }}>
              <GeselecteerdIcoon size={56} aria-hidden strokeWidth={1.75} style={{ color: geselecteerd.kleur, display: 'block', transition: 'transform 0.2s var(--ease)' }} />
            </div>
          </div>

          {/* Grote icoon-kiezer */}
          <div role="radiogroup" aria-labelledby="stemming-label" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            {STEMMING_OPTIES.map(o => {
              const Icoon = o.icoon
              const actief = stemming === o.waarde
              return (
                <button
                  key={o.waarde}
                  onClick={() => setStemming(o.waarde)}
                  role="radio"
                  aria-checked={actief}
                  aria-label={`Stemming: ${o.label}`}
                  style={{
                    flex: 1,
                    height: 68,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: actief ? o.achtergrond : 'var(--bg-subtle)',
                    border: actief ? `2px solid ${o.kleur}` : '2px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    transition: 'background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast)',
                    transform: actief ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <Icoon size={26} aria-hidden strokeWidth={1.75} style={{ color: actief ? o.kleur : 'var(--text-3)' }} />
                </button>
              )
            })}
          </div>

          {/* Geselecteerd label */}
          <div style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            background: geselecteerd.achtergrond,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <GeselecteerdIcoon size={18} aria-hidden strokeWidth={1.75} style={{ color: geselecteerd.kleur, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
              {geselecteerd.label}
            </p>
          </div>
        </section>

        {/* Energie */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          marginBottom: 14,
        }}>
          <p id="energie-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 12px' }}>
            Energieniveau
          </p>
          <div role="radiogroup" aria-labelledby="energie-label" style={{ display: 'flex', gap: 8 }}>
            {ENERGIE_OPTIES.map(o => {
              const actief = energie === o.waarde
              const Icoon = o.icoon
              return (
                <button
                  key={o.waarde}
                  onClick={() => setEnergie(o.waarde)}
                  role="radio"
                  aria-checked={actief}
                  aria-label={`Energie: ${o.label}`}
                  style={{
                    flex: 1,
                    borderRadius: 'var(--radius-sm)',
                    border: actief ? '1px solid var(--mentaforce-primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    padding: '10px 4px 8px',
                    background: actief ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                    color: actief ? 'var(--text-1)' : 'var(--text-3)',
                    fontWeight: 600,
                    fontSize: 11,
                    transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Icoon size={18} aria-hidden strokeWidth={1.75} style={{ color: actief ? 'var(--mf-green)' : 'var(--text-3)' }} />
                  <span style={{ fontSize: 9, letterSpacing: '0.01em' }}>{o.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Notitie */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          padding: '14px 20px',
          marginBottom: 20,
        }}>
          <Field
            label="Notitie (optioneel)"
            hint={notitie.length > 100 ? `${notitie.length}/150` : undefined}
          >
            <Textarea
              value={notitie}
              onChange={e => setNotitie(e.target.value)}
              placeholder="Wat speelt er vandaag?"
              maxLength={150}
              rows={2}
            />
          </Field>
        </section>

        <Button
          onClick={verstuur}
          loading={opslaan}
          size="lg"
          style={{ width: '100%', marginBottom: 32 }}
        >
          {opslaan ? 'Opslaan…' : 'Stemming loggen →'}
        </Button>

        </div>{/* end form column */}

        {/* Recente stemming */}
        {logs.length > 0 && (
          <div>{/* history column */}
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 12px' }}>
              Recente check-ins
            </p>

            {/* 7-daagse stemmingsgrafiek */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
              padding: '16px 20px',
              marginBottom: 14,
            }}>
              {(() => {
                const vandaag = new Date()
                const zeven: { datum: string; dag: string; log: StemmingLog | null }[] = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(vandaag)
                  d.setDate(d.getDate() - (6 - i))
                  const datumStr = d.toISOString().split('T')[0]
                  const dagLabel = d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2)
                  const log = logs.find(l => l.aangemaakt_op.split('T')[0] === datumStr) ?? null
                  return { datum: datumStr, dag: dagLabel, log }
                })
                const vandaagStr = vandaag.toISOString().split('T')[0]
                return (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    {zeven.map(({ datum, dag, log }) => {
                      const isVandaag = datum === vandaagStr
                      // Schaal 0..1 voor scaleY; 8px minimum vertaald naar een vloer van ~0.15.
                      const schaal = log ? Math.max(0.15, log.stemming / 5) : 0
                      const kleur = log ? stemmingKleur(log.stemming) : 'var(--bg-subtle)'
                      const o = STEMMING_OPTIES.find(o => o.waarde === log?.stemming)
                      const DagIcoon = o?.icoon
                      return (
                        <div key={datum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          {log && DagIcoon
                            ? <DagIcoon size={13} aria-hidden strokeWidth={1.75} style={{ color: kleur }} />
                            : <span aria-hidden style={{ fontSize: 12, opacity: 0, height: 13 }}>·</span>}
                          <div
                            style={{ width: '100%', height: 52, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}
                            title={log ? `${dag}: ${o?.label}` : `${dag}: geen check-in`}
                          >
                            <div
                              className="mf-stemming-bar"
                              style={{
                                width: '70%', borderRadius: 4, height: 52,
                                background: kleur, opacity: log ? 0.85 : 0.3,
                                transformOrigin: 'bottom',
                                transform: `scaleY(${schaal})`,
                                outline: isVandaag ? `2px solid ${log ? kleur : 'var(--border-strong)'}` : 'none',
                                outlineOffset: 2,
                              } as React.CSSProperties}
                            />
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: isVandaag ? 800 : 500,
                            color: isVandaag ? 'var(--text-2)' : 'var(--text-4)',
                            textTransform: 'capitalize',
                          }}>{dag}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                {[
                  { kleur: 'var(--mf-green)',  label: '≥4 goed',     vorm: '50%' },
                  { kleur: 'var(--mf-orange)', label: '3 neutraal',  vorm: '2px' },
                  { kleur: 'var(--mf-red)',    label: '≤2 slecht',   vorm: '0' },
                ].map(l => (
                  <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-3)' }}>
                    <span aria-hidden style={{ width: 8, height: 8, borderRadius: l.vorm, background: l.kleur, display: 'inline-block', flexShrink: 0 }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.slice(0, 7).map(log => {
                const optie = STEMMING_OPTIES.find(o => o.waarde === log.stemming)
                const LogIcoon = optie?.icoon ?? Meh
                return (
                <div key={log.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xs)',
                  border: '1px solid var(--border)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <LogIcoon size={24} aria-hidden strokeWidth={1.75} style={{ color: stemmingKleur(log.stemming), flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: stemmingKleur(log.stemming), margin: 0 }}>
                      {STEMMING_OPTIES.find(o => o.waarde === log.stemming)?.label}
                      {log.energie ? <span style={{ fontWeight: 400, color: 'var(--text-4)', fontSize: 11 }}> · energie {log.energie}/5</span> : null}
                    </p>
                    {log.notitie && <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '2px 0 0' }}>{log.notitie}</p>}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-4)', flexShrink: 0, margin: 0 }}>
                    {new Date(log.aangemaakt_op).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </main>

      <style>{`
        .mf-stemming-bar {
          transition: transform 0.4s var(--ease, cubic-bezier(0.16, 1, 0.3, 1));
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-stemming-bar { transition: none; }
        }
      `}</style>
    </div>
  )
}
