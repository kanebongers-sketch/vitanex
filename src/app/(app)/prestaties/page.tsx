'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/ui/Ring'
import { Chart } from '@/components/ui/Chart'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  berekenLeeftijd,
  berekenBMR,
  berekenTDEE,
  berekenBMI,
  effectieveDoelen,
  DOEL_CONFIG,
  type DoelProfiel,
  type FitnessDoel,
} from '@/lib/gezondheid-berekeningen'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProfielRij {
  gewicht_kg: number | null
  lengte_cm: number | null
  geboortedatum: string | null
  geslacht: DoelProfiel['geslacht']
  activiteitsniveau: DoelProfiel['activiteitsniveau']
  fitness_doel: FitnessDoel | null
  streefgewicht_kg: number | null
  vetpercentage: number | null
  calorie_doel: number | null
}

interface Meting {
  id: string
  datum: string
  gewicht_kg: number | null
  vetpercentage: number | null
  notitie: string | null
  aangemaakt_op: string
}

// ─── Hulpfuncties ───────────────────────────────────────────────────────────────

function formatDatumKort(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

/** Voortgang richting streefgewicht: 0–100% op basis van start (eerste meting) → streef. */
function streefVoortgang(
  huidig: number | null,
  streef: number | null,
  start: number | null,
): number | null {
  if (huidig === null || streef === null || start === null) return null
  const totaal = start - streef
  if (Math.abs(totaal) < 0.01) return huidig === streef ? 100 : 0
  const gedaan = start - huidig
  return Math.max(0, Math.min(100, Math.round((gedaan / totaal) * 100)))
}

// ─── Herbruikbare UI-bouwstenen ──────────────────────────────────────────────────

function Kaart({
  titel,
  children,
  span = 1,
}: {
  titel: string
  children: React.ReactNode
  span?: 1 | 2
}) {
  return (
    <Card
      role="group"
      aria-label={titel}
      style={{
        gridColumn: span === 2 ? '1 / -1' : 'auto',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.25rem 1.5rem',
      }}
    >
      <h2
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-3)',
          margin: '0 0 0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {titel}
      </h2>
      {children}
    </Card>
  )
}

function MetriekTegel({
  label,
  waarde,
  eenheid,
  sub,
  kleur,
}: {
  label: string
  waarde: string
  eenheid?: string
  sub?: string
  kleur?: string
}) {
  return (
    <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '0.875rem 1rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ margin: '0.35rem 0 0', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: kleur ?? 'var(--text-1)', letterSpacing: '-0.02em' }}>
          {waarde}
        </span>
        {eenheid && <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-3)' }}>{eenheid}</span>}
      </p>
      {sub && <p style={{ fontSize: '0.72rem', color: kleur ?? 'var(--text-3)', margin: '0.25rem 0 0', fontWeight: 600 }}>{sub}</p>}
    </div>
  )
}

// ─── Pagina ──────────────────────────────────────────────────────────────────────

