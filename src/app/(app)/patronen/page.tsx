'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Lock,
  Activity, Moon, CalendarDays, Droplet, TrendingUp, TrendingDown,
  Trophy, Star, Flame, Sprout, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PremiumSlot } from '@/components/ui/PremiumSlot'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import VitaLeegScherm from '@/components/vita/VitaLeegScherm'


interface Patroon {
  id: string
  icon: string
  titel: string
  beschrijving: string
  waarde?: string
  vergelijking?: string
  kleur: string
  betrouwbaarheid: 'laag' | 'middel' | 'hoog'
  datapunten: number
}

interface Samenvatting {
  stemming_30d_gem: number | null
  stemming_30d_delta: string | null
  slaap_30d_gem: number | null
  slaap_30d_delta: string | null
  totaal_checkins: number
  sport_dagen_30d: number
}

interface Mijlpaal {
  bereikt: boolean
  label: string
  icon: string
  doel: number
}

interface PatronenData {
  patronen: Patroon[]
  samenvatting: Samenvatting
  mijlpalen: Mijlpaal[]
}

const BETROUWBAARHEID_VARIANT: Record<
  Patroon['betrouwbaarheid'],
  { label: string; variant: 'warning' | 'accent' | 'success' }
> = {
  laag: { label: 'Weinig data', variant: 'warning' },
  middel: { label: 'Groeiend beeld', variant: 'accent' },
  hoog: { label: 'Sterk patroon', variant: 'success' },
}

/** Stabiele icon-keys uit /api/patronen → lucide-componenten. */
const PATROON_ICON: Record<string, LucideIcon> = {
  sport: Activity,
  slaap: Moon,
  kalender: CalendarDays,
  water: Droplet,
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
}

const MIJLPAAL_ICON: Record<string, LucideIcon> = {
  'milestone-1': Sprout,
  'milestone-7': Star,
  'milestone-21': Flame,
  'milestone-50': Trophy,
}

function patroonIcon(key: string): LucideIcon {
  return PATROON_ICON[key] ?? Sparkles
}

function mijlpaalIcon(key: string): LucideIcon {
  return MIJLPAAL_ICON[key] ?? Trophy
}

