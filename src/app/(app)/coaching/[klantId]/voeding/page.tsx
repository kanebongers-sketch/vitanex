'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo, type CSSProperties } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  DIEETVOORKEUREN,
  DIEETVOORKEUR_LABELS,
  macroVerdeling,
  type Dieetvoorkeur,
  type VoedingRichtlijn,
} from '@/lib/coaching/voeding'
import { ArrowLeft, Apple, Save, Flame } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 760, margin: '0 auto' }}>

        <Link href={`/coaching/${klantId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={15} aria-hidden /> Terug naar klant
        </Link>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Voedingsrichtlijn
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Stel een persoonlijke richtlijn en dagdoelen op. Je klant ziet deze terug bij <strong>Mijn voeding</strong>.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : nietGevonden ? (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Klant niet gevonden</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Deze klant is niet (actief) aan jou gekoppeld.</p>
          </Card>
        ) : (
          <Card style={{ padding: '22px 24px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Apple size={16} aria-hidden style={{ color: 'var(--mf-green)' }} />
              {bestaand ? 'Richtlijn bijwerken' : 'Nieuwe richtlijn'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

              {verdeling && (
                <div aria-label="Berekende macroverdeling" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>Verdeling ({verdeling.totaal_kcal} kcal uit macro's):</span>
                  <span style={{ color: MACRO_STIJL.eiwit.kleur, fontWeight: 700 }}>{verdeling.eiwit_pct}% eiwit</span>
                  <span style={{ color: MACRO_STIJL.koolhydraat.kleur, fontWeight: 700 }}>{verdeling.koolhydraat_pct}% kh</span>
                  <span style={{ color: MACRO_STIJL.vet.kleur, fontWeight: 700 }}>{verdeling.vet_pct}% vet</span>
                </div>
              )}

              <Field label="Dieetvoorkeur">
                <select style={SELECT_STYLE} value={waarden.dieetvoorkeur}
                  onChange={e => zet('dieetvoorkeur', e.target.value as Dieetvoorkeur)}>
                  {DIEETVOORKEUREN.map(d => <option key={d} value={d}>{DIEETVOORKEUR_LABELS[d]}</option>)}
                </select>
              </Field>

              <Field label="Richtlijn & toelichting" hint="Bijv. focus op eiwit bij elke maaltijd, 2 stuks fruit per dag, water bij het ontbijt.">
                <Textarea rows={5} maxLength={4000} placeholder="Schrijf de persoonlijke voedingsrichtlijn voor deze klant."
                  value={waarden.richtlijn_tekst} onChange={e => zet('richtlijn_tekst', e.target.value)} />
              </Field>

              {fout && <p role="alert" style={{ fontSize: 13, color: 'var(--mf-red)', margin: 0 }}>{fout}</p>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button onClick={bewaar} loading={bezig} leftIcon={<Save size={15} aria-hidden />}>
                  {bestaand ? 'Richtlijn bijwerken' : 'Richtlijn opstellen'}
                </Button>
                {opgeslagen && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--mf-green)' }}>
                    <Flame size={14} aria-hidden /> Opgeslagen
                  </span>
                )}
              </div>
            </div>
          </Card>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 16, lineHeight: 1.6 }}>
          Coaching is geen medische of diëtistische behandeling. Deel geen richtlijn die een medische diagnose vereist;
          verwijs bij twijfel naar een arts of diëtist.
        </p>
      </main>
    </div>
  )
}
