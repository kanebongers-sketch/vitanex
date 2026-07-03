'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/ui/Ring'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import VitaLeegScherm from '@/components/vita/VitaLeegScherm'
import { PremiumSlot } from '@/components/ui/PremiumSlot'

interface WeekStats {
  stemming: number | null
  slaap: number | null
  stress: number | null
  aantal_checkins: number
  dankbaarheid_items: number
}

interface Rapport {
  samenvatting: string
  patroon: string
  tip: string
  score_label: string
  stats: WeekStats
}

interface WeekRapportResponse {
  rapport: Rapport | null
  week_start: string
  bericht?: string
}

const SCORE_LABEL_KLEUR: Record<string, string> = {
  Uitstekend: 'var(--mf-green)',
  Goed: 'var(--mf-purple)',
  Matig: 'var(--mf-amber)',
  Lastig: 'var(--mf-red)',
}

function scoreLabelKleur(label: string): string {
  return SCORE_LABEL_KLEUR[label] ?? 'var(--mf-purple)'
}

interface MetriekRingProps {
  value: number
  max: number
  kleur: string
  label: string
  eenheid?: string
}

function MetriekRing({ value, max, kleur, label, eenheid = '' }: MetriekRingProps) {
  const displayVal = Number.isInteger(value) ? value : value.toFixed(1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <Ring
        value={value}
        max={max}
        color={kleur}
        size={80}
        thickness={7}
        ariaLabel={`${label}: ${displayVal}${eenheid}`}
      >
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: kleur, lineHeight: 1 }}>
            {displayVal}{eenheid}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>
            {label}
          </span>
        </span>
      </Ring>
    </div>
  )
}

function StatKaart({ waarde, label, kleur }: { waarde: number | string; label: string; kleur: string }) {
  return (
    <Card style={{ padding: '16px 12px', textAlign: 'center', flex: 1 }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: kleur, margin: 0 }}>{waarde}</p>
      <p style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</p>
    </Card>
  )
}

