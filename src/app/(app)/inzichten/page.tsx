'use client'

// ─── Wekelijkse inzichten — jouw week in één rustige blik ─────────────────────
// Volgorde is bewust: eerst de kernboodschap van deze week (echte AI-samenvatting
// of een eerlijke melding dat die er nog niet is), dan de cijfers met duiding,
// dan patroon en tip. Skeleton spiegelt de layout; geen spinner, geen shift.

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import VitaLeegScherm from '@/components/vita/VitaLeegScherm'
import { PremiumSlot } from '@/components/ui/PremiumSlot'
import MetriekenPaneel from './MetriekenPaneel'
import WeekdoelenBlok from './WeekdoelenBlok'
import {
  heeftWeekData, scoreLabelKleur, type Rapport, type WeekRapportResponse,
} from './weekrapport'

/** Skeleton met dezelfde bloklayout als de geladen pagina — geen layout-shift. */
function LaadStaat() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">Je weekinzichten worden geladen.</p>
      <div aria-hidden="true">
        <div className="mf-skeleton" style={{ height: 104, borderRadius: 'var(--radius-card)', marginBottom: 16 }} />
        <div className="mf-home-layout">
          <div>
            <div className="mf-skeleton" style={{ height: 196, borderRadius: 'var(--radius-card)', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div className="mf-skeleton" style={{ height: 72, borderRadius: 'var(--radius-card)', flex: 1 }} />
              <div className="mf-skeleton" style={{ height: 72, borderRadius: 'var(--radius-card)', flex: 1 }} />
            </div>
          </div>
          <div>
            <div className="mf-skeleton" style={{ height: 108, borderRadius: 'var(--radius-card)', marginBottom: 14 }} />
            <div className="mf-skeleton" style={{ height: 108, borderRadius: 'var(--radius-card)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Kernboodschap bovenaan: score-label + de echte samenvatting van deze week. */
function KernKaart({ rapport, weekStart }: { rapport: Rapport; weekStart: string | undefined }) {
  const kleur = scoreLabelKleur(rapport.score_label)
  const weekDatum = weekStart
    ? new Date(weekStart).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
    : null

  return (
    <Card style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {rapport.score_label && (
          <span style={{
            fontSize: 12, fontWeight: 700, color: kleur, letterSpacing: '0.02em',
            border: `1.5px solid ${kleur}`, borderRadius: 100, padding: '3px 12px',
          }}>
            {rapport.score_label}
          </span>
        )}
        {weekDatum && (
          <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>
            Week van {weekDatum}
          </span>
        )}
      </div>
      <p style={{ fontSize: 15, color: 'var(--text-1)', lineHeight: 1.7, margin: 0 }}>
        {rapport.samenvatting
          ?? 'De samenvatting van deze week is nog niet beschikbaar. Je echte weekcijfers staan hieronder — probeer later "Vernieuwen" voor het volledige verhaal.'}
      </p>
    </Card>
  )
}

function TekstKaart({ titel, tekst }: { titel: string; tekst: string }) {
  return (
    <Card style={{ padding: '16px 18px', marginBottom: 14 }}>
      <p className="mf-section-label" style={{ marginBottom: 8 }}>{titel}</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>{tekst}</p>
    </Card>
  )
}

function TipKaart({ tekst }: { tekst: string }) {
  return (
    <div style={{
      background: 'var(--mf-green-light)', borderRadius: 'var(--radius-card)',
      padding: '16px 18px', border: '1px solid var(--mf-green-mid)',
    }}>
      <p className="mf-section-label" style={{ color: 'var(--mf-green-dark)', marginBottom: 8 }}>
        Tip van de week
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>{tekst}</p>
    </div>
  )
}

export default function InzichtenPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [vernieuwen, setVernieuwen] = useState(false)
  const [data, setData] = useState<WeekRapportResponse | null>(null)
  const [premiumNodig, setPremiumNodig] = useState(false)
  // Ringen starten op 0 en vullen pas ná de eerste paint — zacht inlopen.
  const [animKlaar, setAnimKlaar] = useState(false)

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

  // Uitgesteld naar een microtask (zelfde patroon als home) — geen synchrone
  // setState in het effect, dus geen cascading render.
  useEffect(() => { void Promise.resolve().then(() => laadRapport()) }, [laadRapport])

  useEffect(() => {
    if (!data || animKlaar) return
    // Dubbele rAF: eerst de 0-staat laten schilderen, dan pas vullen.
    let binnenste = 0
    const buitenste = requestAnimationFrame(() => {
      binnenste = requestAnimationFrame(() => setAnimKlaar(true))
    })
    return () => {
      cancelAnimationFrame(buitenste)
      cancelAnimationFrame(binnenste)
    }
  }, [data, animKlaar])

  const rapport = data?.rapport ?? null
  const heeftData = rapport !== null && heeftWeekData(rapport.stats)
  const heeftAiTekst = rapport?.samenvatting != null
  const heeftInhoud = heeftAiTekst || heeftData

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 900, margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Wekelijkse inzichten
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
              Jouw week in één rustige blik — op basis van wat je echt logde.
            </p>
          </div>
          {!premiumNodig && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => laadRapport(true)}
              loading={vernieuwen}
              leftIcon={<RefreshCw size={13} aria-hidden />}
            >
              {vernieuwen ? 'Laden…' : 'Vernieuwen'}
            </Button>
          )}
        </header>

        {premiumNodig && (
          <PremiumSlot
            titel="Wekelijkse AI-inzichten"
            omschrijving="Vita analyseert elke week jouw check-ins, slaap, stemming en beweging en vertaalt ze naar één helder verhaal met een concrete tip."
          />
        )}

        {!premiumNodig && laden && <LaadStaat />}

        {/* Lege staat — eerlijk: geen data, dus geen rapport */}
        {!premiumNodig && !laden && !heeftInhoud && (
          <VitaLeegScherm
            emotion="curious"
            titel="Je inzichten groeien met je mee"
            boodschap={data?.bericht ?? 'Doe deze week een paar check-ins, dan maak ik voor jou een analyse van hoe je week ervoor stond. Hoe meer je bijhoudt, hoe scherper het beeld.'}
            actieLabel="Doe een check-in"
            actieHref="/home"
          />
        )}

        {!premiumNodig && !laden && rapport && heeftInhoud && (
          <>
            {/* 1. Kernboodschap — direct zichtbaar, zonder kliks */}
            <KernKaart rapport={rapport} weekStart={data?.week_start} />

            {/* 2. Cijfers met duiding + 3. patroon en tip */}
            {heeftAiTekst ? (
              <div className="mf-home-layout">
                <MetriekenPaneel stats={rapport.stats} animKlaar={animKlaar} />
                <div>
                  {rapport.patroon && <TekstKaart titel="Patroon" tekst={rapport.patroon} />}
                  {rapport.tip && <TipKaart tekst={rapport.tip} />}
                </div>
              </div>
            ) : (
              <MetriekenPaneel stats={rapport.stats} animKlaar={animKlaar} />
            )}
          </>
        )}

        {/* 4. Weekdoelen — bewust het enige localStorage-blok op dit scherm;
            al het andere komt uit de weekrapport-API (zie WeekdoelenBlok). */}
        {!premiumNodig && !laden && <WeekdoelenBlok />}
      </main>
    </div>
  )
}
