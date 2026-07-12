'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Check, Angry, Frown, Meh, Smile, Laugh } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { getActiviteit } from '@/lib/navigatie/activiteiten'
import { vitaEvent } from '@/lib/vita/events'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

const ACT = getActiviteit('rust')
interface SlaapLog {
  id: string
  datum: string
  uren_slaap: number
  kwaliteit: number | null
  bedtijd: string | null
  wektijd: string | null
  notitie: string | null
}

const KWALITEIT_LABELS = ['', 'Heel slecht', 'Slecht', 'Gemiddeld', 'Goed', 'Uitstekend']
// Index 0 is leeg (kwaliteit start bij 1); lucide-iconen volgen dezelfde 5-puntsschaal als stemming.
const KWALITEIT_ICOON: (LucideIcon | null)[] = [null, Angry, Frown, Meh, Smile, Laugh]

function kwaliteitKleur(k: number): string {
  if (k >= 4) return 'var(--mf-green)'
  if (k === 3) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function urenNaarTijd(uren: number) {
  const h = Math.floor(uren)
  const m = Math.round((uren - h) * 60)
  return `${h}u${m > 0 ? ` ${m}m` : ''}`
}

function slaapKleur(u: number): string {
  if (u >= 7) return 'var(--mf-green)'
  if (u >= 5) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function SlaapBarchart({ logs }: { logs: SlaapLog[] }) {
  const vandaag = new Date()
  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(vandaag)
    d.setDate(d.getDate() - (6 - i))
    const datum = d.toISOString().split('T')[0]
    const log = logs.find(l => l.datum === datum)
    return {
      datum,
      dag: d.toLocaleDateString('nl-NL', { weekday: 'narrow' }),
      uren: log?.uren_slaap ?? null,
    }
  })

  const maxUren = 10
  const barH = 60

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 16,
      border: '1px solid var(--border)', padding: '16px 16px 12px',
      marginBottom: 16, boxShadow: 'var(--shadow-sm)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
        7 DAGEN SLAAP
      </p>
      <div
        role="img"
        aria-label={`Slaap afgelopen 7 dagen: ${dagen
          .map(d => `${d.dag} ${d.uren !== null ? `${d.uren} uur` : 'geen data'}`)
          .join(', ')}`}
        style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: barH + 20 }}
      >
        {dagen.map(d => {
          const pct = d.uren !== null ? Math.min(1, d.uren / maxUren) : 0
          const h = Math.max(4, Math.round(pct * barH))
          const kleur = d.uren !== null ? slaapKleur(d.uren) : 'var(--bg-subtle)'
          const isVandaag = d.datum === vandaag.toISOString().split('T')[0]
          return (
            <div key={d.datum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {d.uren !== null && (
                <span style={{ fontSize: 8, color: kleur, fontWeight: 700 }}>
                  {d.uren % 1 === 0 ? `${d.uren}u` : `${d.uren.toFixed(1)}u`}
                </span>
              )}
              <div style={{
                width: '100%', height: d.uren !== null ? h : 4, borderRadius: 6,
                background: kleur,
                opacity: d.uren !== null ? 1 : 0.25,
                outline: isVandaag ? `2px solid ${kleur}` : 'none',
                outlineOffset: 2,
              }} />
              <span style={{ fontSize: 9, color: isVandaag ? 'var(--mf-green)' : 'var(--text-4)', fontWeight: isVandaag ? 700 : 500 }}>
                {d.dag}
              </span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {[
          { kleur: 'var(--mf-green)', label: '≥ 7u' },
          { kleur: 'var(--mf-amber)', label: '5–7u' },
          { kleur: 'var(--mf-red)',   label: '< 5u' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.kleur }} />
            <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SlaapPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [logs, setLogs] = useState<SlaapLog[]>([])
  const [gemiddeldUren, setGemiddeldUren] = useState<number | null>(null)
  const [gemiddeldKwaliteit, setGemiddeldKwaliteit] = useState<number | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)

  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0])
  const [uren, setUren] = useState<number>(7.5)
  const [kwaliteit, setKwaliteit] = useState<number>(3)
  const [bedtijd, setBedtijd] = useState('')
  const [wektijd, setWektijd] = useState('')
  const [notitie, setNotitie] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/slaap?limit=14')
      if (res.ok) {
        const json = await res.json() as { logs: SlaapLog[]; gemiddeld_uren: number | null; gemiddeld_kwaliteit: number | null }
        setLogs(json.logs ?? [])
        setGemiddeldUren(json.gemiddeld_uren)
        setGemiddeldKwaliteit(json.gemiddeld_kwaliteit)

        const vandaag = json.logs.find(l => l.datum === new Date().toISOString().split('T')[0])
        if (vandaag) {
          setUren(vandaag.uren_slaap)
          setKwaliteit(vandaag.kwaliteit ?? 3)
          setBedtijd(vandaag.bedtijd ?? '')
          setWektijd(vandaag.wektijd ?? '')
          setNotitie(vandaag.notitie ?? '')
        }
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function verstuur() {
    setOpslaan(true)
    try {
      const res = await authFetch('/api/slaap', {
        method: 'POST',
        body: JSON.stringify({ datum, uren_slaap: uren, kwaliteit, bedtijd: bedtijd || undefined, wektijd: wektijd || undefined, notitie: notitie || undefined }),
      })
      if (res.ok) {
        const json = await res.json() as { log: SlaapLog }
        setLogs(prev => {
          const idx = prev.findIndex(l => l.datum === datum)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = { ...prev[idx], ...json.log }
            return next
          }
          return [json.log, ...prev.slice(0, 13)]
        })
        setSucces(true)
        vitaEvent('data_logged', { kind: 'slaap' })
        setTimeout(() => router.push('/home'), 1500)
      } else {
        toast({ title: 'Opslaan mislukt', description: 'Kon je slaap niet opslaan. Probeer het opnieuw.', variant: 'error' })
      }
    } catch {
      toast({ title: 'Opslaan mislukt', description: 'Er ging iets mis. Probeer het opnieuw.', variant: 'error' })
    }
    setOpslaan(false)
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px calc(88px + var(--safe-bottom, 0px))', maxWidth: 900, margin: '0 auto' }}>

        <header style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', margin: '0 0 4px' }}>
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACT.kleur, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACT.kleur, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ACT.label}</span>
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            Slaaptracker
          </h1>
        </header>

        {/* Stats */}
        {(gemiddeldUren !== null || gemiddeldKwaliteit !== null) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {gemiddeldUren !== null && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 6px' }}>
                  Gem. slaap
                </p>
                <p style={{ fontSize: 26, fontWeight: 800, color: slaapKleur(gemiddeldUren), margin: 0, letterSpacing: '-0.02em' }}>
                  {urenNaarTijd(gemiddeldUren)}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-4)', margin: '3px 0 0' }}>afgelopen 2 weken</p>
              </div>
            )}
            {gemiddeldKwaliteit !== null && (() => {
              const gemRond = Math.round(gemiddeldKwaliteit)
              const GemIcoon = KWALITEIT_ICOON[gemRond] ?? Meh
              return (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 6px' }}>
                  Gem. kwaliteit
                </p>
                <GemIcoon size={28} aria-hidden strokeWidth={1.75} style={{ color: kwaliteitKleur(gemRond), display: 'block' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-4)', margin: '6px 0 0' }}>
                  {gemiddeldKwaliteit.toFixed(1)}/5 — {KWALITEIT_LABELS[gemRond]}
                </p>
              </div>
              )
            })()}
          </div>
        )}

        <div className={logs.length > 0 ? 'mf-home-layout' : ''} style={{ alignItems: 'start' }}>
        <div>{/* form column */}

        {succes && (
          <div role="status" style={{
            background: 'var(--mf-green-light)', border: '1px solid var(--mentaforce-primary)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--mf-green)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Check size={16} aria-hidden style={{ color: 'var(--mf-green)', flexShrink: 0 }} /> Slaap opgeslagen!
          </div>
        )}

        {/* Sleep hero */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 112, height: 112, borderRadius: '50%',
            background: `color-mix(in srgb, ${slaapKleur(uren)} 10%, transparent)`,
            border: `2px solid color-mix(in srgb, ${slaapKleur(uren)} 28%, transparent)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'background 0.3s ease',
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: slaapKleur(uren), letterSpacing: '-0.03em', lineHeight: 1 }}>
              {urenNaarTijd(uren)}
            </span>
            {(() => {
              const HeroIcoon = KWALITEIT_ICOON[kwaliteit] ?? Meh
              return <HeroIcoon size={22} aria-hidden strokeWidth={1.75} style={{ color: kwaliteitKleur(kwaliteit), marginTop: 4 }} />
            })()}
          </div>
        </div>

        {/* Form card */}
        <section style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '20px', marginBottom: 20 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 18px' }}>
            Log invoeren
          </p>

          <div style={{ marginBottom: 16 }}>
            <Field label="Datum">
              <Input
                type="date"
                value={datum}
                onChange={e => setDatum(e.target.value)}
              />
            </Field>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="slaap-uren" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              Uren geslapen:{' '}
              <strong style={{ color: slaapKleur(uren) }}>{urenNaarTijd(uren)}</strong>
            </label>
            <input
              id="slaap-uren"
              type="range" min={0} max={12} step={0.5} value={uren}
              aria-valuetext={urenNaarTijd(uren)}
              onChange={e => setUren(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: slaapKleur(uren) }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-4)', marginTop: 2 }}>
              <span>0u</span><span>6u</span><span>12u</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }} id="slaap-kwaliteit-label">Kwaliteit</p>
            <div style={{ display: 'flex', gap: 8 }} role="group" aria-labelledby="slaap-kwaliteit-label">
              {[1, 2, 3, 4, 5].map(k => {
                const actief = kwaliteit === k
                const KwIcoon = KWALITEIT_ICOON[k] ?? Meh
                return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKwaliteit(k)}
                  aria-pressed={actief}
                  aria-label={KWALITEIT_LABELS[k]}
                  style={{
                    flex: 1, height: 44, minWidth: 44, borderRadius: 'var(--radius-sm)',
                    border: actief ? '1px solid transparent' : '1px solid var(--border-strong)',
                    cursor: 'pointer',
                    background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  <KwIcoon size={20} aria-hidden strokeWidth={1.75} style={{ color: actief ? 'var(--bg-app)' : 'var(--text-3)' }} />
                </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6, textAlign: 'center' }}>
              {KWALITEIT_LABELS[kwaliteit]}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Field label="Bedtijd">
              <Input type="time" value={bedtijd} onChange={e => setBedtijd(e.target.value)} />
            </Field>
            <Field label="Wektijd">
              <Input type="time" value={wektijd} onChange={e => setWektijd(e.target.value)} />
            </Field>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Field label="Notitie">
              <Textarea
                value={notitie}
                onChange={e => setNotitie(e.target.value)}
                placeholder="Notitie (nachtmerrie, stress, cafeïne...)"
                maxLength={200}
                rows={2}
              />
            </Field>
          </div>

          <Button
            onClick={verstuur}
            loading={opslaan}
            style={{ width: '100%' }}
            size="lg"
          >
            {opslaan ? 'Opslaan…' : 'Slaap loggen'}
          </Button>
        </section>

        </div>{/* end form column */}

        {logs.length > 0 && (
          <div>{/* history column */}
            <SlaapBarchart logs={logs} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.slice(0, 7).map(log => (
                <div key={log.id} style={{
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xs)', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    background: 'var(--bg-subtle)',
                    border: `2px solid ${slaapKleur(log.uren_slaap)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 10, color: slaapKleur(log.uren_slaap),
                    letterSpacing: '-0.02em',
                  }}>
                    {urenNaarTijd(log.uren_slaap)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>
                      {new Date(log.datum + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    {log.kwaliteit ? (() => {
                      const LogKwIcoon = KWALITEIT_ICOON[log.kwaliteit] ?? Meh
                      return (
                      <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <LogKwIcoon size={13} aria-hidden strokeWidth={1.75} style={{ color: kwaliteitKleur(log.kwaliteit), flexShrink: 0 }} /> {KWALITEIT_LABELS[log.kwaliteit]}
                      </p>
                      )
                    })() : null}
                  </div>
                  {log.bedtijd ? (
                    <p style={{ fontSize: 10, color: 'var(--text-4)', margin: 0, flexShrink: 0 }}>
                      {log.bedtijd.slice(0, 5)} → {log.wektijd?.slice(0, 5) ?? '?'}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            </div>
        )}

        {logs.length === 0 && (
          <section style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <EmptyState
              icon={Moon}
              title="Nog geen slaap gelogd"
              description="Log je eerste nacht om je 7-daagse trend en gemiddelden te zien."
            />
          </section>
        )}
        </div>
      </main>
    </div>
  )
}
