'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PremiumSlot } from '@/components/ui/PremiumSlot'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'


interface VraagStat {
  id: string
  vraag: string
  type: 'scale' | 'nps' | 'multiple_choice' | 'text'
  actief: boolean
  volgorde: number
  aangemaakt_op: string
  aantal_antwoorden: number
  gemiddelde: number | null
  distributie: Record<string, number>
  nps: number | null
  verborgen_wegens_anonimiteit?: boolean
}

interface SurveyData {
  vragen: VraagStat[]
  participatie: { respondenten: number; totaal: number; pct: number }
  week_start: string
}

const TYPE_LABELS: Record<string, string> = {
  scale: '1—5 schaal',
  nps: 'NPS (0—10)',
  multiple_choice: 'Meerkeuze',
  text: 'Open tekst',
}

const NPS_KLEUR = (score: number) => score >= 30 ? 'var(--mf-green)' : score >= 0 ? 'var(--mf-amber)' : 'var(--mf-red)'

const SELECT_STYLE: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
  background: 'var(--bg-subtle)',
  color: 'var(--text-1)',
}

export default function HrPulseSurveyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<SurveyData | null>(null)
  const [nieuw, setNieuw] = useState(false)
  const [vraag, setVraag] = useState('')
  const [type, setType] = useState<'scale' | 'nps' | 'multiple_choice' | 'text'>('scale')
  const [optiesRaw, setOptiesRaw] = useState('')
  const [toevoegen, setToevoegen] = useState(false)
  const [uitbreiden, setUitbreiden] = useState<string | null>(null)
  const [premiumNodig, setPremiumNodig] = useState(false)

  async function laadData() {
    const res = await authFetch('/api/hr/pulse-survey')
    if (res.status === 403) {
      const json = (await res.json().catch(() => null)) as { code?: string } | null
      if (json?.code === 'premium') setPremiumNodig(true)
    } else if (res.ok) {
      setData(await res.json() as SurveyData)
    }
    setLaden(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else laadData()
    })
  }, [router])

  async function voegToe() {
    if (!vraag.trim() || toevoegen) return
    setToevoegen(true)
    const opties = type === 'multiple_choice'
      ? optiesRaw.split('\n').map(s => s.trim()).filter(Boolean)
      : undefined

    const res = await authFetch('/api/hr/pulse-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vraag: vraag.trim(), type, opties }),
    })
    if (res.ok) {
      setVraag('')
      setOptiesRaw('')
      setType('scale')
      setNieuw(false)
      await laadData()
      toast({ title: 'Vraag toegevoegd', variant: 'success' })
    } else {
      toast({ title: 'Toevoegen mislukt', description: 'Probeer het opnieuw.', variant: 'error' })
    }
    setToevoegen(false)
  }

  async function toggleActief(id: string, huidig: boolean) {
    const res = await authFetch('/api/hr/pulse-survey', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actief: !huidig }),
    })
    if (!res.ok) {
      toast({ title: 'Wijzigen mislukt', description: 'De status kon niet worden bijgewerkt.', variant: 'error' })
    }
    await laadData()
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  if (premiumNodig) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 760, margin: '0 auto' }}>
        <PremiumSlot
          kanUpgraden
          titel="Pulse-surveys"
          omschrijving="Stel je team elke week één korte vraag en zie anoniem (≥ 5 respondenten) hoe de organisatie ervoor staat — met trends per vraag."
        />
      </main>
    </div>
  )

  const participatie = data?.participatie ?? { respondenten: 0, totaal: 0, pct: 0 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Pulse survey</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              Week van {data?.week_start ? new Date(data.week_start).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' }) : '—'} ·{' '}
              {participatie.respondenten} van {participatie.totaal} ingevuld ({participatie.pct}%)
            </p>
          </div>
          <Button
            variant={nieuw ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={nieuw ? <X size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
            onClick={() => setNieuw(v => !v)}
          >
            {nieuw ? 'Annuleer' : 'Vraag toevoegen'}
          </Button>
        </div>

        {/* Participatie balk */}
        <Card style={{ padding: '16px 20px', marginBottom: 16 }}>
          <Progress
            value={participatie.pct}
            label="Participatie deze week"
            showValue
            color="var(--mf-green)"
          />
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>{participatie.respondenten} respondenten van {participatie.totaal} medewerkers</p>
        </Card>

        {/* Nieuw vraag formulier */}
        {nieuw && (
          <Card style={{ border: '1.5px solid var(--mentaforce-primary)', padding: '20px 22px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>Nieuwe vraag</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Vraag" required>
                <Textarea
                  rows={2}
                  value={vraag}
                  onChange={e => setVraag(e.target.value)}
                  placeholder="Hoe tevreden ben je over...?"
                  style={{ resize: 'none', minHeight: 0 }}
                />
              </Field>
              <Field label="Type vraag">
                <select
                  value={type}
                  onChange={e => setType(e.target.value as typeof type)}
                  style={SELECT_STYLE}
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              {type === 'multiple_choice' && (
                <Field label="Opties" hint="Eén optie per regel">
                  <Textarea
                    rows={4}
                    value={optiesRaw}
                    onChange={e => setOptiesRaw(e.target.value)}
                    placeholder={"Altijd\nVaak\nSoms\nNooit"}
                    style={{ resize: 'none' }}
                  />
                </Field>
              )}
              <Button
                onClick={voegToe}
                disabled={!vraag.trim()}
                loading={toevoegen}
                style={{ width: '100%' }}
              >
                {toevoegen ? 'Toevoegen…' : 'Vraag toevoegen'}
              </Button>
            </div>
          </Card>
        )}

        {/* Vragenlijst */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(data?.vragen ?? []).length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', paddingTop: 40 }}>
              Nog geen pulse survey vragen aangemaakt. Klik op &quot;Vraag toevoegen&quot; om te beginnen.
            </p>
          )}
          {(data?.vragen ?? []).map(v => {
            const isOpen = uitbreiden === v.id
            return (
              <Card key={v.id} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Toggle actief */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={v.actief}
                    aria-label={`Vraag ${v.actief ? 'actief' : 'inactief'} — klik om te wisselen`}
                    onClick={() => toggleActief(v.id, v.actief)}
                    className="mf-pulse-switch"
                    style={{
                      width: 36, height: 20, borderRadius: 100, position: 'relative', cursor: 'pointer', flexShrink: 0,
                      border: 'none', padding: 0,
                      background: v.actief ? 'var(--mf-green)' : 'var(--border-strong)',
                    }}
                  >
                    <span aria-hidden style={{
                      display: 'block',
                      width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-card)',
                      position: 'absolute', top: 3, left: 3,
                      transform: v.actief ? 'translateX(16px)' : 'translateX(0)',
                    }} />
                  </button>

                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setUitbreiden(isOpen ? null : v.id)}
                    className="mf-pulse-expand"
                    style={{
                      flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14,
                      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.vraag}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{TYPE_LABELS[v.type]} · {v.aantal_antwoorden} antwoorden</p>
                    </div>

                    {v.type === 'nps' && v.nps !== null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: NPS_KLEUR(v.nps) }}>{v.nps > 0 ? '+' : ''}{v.nps}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)' }}>NPS</p>
                      </div>
                    )}
                    {(v.type === 'scale') && v.gemiddelde !== null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--mf-green)' }}>{v.gemiddelde}/5</p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)' }}>gem.</p>
                      </div>
                    )}

                    {isOpen ? <ChevronUp size={16} aria-hidden style={{ color: 'var(--text-3)', flexShrink: 0 }} /> : <ChevronDown size={16} aria-hidden style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
                  </button>
                </div>

                {isOpen && v.aantal_antwoorden > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                    {v.verborgen_wegens_anonimiteit ? (
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        Resultaten zichtbaar vanaf 5 antwoorden — zo blijft elke respondent anoniem.
                      </p>
                    ) : v.type === 'scale' || v.type === 'nps' ? (
                      <div>
                        {v.type === 'nps' && v.nps !== null && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                              {[
                                { label: 'Detractors (0—6)', count: Object.entries(v.distributie).filter(([k]) => parseInt(k) <= 6).reduce((s, [, c]) => s + c, 0), kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)' },
                                { label: 'Passives (7—8)', count: Object.entries(v.distributie).filter(([k]) => [7, 8].includes(parseInt(k))).reduce((s, [, c]) => s + c, 0), kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)' },
                                { label: 'Promoters (9—10)', count: Object.entries(v.distributie).filter(([k]) => parseInt(k) >= 9).reduce((s, [, c]) => s + c, 0), kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
                              ].map(g => (
                                <div key={g.label} style={{ flex: 1, background: g.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
                                  <p style={{ fontSize: 16, fontWeight: 800, color: g.kleur }}>{g.count}</p>
                                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{g.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {Object.entries(v.distributie)
                            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                            .map(([waarde, aantal]) => {
                              const max = Math.max(...Object.values(v.distributie))
                              return (
                                <div key={waarde} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', width: 24, textAlign: 'right' }}>{waarde}</span>
                                  <Progress value={aantal} max={max || 1} ariaLabel={`Score ${waarde}: ${aantal} antwoorden`} color="var(--mf-green)" style={{ flex: 1 }} />
                                  <span style={{ fontSize: 11, color: 'var(--text-3)', width: 24 }}>{aantal}</span>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    ) : v.type === 'multiple_choice' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(v.distributie).map(([optie, aantal]) => {
                          const max = Math.max(...Object.values(v.distributie))
                          return (
                            <div key={optie} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{optie}</span>
                              <Progress value={aantal} max={max || 1} ariaLabel={`${optie}: ${aantal} antwoorden`} color="var(--mf-green)" style={{ width: 120 }} />
                              <span style={{ fontSize: 11, color: 'var(--text-3)', width: 24 }}>{aantal}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Open antwoorden worden niet weergegeven om anonimiteit te bewaren.</p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
        <style>{`
          .mf-pulse-switch:focus-visible, .mf-pulse-expand:focus-visible {
            outline: 2px solid var(--mentaforce-primary);
            outline-offset: 2px;
            border-radius: var(--radius-xs);
          }
          .mf-pulse-switch { transition: background 0.2s var(--ease); }
          .mf-pulse-switch span { transition: transform 0.2s var(--ease); }
          @media (prefers-reduced-motion: reduce) {
            .mf-pulse-switch, .mf-pulse-switch span { transition: none; }
          }
        `}</style>
      </main>
    </div>
  )
}
