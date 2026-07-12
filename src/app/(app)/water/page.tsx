'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Droplet, PartyPopper, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { getActiviteit } from '@/lib/navigatie/activiteiten'
import { vitaEvent } from '@/lib/vita/events'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

const ACT = getActiviteit('water')

interface WaterLog {
  id: string
  ml: number
  tijdstip: string
}

interface WaterData {
  vandaag_ml: number
  doel_ml: number
  logs: WaterLog[]
}

/** Doel komt automatisch uit profiel of is handmatig overschreven in Instellingen. */
type DoelBron = 'auto' | 'handmatig'

interface WaterDag {
  datum: string
  dag: string
  totaal: number
  isVandaag: boolean
}

const SNELLE_OPTIES = [150, 250, 500, 750]

function formatTijdstip(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function formatDatum(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function motivatieTekst(percentage: number): string {
  if (percentage >= 100) return 'Dagdoel behaald! Super!'
  if (percentage >= 75) return 'Bijna! Nog een glas en je bent er!'
  if (percentage >= 50) return 'Halverwege je doel!'
  if (percentage >= 25) return 'Goed bezig, drink nog meer!'
  return 'Tijd om te drinken!'
}

function WaterGlas({ percentage }: { percentage: number }) {
  const gevuld = Math.min(percentage, 100)
  const waterHoogte = (gevuld / 100) * 200

  return (
    <svg
      viewBox="0 0 160 260"
      width="140"
      height="230"
      aria-label={`Waterglas ${gevuld}% gevuld`}
      role="img"
    >
      <path
        d="M20 20 L10 240 L150 240 L140 20 Z"
        fill="none"
        stroke="var(--mf-blue-mid)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M28 30 L24 210"
        stroke="var(--mf-blue-mid)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.2"
      />
      <defs>
        <clipPath id="glasClip">
          <path d="M21 21 L11 239 L149 239 L139 21 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#glasClip)">
        {/* Vaste geometrie op de 100%-stand; alleen de groep schuift via
            translateY — transform animeert compositor-vriendelijk, in
            tegenstelling tot y/height/d-attributen. */}
        <g style={{
          transform: `translateY(${200 - waterHoogte}px)`,
          transition: 'transform 0.8s var(--ease)',
        }}>
          <rect
            x="0"
            y="40"
            width="160"
            height="210"
            fill="var(--mf-blue-mid)"
            opacity="0.82"
          />
          <path
            d="M0 40 q20 -8 40 0 q20 8 40 0 q20 -8 40 0 q20 8 40 0 v10 H0 Z"
            fill="var(--mf-blue-light)"
            opacity="0.7"
          />
        </g>
      </g>
      {[25, 50, 75].map(pct => {
        const y = 240 - (pct / 100) * 200
        return (
          <line
            key={pct}
            x1="135"
            y1={y}
            x2="148"
            y2={y}
            stroke="var(--mf-blue-mid)"
            strokeWidth="1.5"
            opacity="0.4"
          />
        )
      })}
    </svg>
  )
}

export default function WaterPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<WaterData>({ vandaag_ml: 0, doel_ml: 2000, logs: [] })
  const [bezig, setBezig] = useState(false)
  const [customMl, setCustomMl] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [weekData, setWeekData] = useState<WaterDag[]>([])
  const [doelBron, setDoelBron] = useState<DoelBron>('auto')
  const inputRef = useRef<HTMLInputElement>(null)

  const percentage = Math.round((data.vandaag_ml / data.doel_ml) * 100)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const vandaag = new Date()
      const vandaagStr = vandaag.toISOString().split('T')[0]
      const zevenDagenGel = new Date(vandaag)
      zevenDagenGel.setDate(vandaag.getDate() - 6)

      const [waterRes, weekRes, profielRes] = await Promise.all([
        authFetch('/api/water'),
        supabase
          .from('water_logs')
          .select('datum, ml')
          .eq('user_id', user.id)
          .gte('datum', zevenDagenGel.toISOString().split('T')[0])
          .lte('datum', vandaagStr),
        supabase
          .from('profiles')
          .select('water_doel_ml')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      if (waterRes.ok) {
        const json = await waterRes.json() as WaterData
        setData(json)
      }

      // Niet-NULL water_doel_ml = handmatig overschreven in Instellingen.
      setDoelBron(profielRes.data?.water_doel_ml != null ? 'handmatig' : 'auto')

      const totalsMap = new Map<string, number>()
      for (const log of (weekRes.data ?? [])) {
        totalsMap.set(log.datum, (totalsMap.get(log.datum) ?? 0) + log.ml)
      }

      const strip = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(vandaag)
        d.setDate(d.getDate() - (6 - i))
        const ds = d.toISOString().split('T')[0]
        return {
          datum: ds,
          dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
          totaal: totalsMap.get(ds) ?? 0,
          isVandaag: ds === vandaagStr,
        }
      })
      setWeekData(strip)

      setLaden(false)
    }
    laad()
  }, [router])

  async function voegToe(ml: number) {
    if (bezig) return
    setBezig(true)
    setFout(null)

    const res = await authFetch('/api/water', {
      method: 'POST',
      body: JSON.stringify({ ml }),
    })

    if (res.ok) {
      const { nieuw_totaal, doel_ml } = await res.json() as { nieuw_totaal: number; doel_ml: number }
      setData(prev => ({
        vandaag_ml: nieuw_totaal,
        doel_ml,
        logs: [...prev.logs, { id: crypto.randomUUID(), ml, tijdstip: new Date().toISOString() }],
      }))
      setCustomMl('')
      vitaEvent('data_logged', { kind: 'water' })
    } else {
      const json = await res.json() as { error: string }
      const melding = json.error ?? 'Fout bij toevoegen.'
      setFout(melding)
      toast({ title: 'Toevoegen mislukt', description: melding, variant: 'error' })
    }

    setBezig(false)
  }

  async function verwijder(id: string) {
    const log = data.logs.find(l => l.id === id)
    if (!log) return

    const res = await authFetch(`/api/water?id=${id}`, { method: 'DELETE' })

    if (res.ok) {
      setData(prev => ({
        ...prev,
        vandaag_ml: Math.max(0, prev.vandaag_ml - log.ml),
        logs: prev.logs.filter(l => l.id !== id),
      }))
    } else {
      toast({ title: 'Verwijderen mislukt', description: 'Kon deze invoer niet verwijderen. Probeer het opnieuw.', variant: 'error' })
    }
  }

  function handleCustomToevoegen() {
    const ml = parseInt(customMl, 10)
    if (!Number.isInteger(ml) || ml <= 0 || ml > 2000) {
      setFout('Voer een geldig aantal ml in (1–2000).')
      return
    }
    voegToe(ml)
  }

  if (laden) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mf-spinner" />
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        paddingBottom: 'calc(3rem + var(--safe-bottom, 0px))',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Header */}
          <header style={{ paddingTop: '2rem', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: '0 0 4px', textTransform: 'capitalize', letterSpacing: '0.01em' }}>
              {formatDatum()}
            </p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACT.kleur, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: ACT.kleur, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ACT.label}</span>
            </span>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-1)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Waterintake
            </h1>
          </header>

          {/* Hero card — glas + stats */}
          <section
            aria-label="Waterstatus vandaag"
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              padding: '2rem 1.5rem',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', pointerEvents: 'none',
                width: 140, height: 140, borderRadius: '50%',
                background: percentage >= 100
                  ? 'radial-gradient(circle, color-mix(in srgb, var(--mf-green) 22%, transparent) 0%, transparent 70%)'
                  : 'radial-gradient(circle, color-mix(in srgb, var(--mf-blue-mid) 22%, transparent) 0%, transparent 70%)',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <WaterGlas percentage={percentage} />
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '2.75rem',
                fontWeight: 800,
                color: 'var(--mf-blue)',
                margin: 0,
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}>
                {data.vandaag_ml}
                <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-3)', marginLeft: '0.3rem' }}>
                  / {data.doel_ml}ml
                </span>
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', margin: '0.4rem 0 0' }}>
                {percentage}% van je dagdoel
              </p>
              <p style={{ color: 'var(--text-4)', fontSize: '0.72rem', margin: '0.3rem 0 0' }}>
                {doelBron === 'handmatig'
                  ? 'Doel handmatig ingesteld in Instellingen'
                  : 'Doel op basis van jouw gewicht & activiteit'}
              </p>
            </div>

            {/* Voortgangsbalk */}
            <div style={{ width: '100%', maxWidth: 280, height: 8, background: 'var(--mf-blue-light)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: '100%',
                transform: `scaleX(${Math.min(percentage, 100) / 100})`,
                transformOrigin: 'left center',
                background: percentage >= 100 ? 'var(--mf-green)' : 'var(--mf-blue-mid)',
                borderRadius: 100,
                transition: 'transform 0.6s var(--ease)',
              }} />
            </div>

            {/* Motivatietekst */}
            <p style={{
              background: percentage >= 100 ? 'var(--mf-green-light)' : 'var(--mf-blue-light)',
              color: percentage >= 100 ? 'var(--mf-green-dark)' : 'var(--mf-blue)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 1.1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              margin: 0,
              textAlign: 'center',
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              {percentage >= 100
                ? <PartyPopper size={16} aria-hidden style={{ flexShrink: 0 }} />
                : <Droplet size={16} aria-hidden style={{ flexShrink: 0 }} />}
              {motivatieTekst(percentage)}
            </p>

            {/* 7-daagse barchart */}
            {weekData.length > 0 && weekData.some(d => d.totaal > 0) && (
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', margin: '0 0 10px' }}>
                  Afgelopen 7 dagen
                </p>
                <div
                  role="img"
                  aria-label={`Waterinname afgelopen 7 dagen: ${weekData
                    .map(dag => `${dag.dag} ${dag.totaal} milliliter`)
                    .join(', ')}`}
                  style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}
                >
                  {weekData.map(dag => {
                    const maxMl = data.doel_ml
                    const h = dag.totaal > 0 ? Math.max(6, Math.min(1, dag.totaal / maxMl) * 48) : 4
                    const kleur = dag.totaal >= data.doel_ml ? 'var(--mf-green)' : dag.totaal >= data.doel_ml / 2 ? 'var(--mf-blue-mid)' : 'var(--mf-blue-light)'
                    return (
                      <div key={dag.datum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: '100%', height: 48, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
                        }}>
                          <div style={{
                            width: '70%', borderRadius: 3, height: h,
                            background: dag.totaal > 0 ? kleur : 'var(--bg-subtle)',
                            opacity: dag.totaal > 0 ? 0.9 : 0.4,
                            outline: dag.isVandaag ? `2px solid ${dag.totaal > 0 ? 'var(--mf-blue-mid)' : 'var(--border-strong)'}` : 'none',
                            outlineOffset: 2,
                          }} />
                        </div>
                        <span style={{ fontSize: 9, fontWeight: dag.isVandaag ? 800 : 500, color: dag.isVandaag ? 'var(--text-2)' : 'var(--text-4)', textTransform: 'capitalize' }}>{dag.dag}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {weekData.length > 0 && !weekData.some(d => d.totaal > 0) && (
              <div style={{ width: '100%' }}>
                <EmptyState
                  icon={Droplet}
                  title="Nog geen weekgeschiedenis"
                  description="Log je eerste glas water om je 7-daagse trend op te bouwen."
                />
              </div>
            )}
          </section>

          {/* Snelle toevoeg knoppen */}
          <section aria-label="Snel water toevoegen" style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1rem',
          }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-3)', margin: '0 0 0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Snel toevoegen
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {SNELLE_OPTIES.map(ml => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => voegToe(ml)}
                  disabled={bezig}
                  aria-label={`Voeg ${ml} milliliter water toe`}
                  className="mf-water-quick"
                  style={{
                    minHeight: 44,
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--mf-blue-light)',
                    background: 'var(--mf-blue-light)',
                    color: 'var(--mf-blue)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: bezig ? 'not-allowed' : 'pointer',
                    opacity: bezig ? 0.6 : 1,
                    transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
                    textAlign: 'center',
                  }}
                >
                  +{ml}
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}>ml</span>
                </button>
              ))}
            </div>

            <style>{`
              .mf-water-quick:hover:not(:disabled) {
                background: var(--mf-blue-mid);
                color: var(--bg-app);
                border-color: var(--mf-blue-mid);
              }
              .mf-water-quick:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
              }
            `}</style>

            {/* Custom ml */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Field label="Aangepaste hoeveelheid (ml)" htmlFor="water-custom-ml">
                  <Input
                    ref={inputRef}
                    id="water-custom-ml"
                    type="number"
                    min={1}
                    max={2000}
                    value={customMl}
                    onChange={e => setCustomMl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomToevoegen()}
                    placeholder="bijv. 300"
                  />
                </Field>
              </div>
              <Button
                onClick={handleCustomToevoegen}
                disabled={bezig || !customMl}
                style={{ whiteSpace: 'nowrap' }}
              >
                Toevoegen
              </Button>
            </div>

            {fout && (
              <p role="alert" style={{ color: 'var(--mf-red)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                {fout}
              </p>
            )}
          </section>

          {/* Waterlog */}
          <section aria-label="Waterlog vandaag" style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            padding: '1.25rem 1.5rem',
          }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-3)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Vandaag gelogd
            </h2>

            {data.logs.length === 0 ? (
              <p style={{ color: 'var(--text-4)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                Nog niets gelogd vandaag.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {[...data.logs].reverse().map(log => (
                  <li
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Droplet size={16} aria-hidden style={{ color: 'var(--mf-blue-mid)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-1)', fontSize: '0.9rem', fontWeight: 600 }}>
                        {log.ml}ml
                      </span>
                      <span style={{ color: 'var(--text-4)', fontSize: '0.8rem' }}>
                        {formatTijdstip(log.tijdstip)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => verwijder(log.id)}
                      aria-label={`Verwijder ${log.ml}ml om ${formatTijdstip(log.tijdstip)}`}
                      className="mf-water-delete"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: '1px solid transparent',
                        color: 'var(--text-4)',
                        cursor: 'pointer',
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-sm)',
                        lineHeight: 1,
                        transition: 'color var(--transition-fast)',
                      }}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <style>{`
              .mf-water-delete:hover { color: var(--mf-red); }
              .mf-water-delete:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
                color: var(--mf-red);
              }
            `}</style>
          </section>
        </div>
      </main>
    </>
  )
}
