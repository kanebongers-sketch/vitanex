'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo, type CSSProperties } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { CoachHeader, CoachSection, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import {
  DIEETVOORKEUREN,
  DIEETVOORKEUR_LABELS,
  macroVerdeling,
  type Dieetvoorkeur,
  type MacroVerdeling,
  type VoedingRichtlijn,
} from '@/lib/coaching/voeding'
import { Apple, Save, Flame, ShieldAlert, Check } from 'lucide-react'

const SELECT_STYLE: CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 15, lineHeight: 1.4,
  color: 'var(--text-1)', background: 'var(--bg-subtle)',
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
  outline: 'none', cursor: 'pointer',
}

// Semantische kleuren per macro — hergebruik van de bestaande app-tokens.
const MACRO_STIJL = {
  eiwit:       { kleur: 'var(--mf-green)',  bg: 'var(--mf-green-light)' },
  koolhydraat: { kleur: 'var(--mf-amber)',  bg: 'var(--mf-amber-light)' },
  vet:         { kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
} as const

interface FormWaarden {
  calorie_doel: string
  eiwit_g: string
  koolhydraat_g: string
  vet_g: string
  dieetvoorkeur: Dieetvoorkeur
  richtlijn_tekst: string
}

const LEEG: FormWaarden = {
  calorie_doel: '', eiwit_g: '', koolhydraat_g: '', vet_g: '', dieetvoorkeur: 'geen', richtlijn_tekst: '',
}

function naarForm(r: VoedingRichtlijn): FormWaarden {
  return {
    calorie_doel: r.calorie_doel?.toString() ?? '',
    eiwit_g: r.eiwit_g?.toString() ?? '',
    koolhydraat_g: r.koolhydraat_g?.toString() ?? '',
    vet_g: r.vet_g?.toString() ?? '',
    dieetvoorkeur: r.dieetvoorkeur ?? 'geen',
    richtlijn_tekst: r.richtlijn_tekst ?? '',
  }
}

/** Leeg veld → null; anders het getal (server valideert de grenzen). */
function parseNum(waarde: string): number | null {
  const schoon = waarde.trim()
  if (schoon === '') return null
  const n = Number(schoon)
  return Number.isFinite(n) ? n : null
}

// Live macro-verdeling als premium segmentbalk + legenda (puur presentational).
function MacroBalk({ verdeling }: { verdeling: MacroVerdeling }) {
  const segmenten = [
    { key: 'eiwit', label: 'Eiwit', pct: verdeling.eiwit_pct, ...MACRO_STIJL.eiwit },
    { key: 'koolhydraat', label: 'Koolhydraten', pct: verdeling.koolhydraat_pct, ...MACRO_STIJL.koolhydraat },
    { key: 'vet', label: 'Vet', pct: verdeling.vet_pct, ...MACRO_STIJL.vet },
  ] as const

  return (
    <div aria-label="Berekende macroverdeling">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="mf-overline" style={{ color: 'var(--text-3)' }}>Verdeling</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--mf-green)', fontVariantNumeric: 'tabular-nums' }}>
          <Flame size={13} aria-hidden /> {verdeling.totaal_kcal} kcal uit macro&apos;s
        </span>
      </div>
      <div style={{ display: 'flex', height: 9, borderRadius: 100, overflow: 'hidden', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
        {segmenten.map(s => s.pct > 0 && (
          <span key={s.key} aria-hidden style={{ width: `${s.pct}%`, background: s.kleur }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
        {segmenten.map(s => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-3)' }}>
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: s.kleur, flexShrink: 0 }} />
            {s.label} <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{s.pct}%</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function KlantVoedingPagina() {
  const router = useRouter()
  const { klantId } = useParams<{ klantId: string }>()

  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [bestaand, setBestaand] = useState<VoedingRichtlijn | null>(null)
  const [waarden, setWaarden] = useState<FormWaarden>(LEEG)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [opgeslagen, setOpgeslagen] = useState(false)

  const laadRichtlijn = useCallback(async () => {
    const res = await authFetch(`/api/coaching/voeding?klant=${klantId}`)
    if (res.ok) {
      const data = await res.json() as { richtlijn: VoedingRichtlijn | null }
      setBestaand(data.richtlijn)
      setWaarden(data.richtlijn ? naarForm(data.richtlijn) : LEEG)
    } else {
      setNietGevonden(true)
    }
  }, [klantId])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) { router.push('/home'); return }
      await laadRichtlijn()
      setLaden(false)
    }
    laad()
  }, [router, laadRichtlijn])

  function zet<K extends keyof FormWaarden>(sleutel: K, waarde: FormWaarden[K]) {
    setWaarden(prev => ({ ...prev, [sleutel]: waarde }))
    setOpgeslagen(false)
  }

  // Live macro-verdeling (pure rekensom) voor directe feedback aan de coach.
  const verdeling = useMemo(() => macroVerdeling({
    eiwit_g: parseNum(waarden.eiwit_g),
    koolhydraat_g: parseNum(waarden.koolhydraat_g),
    vet_g: parseNum(waarden.vet_g),
  }), [waarden.eiwit_g, waarden.koolhydraat_g, waarden.vet_g])

  async function bewaar() {
    if (bezig) return
    setBezig(true)
    setFout(null)

    const velden = {
      calorie_doel: parseNum(waarden.calorie_doel),
      eiwit_g: parseNum(waarden.eiwit_g),
      koolhydraat_g: parseNum(waarden.koolhydraat_g),
      vet_g: parseNum(waarden.vet_g),
      dieetvoorkeur: waarden.dieetvoorkeur,
      richtlijn_tekst: waarden.richtlijn_tekst,
    }

    // Bestaat er al een actieve richtlijn? Dan in-place bijwerken (PATCH),
    // anders een nieuwe opstellen (POST).
    const res = bestaand
      ? await authFetch('/api/coaching/voeding', {
          method: 'PATCH',
          body: JSON.stringify({ id: bestaand.id, ...velden }),
        })
      : await authFetch('/api/coaching/voeding', {
          method: 'POST',
          body: JSON.stringify({ klant_id: klantId, ...velden }),
        })

    const data = await res.json() as { richtlijn?: VoedingRichtlijn; error?: string }
    setBezig(false)
    if (res.ok && data.richtlijn) {
      setBestaand(data.richtlijn)
      setWaarden(naarForm(data.richtlijn))
      setOpgeslagen(true)
    } else {
      setFout(data.error ?? 'Opslaan mislukt.')
    }
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 780, margin: '0 auto' }}>
        <CoachHeader
          eyebrow="Voeding"
          titel="Voedingsrichtlijn"
          subtitel="Stel een persoonlijke richtlijn en dagdoelen op. Je klant ziet deze terug bij Mijn voeding."
          backHref={`/coaching/${klantId}`}
          backLabel="Terug naar klant"
          rechts={
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
              borderRadius: 999, fontSize: 12.5, fontWeight: 700,
              color: 'var(--mf-green)', background: 'var(--mf-green-light)',
              border: '1px solid color-mix(in srgb, var(--mf-green) 30%, transparent)',
            }}>
              <Apple size={14} aria-hidden /> {bestaand ? 'Actieve richtlijn' : 'Nieuwe richtlijn'}
            </span>
          }
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : nietGevonden ? (
          <CoachEmpty
            icon={ShieldAlert}
            toon="wacht"
            titel="Klant niet gevonden"
            tekst="Deze klant is niet (actief) aan jou gekoppeld."
          />
        ) : (
          <>
            <CoachSection titel="Dagdoelen">
              <Card className="mf-card-glow mf-animate-up mf-delay-1" style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Field label="Calorieën per dag (kcal)" hint="Optioneel — laat leeg als je geen caloriedoel wilt opgeven.">
                    <Input type="number" inputMode="numeric" min={800} max={8000} placeholder="Bijv. 2200"
                      value={waarden.calorie_doel} onChange={e => zet('calorie_doel', e.target.value)} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <Field label="Eiwit (g)">
                      <Input type="number" inputMode="numeric" min={0} max={1000} placeholder="0"
                        value={waarden.eiwit_g} onChange={e => zet('eiwit_g', e.target.value)} />
                    </Field>
                    <Field label="Koolhydraten (g)">
                      <Input type="number" inputMode="numeric" min={0} max={1500} placeholder="0"
                        value={waarden.koolhydraat_g} onChange={e => zet('koolhydraat_g', e.target.value)} />
                    </Field>
                    <Field label="Vet (g)">
                      <Input type="number" inputMode="numeric" min={0} max={1000} placeholder="0"
                        value={waarden.vet_g} onChange={e => zet('vet_g', e.target.value)} />
                    </Field>
                  </div>

                  {verdeling && <MacroBalk verdeling={verdeling} />}
                </div>
              </Card>
            </CoachSection>

            <CoachSection titel="Persoonlijke richtlijn">
              <Card className="mf-animate-up mf-delay-2" style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Field label="Dieetvoorkeur">
                    <select className="mf-coach-select" style={SELECT_STYLE} value={waarden.dieetvoorkeur}
                      onChange={e => zet('dieetvoorkeur', e.target.value as Dieetvoorkeur)}>
                      {DIEETVOORKEUREN.map(d => <option key={d} value={d}>{DIEETVOORKEUR_LABELS[d]}</option>)}
                    </select>
                  </Field>

                  <Field label="Richtlijn & toelichting" hint="Bijv. focus op eiwit bij elke maaltijd, 2 stuks fruit per dag, water bij het ontbijt.">
                    <Textarea rows={5} maxLength={4000} placeholder="Schrijf de persoonlijke voedingsrichtlijn voor deze klant."
                      value={waarden.richtlijn_tekst} onChange={e => zet('richtlijn_tekst', e.target.value)} />
                  </Field>
                </div>
              </Card>
            </CoachSection>

            {fout && <p role="alert" style={{ fontSize: 13, color: 'var(--mf-red)', margin: '0 0 14px' }}>{fout}</p>}

            <div className="mf-animate-up mf-delay-3" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Button onClick={bewaar} loading={bezig} leftIcon={<Save size={15} aria-hidden />}>
                {bestaand ? 'Richtlijn bijwerken' : 'Richtlijn opstellen'}
              </Button>
              {opgeslagen && (
                <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--mf-green)' }}>
                  <Check size={15} aria-hidden /> Opgeslagen
                </span>
              )}
            </div>

            <p className="mf-caption" style={{ marginTop: 22, lineHeight: 1.6, maxWidth: '60ch' }}>
              Coaching is geen medische of diëtistische behandeling. Deel geen richtlijn die een medische diagnose vereist;
              verwijs bij twijfel naar een arts of diëtist.
            </p>

            <style>{`
              .mf-coach-select:focus-visible {
                border-color: var(--mentaforce-primary);
                box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
                outline: none;
              }
            `}</style>
          </>
        )}
      </main>
    </div>
  )
}