export default function InzichtenPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [vernieuwen, setVernieuwen] = useState(false)
  const [data, setData] = useState<WeekRapportResponse | null>(null)
  const [premiumNodig, setPremiumNodig] = useState(false)

  const laadRapport = useCallback(async (forceer = false) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (forceer) setVernieuwen(true)
    else setLaden(true)

    try {
      const url = forceer ? '/api/inzichten/weekrapport?refresh=1' : '/api/inzichten/weekrapport'
      const res = await authFetch(url)
      if (res.status === 403) {
        setPremiumNodig(true)
      } else if (res.ok) {
        const json = await res.json() as WeekRapportResponse
        setData(json)
      } else {
        toast({ variant: 'error', title: 'Inzichten niet geladen', description: 'Probeer het later opnieuw.' })
      }
    } catch {
      toast({ variant: 'error', title: 'Inzichten niet geladen', description: 'Controleer je verbinding en probeer het opnieuw.' })
    } finally {
      setLaden(false)
      setVernieuwen(false)
    }
  }, [router, toast])

  useEffect(() => { laadRapport() }, [laadRapport])

  const rapport = data?.rapport ?? null
  const stats = rapport?.stats ?? null

  const stemmingKleur = (v: number | null) =>
    v === null ? 'var(--text-4)' : v >= 4 ? 'var(--mf-green)' : v >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)'

  const slaapKleur = (v: number | null) =>
    v === null ? 'var(--text-4)' : v >= 7 ? 'var(--mf-green)' : v >= 5 ? 'var(--mf-amber)' : 'var(--mf-red)'

  const rustKleur = (stress: number | null) => {
    if (stress === null) return 'var(--text-4)'
    const rust = 10 - stress
    return rust >= 7 ? 'var(--mf-green)' : rust >= 5 ? 'var(--mf-amber)' : 'var(--mf-red)'
  }

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 900, margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Wekelijkse inzichten
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>AI-analyse van jouw afgelopen 7 dagen</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => laadRapport(true)}
            loading={vernieuwen}
            leftIcon={<RefreshCw size={13} aria-hidden />}
          >
            {vernieuwen ? 'Laden…' : 'Vernieuwen'}
          </Button>
        </header>

        {premiumNodig && (
          <PremiumSlot
            titel="Wekelijkse AI-inzichten"
            omschrijving="Vita analyseert elke week jouw check-ins, slaap, stemming en beweging en vertaalt ze naar één helder verhaal met een concrete tip."
          />
        )}

        {/* Lege staat */}
        {!premiumNodig && !rapport && (
          <VitaLeegScherm
            emotion="curious"
            titel="Je inzichten groeien met je mee"
            boodschap={data?.bericht ?? 'Doe deze week een paar check-ins, dan maak ik voor jou een analyse van hoe je week ervoor stond. Hoe meer je bijhoudt, hoe scherper het beeld.'}
            actieLabel="Doe een check-in"
            actieHref="/home"
          />
        )}

        {rapport && (
          <div className="mf-home-layout">
            {/* Left: score + stats */}
            <div>
              {/* Score label banner */}
              {(() => {
                const kleur = scoreLabelKleur(rapport.score_label)
                return (
                  <div style={{
                    background: 'var(--bg-card)',
                    border: `1.5px solid ${kleur}`,
                    borderRadius: 'var(--radius-xl)', padding: '16px 20px', marginBottom: 18,
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: kleur, margin: 0, letterSpacing: '-0.02em' }}>
                      {rapport.score_label}
                    </p>
                    {data?.week_start && (
                      <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, fontWeight: 500 }}>
                        Week van {new Date(data.week_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Progress rings */}
              {stats && (
                <Card style={{
                  padding: '22px 16px', marginBottom: 14,
                  display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                }}>
                  <MetriekRing
                    value={stats.stemming ?? 0}
                    max={5}
                    kleur={stemmingKleur(stats.stemming)}
                    label="Stemming"
                    eenheid="/5"
                  />
                  <MetriekRing
                    value={stats.slaap ?? 0}
                    max={9}
                    kleur={slaapKleur(stats.slaap)}
                    label="Slaap"
                    eenheid="u"
                  />
                  <MetriekRing
                    value={stats.stress !== null ? 10 - stats.stress : 0}
                    max={10}
                    kleur={rustKleur(stats.stress)}
                    label="Rust"
                    eenheid="/10"
                  />
                </Card>
              )}

              {/* Stats kaartjes */}
              {stats && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <StatKaart
                    waarde={stats.aantal_checkins}
                    label="Check-ins"
                    kleur={stats.aantal_checkins >= 3 ? 'var(--mf-green)' : 'var(--mf-amber)'}
                  />
                  <StatKaart
                    waarde={stats.dankbaarheid_items}
                    label="Dankbaarheid"
                    kleur={stats.dankbaarheid_items >= 5 ? 'var(--mf-green)' : stats.dankbaarheid_items >= 2 ? 'var(--mf-amber)' : 'var(--text-4)'}
                  />
                </div>
              )}
            </div>

            {/* Right: analyse tekst */}
            <div>
              {/* Samenvatting */}
              <Card style={{ padding: '18px', marginBottom: 14 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 10,
                }}>
                  Samenvatting
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{rapport.samenvatting}</p>
              </Card>

              {/* Patroon */}
              <Card style={{ padding: '16px', marginBottom: 14 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8,
                }}>
                  Patroon
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{rapport.patroon}</p>
              </Card>

              {/* Tip */}
              <div style={{
                background: 'var(--mf-green-light)', borderRadius: 'var(--radius-card)', padding: '16px',
                border: '1px solid var(--mf-green-mid)',
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--mf-green-dark)', marginBottom: 8,
                }}>
                  Tip van de week
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{rapport.tip}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