function BetrouwbaarheidBadge({ niveau }: { niveau: Patroon['betrouwbaarheid'] }) {
  const config = BETROUWBAARHEID_VARIANT[niveau]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function StatKaart({ label, waarde, delta, kleur }: {
  label: string
  waarde: string | null
  delta: string | null
  kleur: string
}) {
  const isPositief = delta?.startsWith('+')
  const isNegatief = delta?.startsWith('-')

  return (
    <Card style={{ padding: '16px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: kleur, lineHeight: 1.1 }}>
        {waarde ?? '—'}
      </div>
      {delta && (
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          marginTop: 4,
          color: isPositief ? 'var(--mf-green)' : isNegatief ? 'var(--mf-red)' : 'var(--text-4)',
        }}>
          {delta} vs. vorige periode
        </div>
      )}
    </Card>
  )
}

export default function PatronenPage() {
  const router = useRouter()
  const [data, setData] = useState<PatronenData | null>(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState<string | null>(null)
  const [premiumNodig, setPremiumNodig] = useState(false)

  // Laad-logica als aanroepbare functie, zodat 'Opnieuw proberen' geen
  // window.location.reload() nodig heeft (zelfde patroon als rapport/page.tsx).
  const laad = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    try {
      const res = await authFetch('/api/patronen')
      if (res.status === 403) { setPremiumNodig(true); return }
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setFout('Kon patronen niet ophalen. Probeer het opnieuw.')
    } finally {
      setLaden(false)
    }
  }, [router])

  useEffect(() => { void laad() }, [laad])

  return (
    <>
      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .patroon-kaart {
          animation: fadein 0.4s var(--ease) both;
          transition: transform 0.15s var(--ease), box-shadow 0.15s var(--ease);
        }
        .patroon-kaart:nth-child(1) { animation-delay: 0.04s; }
        .patroon-kaart:nth-child(2) { animation-delay: 0.10s; }
        .patroon-kaart:nth-child(3) { animation-delay: 0.16s; }
        .patroon-kaart:nth-child(4) { animation-delay: 0.22s; }
        .patroon-kaart:nth-child(5) { animation-delay: 0.28s; }
        .patroon-kaart:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        @media (prefers-reduced-motion: reduce) {
          .patroon-kaart { animation: none; transition: none; }
          .patroon-kaart:hover { transform: none; }
        }
      `}</style>

      <Navbar />

      <main className="mf-mesh-bg" style={{ minHeight: '100vh', paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 0' }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Link href="/home" style={{ fontSize: 13, color: 'var(--text-4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
              <ArrowLeft size={14} aria-hidden /> Terug
            </Link>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              Jouw patronen
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
              Wat verandert er écht in jouw leven? Gebaseerd op jouw eigen data.
            </p>
          </div>

          {premiumNodig && (
            <PremiumSlot
              titel="Ontdek je persoonlijke patronen"
              omschrijving="Vita legt verbanden in jouw eigen data: hoe je slaap, beweging en stemming elkaar beïnvloeden, en wat er over 30 dagen écht verandert."
            />
          )}

          {laden && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div className="mf-spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Jouw patronen analyseren…</p>
            </div>
          )}

          {fout && (
            <Card style={{ padding: '32px 24px', textAlign: 'center', marginTop: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4, fontWeight: 600 }}>Patronen niet geladen</p>
              <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 20, lineHeight: 1.5 }}>{fout}</p>
              <Button onClick={() => { setFout(null); setLaden(true); void laad() }}>Opnieuw proberen</Button>
            </Card>
          )}

          {data && (
            <>
              {/* ── Samenvatting strip ────────────────────────── */}
              {(data.samenvatting.stemming_30d_gem !== null || data.samenvatting.slaap_30d_gem !== null) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <StatKaart
                    label="Stemming (30d)"
                    waarde={data.samenvatting.stemming_30d_gem !== null ? `${data.samenvatting.stemming_30d_gem}/5` : null}
                    delta={data.samenvatting.stemming_30d_delta}
                    kleur="var(--mf-green)"
                  />
                  <StatKaart
                    label="Slaap gem. (30d)"
                    waarde={data.samenvatting.slaap_30d_gem !== null ? `${data.samenvatting.slaap_30d_gem}u` : null}
                    delta={data.samenvatting.slaap_30d_delta}
                    kleur="var(--mf-blue)"
                  />
                  <StatKaart
                    label="Sportdagen (30d)"
                    waarde={`${data.samenvatting.sport_dagen_30d}d`}
                    delta={null}
                    kleur="var(--mf-purple)"
                  />
                </div>
              )}

              {/* ── Check-in voortgang naar betrouwbare patronen ── */}
              {(() => {
                const totaal = data.samenvatting.totaal_checkins
                const doel = 21
                const kleur = totaal >= doel ? 'var(--mf-green)' : totaal >= 10 ? 'var(--mf-amber)' : 'var(--mf-purple)'
                return (
                  <Card style={{ padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)' }}>
                        Patroonbetrouwbaarheid
                      </p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: kleur }}>
                        {totaal >= doel ? 'Sterk ✓' : `${totaal}/${doel} check-ins`}
                      </span>
                    </div>
                    <Progress
                      value={totaal}
                      max={doel}
                      color={kleur}
                      thickness={6}
                      ariaLabel={`Patroonbetrouwbaarheid: ${totaal} van ${doel} check-ins`}
                    />
                    {totaal < doel && (
                      <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 5 }}>
                        Nog {doel - totaal} check-ins voor betrouwbare patronen
                      </p>
                    )}
                  </Card>
                )
              })()}

              {/* ── Patronen ──────────────────────────────────── */}
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
                Wat werkt voor jou
              </h2>

              {data.patronen.length === 0 ? (
                <VitaLeegScherm
                  emotion="curious"
                  titel="Ik zoek nog naar jouw patronen"
                  boodschap="Zodra je een tijdje je stemming, slaap en beweging bijhoudt, laat ik je zien wat jou écht meer energie en rust geeft. Elke check-in brengt dat dichterbij."
                  actieLabel="Doe een check-in"
                  actieHref="/home"
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {data.patronen.map((p) => {
                    const PatroonIcon = patroonIcon(p.icon)
                    return (
                    <Card
                      key={p.id}
                      className="patroon-kaart"
                      style={{
                        borderLeft: `4px solid ${p.kleur}`,
                        padding: '18px 18px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          flexShrink: 0, width: 32, height: 32, borderRadius: 'var(--radius-md)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `color-mix(in srgb, ${p.kleur} 14%, transparent)`,
                        }}>
                          <PatroonIcon size={18} color={p.kleur} strokeWidth={2.2} aria-hidden />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>
                              {p.titel}
                            </span>
                            {p.waarde && (
                              <span style={{ fontSize: 12, fontWeight: 800, color: p.kleur, background: `color-mix(in srgb, ${p.kleur} 15%, transparent)`, padding: '2px 8px', borderRadius: 20 }}>
                                {p.waarde}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 10px', lineHeight: 1.55 }}>
                            {p.beschrijving}
                          </p>
                          {p.vergelijking && (
                            <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '0 0 10px', fontStyle: 'italic' }}>
                              {p.vergelijking}
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BetrouwbaarheidBadge niveau={p.betrouwbaarheid} />
                            <span style={{ fontSize: 10, color: 'var(--text-4)' }}>
                              {p.datapunten} datapunten
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                    )
                  })}
                </div>
              )}

              {/* ── Mijlpalen ─────────────────────────────────── */}
              {data.mijlpalen.some(m => m.bereikt) && (
                <>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
                    Behaald
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
                    {data.mijlpalen.map((m) => {
                      const MijlpaalIcon = mijlpaalIcon(m.icon)
                      return (
                      <div
                        key={m.doel}
                        style={{
                          background: m.bereikt ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                          border: `1.5px solid ${m.bereikt ? 'var(--mf-green-mid)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 8px',
                          textAlign: 'center',
                          opacity: m.bereikt ? 1 : 0.55,
                        }}
                      >
                        <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                          {m.bereikt
                            ? <MijlpaalIcon size={22} color="var(--mf-green)" strokeWidth={2.2} aria-hidden />
                            : <Lock size={22} color="var(--text-4)" aria-hidden />}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: m.bereikt ? 'var(--mf-green-dark)' : 'var(--text-4)', lineHeight: 1.3 }}>
                          {m.label}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── Motivatie footer ──────────────────────────── */}
              <div
                style={{
                  background: 'var(--mf-green-light)',
                  border: '1.5px solid var(--mf-green-mid)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 14, color: 'var(--mf-green-dark)', fontWeight: 600, margin: '0 0 4px', lineHeight: 1.5 }}>
                  {data.samenvatting.totaal_checkins >= 21
                    ? `Met ${data.samenvatting.totaal_checkins} check-ins heb je genoeg data voor betrouwbare inzichten. Blijf loggen.`
                    : data.samenvatting.totaal_checkins >= 7
                    ? `${data.samenvatting.totaal_checkins} check-ins gedaan. Na 21 worden je patronen betrouwbaar.`
                    : 'Elke log voegt een datapunt toe. Je patronen worden na een week duidelijk.'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--mf-green-mid)', margin: 0 }}>
                  Patronen worden 24 uur gecached en bijgewerkt zodra je nieuw logt.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