export default function PrestatiesPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [profiel, setProfiel] = useState<ProfielRij | null>(null)
  const [metingen, setMetingen] = useState<Meting[]>([])

  const [gewichtInput, setGewichtInput] = useState('')
  const [vetInput, setVetInput] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [veldFout, setVeldFout] = useState<'gewicht' | 'vet' | null>(null)

  async function laadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [profielRes, metingenRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('gewicht_kg, lengte_cm, geboortedatum, geslacht, activiteitsniveau, fitness_doel, streefgewicht_kg, vetpercentage, calorie_doel')
        .eq('id', user.id)
        .maybeSingle(),
      authFetch('/api/lichaamsmetingen'),
    ])

    if (profielRes.data) setProfiel(profielRes.data as ProfielRij)

    if (metingenRes.ok) {
      const json = await metingenRes.json() as { metingen: Meting[] }
      setMetingen(json.metingen)
    }

    setLaden(false)
  }

  useEffect(() => {
    // setState volgt pas na await in laadData — veilig.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    laadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Afgeleide waarden ────────────────────────────────────────────────────────

  const doelProfiel: DoelProfiel | null = useMemo(() => {
    if (!profiel) return null
    return {
      gewicht_kg: profiel.gewicht_kg,
      lengte_cm: profiel.lengte_cm,
      geboortedatum: profiel.geboortedatum,
      geslacht: profiel.geslacht,
      activiteitsniveau: profiel.activiteitsniveau,
      fitness_doel: profiel.fitness_doel,
      calorie_doel: profiel.calorie_doel,
    }
  }, [profiel])

  const huidigGewicht = profiel?.gewicht_kg ?? null
  const bmr = doelProfiel ? berekenBMR(doelProfiel) : null
  const tdee = doelProfiel ? berekenTDEE(doelProfiel) : null
  const calorieDoel = doelProfiel ? effectieveDoelen(doelProfiel).calorie_doel : null
  const bmi = berekenBMI(huidigGewicht, profiel?.lengte_cm ?? null)
  const leeftijd = berekenLeeftijd(profiel?.geboortedatum)
  const doelCfg = profiel?.fitness_doel ? DOEL_CONFIG[profiel.fitness_doel] : null

  // Trend chronologisch (oudste → nieuwste) voor de grafiek.
  const trend = useMemo(
    () =>
      [...metingen]
        .sort((a, b) => a.datum.localeCompare(b.datum))
        .map(m => ({
          datum: formatDatumKort(m.datum),
          gewicht: m.gewicht_kg ?? null,
          vet: m.vetpercentage ?? null,
        })),
    [metingen],
  )

  const startGewicht = trend.length > 0 ? trend[0].gewicht : huidigGewicht
  const voortgang = streefVoortgang(huidigGewicht, profiel?.streefgewicht_kg ?? null, startGewicht)
  const heeftVet = trend.some(p => p.vet !== null)

  // ─── Meting loggen ────────────────────────────────────────────────────────────

  async function logMeting() {
    if (bezig) return
    setFout(null)
    setVeldFout(null)

    const gewicht = parseFloat(gewichtInput.replace(',', '.'))
    if (!Number.isFinite(gewicht) || gewicht < 20 || gewicht > 400) {
      setFout('Voer een gewicht in tussen 20 en 400 kg.')
      setVeldFout('gewicht')
      return
    }

    let vet: number | undefined
    if (vetInput.trim()) {
      const v = parseFloat(vetInput.replace(',', '.'))
      if (!Number.isFinite(v) || v < 0 || v > 70) {
        setFout('Vetpercentage moet tussen 0 en 70% liggen.')
        setVeldFout('vet')
        return
      }
      vet = v
    }

    setBezig(true)

    const res = await authFetch('/api/lichaamsmetingen', {
      method: 'POST',
      body: JSON.stringify({ gewicht_kg: gewicht, vetpercentage: vet ?? null }),
    })

    if (res.ok) {
      setGewichtInput('')
      setVetInput('')
      toast({ title: 'Meting opgeslagen', variant: 'success' })
      await laadData()
    } else {
      const json = await res.json() as { error?: string }
      const melding = json.error ?? 'Opslaan mislukt. Probeer opnieuw.'
      setFout(melding)
      toast({ title: 'Opslaan mislukt', description: melding, variant: 'error' })
    }

    setBezig(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

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

  const profielOnvolledig = bmr === null || tdee === null || calorieDoel === null
  const ringKleur = voortgang !== null ? (doelCfg?.kleur ?? 'var(--mf-green)') : 'var(--bg-subtle)'

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: '3rem' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Header */}
          <header style={{ paddingTop: '2rem', marginBottom: '1.25rem' }}>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: '0 0 6px' }}>
              Jouw lichaam in cijfers
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>
                Prestaties
              </h1>
              {doelCfg && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.3rem 0.75rem',
                    borderRadius: 100,
                    background: 'color-mix(in srgb, ' + doelCfg.kleur + ' 14%, transparent)',
                    color: doelCfg.kleur,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: doelCfg.kleur }} />
                  {doelCfg.label}
                </span>
              )}
            </div>
          </header>

          {/* Hero — gewicht + streefgewicht-ring */}
          <Card
            aria-label="Gewicht en streefdoel"
            style={{
              boxShadow: 'var(--shadow-md)',
              padding: '1.75rem 1.5rem',
              marginBottom: '1rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <Ring
              value={voortgang ?? 0}
              ariaLabel={
                voortgang !== null
                  ? `Voortgang richting streefgewicht: ${voortgang}%. Huidig gewicht ${huidigGewicht ?? '–'} kg.`
                  : `Huidig gewicht ${huidigGewicht ?? '–'} kg`
              }
              size={132}
              thickness={11}
              color={ringKleur}
            >
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {huidigGewicht !== null ? huidigGewicht : '–'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600 }}>kg</span>
              </span>
            </Ring>

            <div style={{ flex: 1, minWidth: 200 }}>
              {profiel?.streefgewicht_kg && huidigGewicht !== null ? (
                <>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: 0, fontWeight: 600 }}>
                    Richting streefgewicht
                  </p>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '1.05rem', color: 'var(--text-1)', fontWeight: 700 }}>
                    {huidigGewicht} kg{' '}
                    <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>→ {profiel.streefgewicht_kg} kg</span>
                  </p>
                  <div style={{ marginTop: 12, height: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        transform: `scaleX(${(voortgang ?? 0) / 100})`,
                        transformOrigin: 'left center',
                        background: doelCfg?.kleur ?? 'var(--mf-green)',
                        borderRadius: 100,
                        transition: 'transform 0.7s var(--ease)',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.5rem 0 0' }}>
                    {voortgang}% van je doel · nog{' '}
                    <strong style={{ color: 'var(--text-1)' }}>
                      {Math.abs(Math.round((huidigGewicht - profiel.streefgewicht_kg) * 10) / 10)} kg
                    </strong>{' '}
                    te gaan
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: 0, fontWeight: 600 }}>Huidig gewicht</p>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '1.05rem', color: 'var(--text-2)' }}>
                    Stel een streefgewicht in via Instellingen om je voortgang te volgen.
                  </p>
                </>
              )}
            </div>
          </Card>

          {/* Metriek-grid */}
          <section
            aria-label="Lichaamsmetrieken"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}
          >
            <MetriekTegel
              label="Vetpercentage"
              waarde={profiel?.vetpercentage !== null && profiel?.vetpercentage !== undefined ? String(profiel.vetpercentage) : '–'}
              eenheid={profiel?.vetpercentage != null ? '%' : undefined}
              sub="Zelf ingevoerd"
            />
            <MetriekTegel
              label="BMI"
              waarde={bmi ? String(bmi.waarde) : '–'}
              sub={bmi?.label}
              kleur={bmi?.kleur}
            />
            <MetriekTegel
              label="Leeftijd"
              waarde={leeftijd !== null ? String(leeftijd) : '–'}
              eenheid={leeftijd !== null ? 'jr' : undefined}
            />
          </section>

          {/* Stofwisseling */}
          <div style={{ marginBottom: '1rem' }}>
            <Kaart titel="Stofwisseling">
              {profielOnvolledig ? (
                <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Je profiel is nog onvolledig. Vul je gewicht, lengte, geboortedatum en
                  activiteitsniveau in bij Instellingen om je verbranding te berekenen.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <MetriekTegel label="BMR" waarde={String(bmr)} eenheid="kcal" sub="In rust" kleur="var(--mf-blue)" />
                  <MetriekTegel label="TDEE" waarde={String(tdee)} eenheid="kcal" sub="Met activiteit" kleur="var(--mf-purple)" />
                  <MetriekTegel label="Caloriedoel" waarde={String(calorieDoel)} eenheid="kcal" sub={doelCfg?.label ?? 'Doel'} kleur="var(--mf-green)" />
                </div>
              )}
            </Kaart>
          </div>

          {/* Trendgrafiek */}
          <div style={{ marginBottom: '1rem' }}>
            <Kaart titel="Trend">
              {trend.length < 2 ? (
                <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Log minstens twee metingen om je trend te zien.
                </p>
              ) : (
                <Chart
                  type="line"
                  data={trend}
                  xKey="datum"
                  series={
                    heeftVet
                      ? [
                          { key: 'gewicht', label: 'Gewicht (kg)', color: 'var(--mf-blue-mid)' },
                          { key: 'vet', label: 'Vet (%)', color: 'var(--mf-amber)' },
                        ]
                      : [{ key: 'gewicht', label: 'Gewicht (kg)', color: 'var(--mf-blue-mid)' }]
                  }
                  summary={
                    heeftVet
                      ? 'Trend van gewicht in kilogram en vetpercentage per meetdatum.'
                      : 'Trend van gewicht in kilogram per meetdatum.'
                  }
                  height={260}
                  showLegend
                />
              )}
            </Kaart>
          </div>

          {/* Nieuwe meting */}
          <Kaart titel="Nieuwe meting loggen">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <Field label="Gewicht (kg)" error={veldFout === 'gewicht' ? (fout ?? undefined) : undefined}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={20}
                    max={400}
                    step="0.1"
                    value={gewichtInput}
                    onChange={e => setGewichtInput(e.target.value)}
                    placeholder="bijv. 78.5"
                  />
                </Field>
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <Field label="Vetpercentage (%) · optioneel" error={veldFout === 'vet' ? (fout ?? undefined) : undefined}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={70}
                    step="0.1"
                    value={vetInput}
                    onChange={e => setVetInput(e.target.value)}
                    placeholder="bijv. 18"
                  />
                </Field>
              </div>
            </div>

            <Button
              onClick={logMeting}
              loading={bezig}
              disabled={bezig || !gewichtInput}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {bezig ? 'Opslaan…' : 'Meting opslaan'}
            </Button>

            {metingen.length > 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-4)', margin: '0.875rem 0 0', textAlign: 'center' }}>
                {metingen.length} {metingen.length === 1 ? 'meting' : 'metingen'} vastgelegd · laatste op{' '}
                {formatDatumKort(metingen[0].datum)}
              </p>
            )}
          </Kaart>
        </div>
      </main>
    </>
  )
}
