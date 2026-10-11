'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import {
  ArrowLeft, Sparkles, Check, Dumbbell, Flame, Heart, Zap, Star,
  Bot, AlertTriangle, Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { useVertaling } from '@/lib/i18n/TaalProvider'


type AgentFase = 'wachten' | 'bezig' | 'klaar'

/** Labels: lichaam.genereer.doel.<value>. */
const DOELEN: { value: string; icon: LucideIcon }[] = [
  { value: 'spiermassa', icon: Dumbbell },
  { value: 'afvallen', icon: Flame },
  { value: 'conditie', icon: Heart },
  { value: 'kracht', icon: Zap },
  { value: 'flexibiliteit', icon: Star },
]

/** Waarden voor de API; labels uit lichaam.sport.niveau.* en lichaam.genereer.dag(Kort).*. */
const NIVEAUS = ['beginner', 'gemiddeld', 'gevorderd']
const TRAININGSDAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
const SESSIES_NAAR_DAGEN: Record<number, string[]> = {
  2: ['maandag', 'donderdag'],
  3: ['maandag', 'woensdag', 'vrijdag'],
  4: ['maandag', 'dinsdag', 'donderdag', 'vrijdag'],
  5: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'],
}
const TIJD_OPTIES = [30, 45, 60, 90]
/** Labels: lichaam.genereer.materiaal.<waarde>. */
const MATERIAAL_OPTIES = ['geen', 'dumbbells', 'barbell', 'kabels', 'volledig']

// Intake fitness_doel → formulier-doel (de waarden die deze pagina gebruikt).
const INTAKE_DOEL_NAAR_FORM: Record<string, string> = {
  afvallen: 'afvallen',
  aankomen: 'spiermassa',
  fitter: 'conditie',
  onderhouden: 'kracht',
}

// Intake activiteitsniveau → realistisch niveau + standaard trainingsdagen.
const INTAKE_ACTIVITEIT_NAAR_TRAINING: Record<string, { niveau: string; sessies: number }> = {
  sedentair: { niveau: 'beginner', sessies: 2 },
  licht: { niveau: 'beginner', sessies: 3 },
  gemiddeld: { niveau: 'gemiddeld', sessies: 3 },
  actief: { niveau: 'gemiddeld', sessies: 4 },
  zeer_actief: { niveau: 'gevorderd', sessies: 5 },
}

export default function GenereerSchemaPage() {
  const router = useRouter()
  const { t, taal } = useVertaling()
  const [stap, setStap] = useState(1)
  const [doel, setDoel] = useState('')
  const [niveau, setNiveau] = useState('beginner')
  const [gekozenDagen, setGekozenDagen] = useState<string[]>(['maandag', 'woensdag', 'vrijdag'])
  const [beschikbareTijd, setBeschikbareTijd] = useState(45)
  const [benodigdheden, setBenodigdheden] = useState<string[]>(['geen'])
  const [blessures, setBlessures] = useState('')
  const [vanuitIntake, setVanuitIntake] = useState(false)
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [agentStatus, setAgentStatus] = useState<{ agent1: AgentFase; agent2: AgentFase; agent3: AgentFase }>({
    agent1: 'wachten', agent2: 'wachten', agent3: 'wachten',
  })

  const toggleDag = (dag: string) => {
    setGekozenDagen(prev =>
      prev.includes(dag) ? prev.filter(d => d !== dag) : [...prev, dag]
    )
  }

  const toggleMateriaal = (value: string) => {
    if (value === 'geen') {
      setBenodigdheden(['geen'])
      return
    }
    setBenodigdheden(prev => {
      const zonder = prev.filter(v => v !== 'geen')
      return zonder.includes(value) ? zonder.filter(v => v !== value) || ['geen'] : [...zonder, value]
    })
  }

  const kanVerder = () => {
    if (stap === 1) return doel !== ''
    if (stap === 2) return gekozenDagen.length >= 2
    if (stap === 3) return true
    return false
  }

  const startGenereren = async () => {
    setLaden(true)
    setFout(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Health check — snel checken of de server juist geconfigureerd is
      setAgentStatus({ agent1: 'bezig', agent2: 'wachten', agent3: 'wachten' })
      const healthRes = await authFetch('/api/fitness/health')
      if (!healthRes.ok) {
        const h = await healthRes.json().catch(() => ({}))
        throw new Error((taal === 'nl' && h.error) || t('lichaam.genereer.server'))
      }

      const { data: disc } = await supabase
        .from('disc_inzendingen')
        .select('primair_profiel')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      await new Promise(r => setTimeout(r, 800))
      setAgentStatus({ agent1: 'klaar', agent2: 'bezig', agent3: 'wachten' })

      const abortCtrl = new AbortController()
      const timeout = setTimeout(() => abortCtrl.abort(), 90_000)

      let res: Response
      try {
        res = await authFetch('/api/fitness/genereer-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            doel,
            niveau,
            trainingsdagen: gekozenDagen,
            beschikbare_tijd: beschikbareTijd,
            benodigdheden,
            blessures: blessures || undefined,
            disc_profiel: disc?.primair_profiel || undefined,
          }),
          signal: abortCtrl.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      setAgentStatus({ agent1: 'klaar', agent2: 'klaar', agent3: 'bezig' })
      await new Promise(r => setTimeout(r, 1000))

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((taal === 'nl' && data.error) || t('lichaam.genereer.mislukt', { status: res.status }))
      }

      setAgentStatus({ agent1: 'klaar', agent2: 'klaar', agent3: 'klaar' })
      await new Promise(r => setTimeout(r, 800))
      router.push('/sport')
    } catch (e: unknown) {
      const msg = e instanceof Error
        ? (e.name === 'AbortError' ? t('lichaam.genereer.timeout') : e.message)
        : t('lichaam.genereer.ietsMis')
      setFout(msg)
      setLaden(false)
      setAgentStatus({ agent1: 'wachten', agent2: 'wachten', agent3: 'wachten' })
    }
  }

  useEffect(() => {
    // Prefill de keuzes vanuit het intake-profiel; blijven bewerkbaar.
    async function prefillVanuitProfiel() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profiel } = await supabase
        .from('profiles')
        .select('fitness_doel, activiteitsniveau')
        .eq('id', user.id)
        .maybeSingle()

      if (!profiel) return
      let prefilled = false

      const formDoel = profiel.fitness_doel ? INTAKE_DOEL_NAAR_FORM[profiel.fitness_doel] : undefined
      if (formDoel) {
        setDoel(formDoel)
        prefilled = true
      }

      const training = profiel.activiteitsniveau
        ? INTAKE_ACTIVITEIT_NAAR_TRAINING[profiel.activiteitsniveau]
        : undefined
      if (training) {
        setNiveau(training.niveau)
        setGekozenDagen(SESSIES_NAAR_DAGEN[training.sessies] ?? ['maandag', 'woensdag', 'vrijdag'])
        prefilled = true
      }

      if (prefilled) setVanuitIntake(true)
    }
    prefillVanuitProfiel()
  }, [])

  useEffect(() => {
    // Start de generatie buiten de synchrone effect-body; bewust alleen
    // afhankelijk van stap — generatie hoort eenmalig te starten bij stap 4
    if (stap === 4 && !laden) Promise.resolve().then(startGenereren)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stap])

  const agentLabels = [
    { key: 'agent1', label: t('lichaam.genereer.agent1') },
    { key: 'agent2', label: t('lichaam.genereer.agent2') },
    { key: 'agent3', label: t('lichaam.genereer.agent3') },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => router.push('/sport')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }}
          >
            <ArrowLeft size={15} aria-hidden /> {t('lichaam.stappen.annuleren')}
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>
            {t('lichaam.genereer.titel')}
          </h1>
          <p style={{ color: 'var(--text-3)', marginTop: 4, fontSize: 14 }}>
            {t('lichaam.genereer.intro')}
          </p>
        </header>

        {/* Intake-hint */}
        {stap < 4 && vanuitIntake && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px',
            background: 'var(--mentaforce-primary-light)', border: '1px solid var(--mentaforce-primary)', borderRadius: 'var(--radius-md)',
          }}>
            <Sparkles size={18} aria-hidden style={{ color: 'var(--mentaforce-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
              {t('lichaam.genereer.intake')}
            </span>
          </div>
        )}

        {/* Stap indicator */}
        {stap < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: stap === n ? 'var(--mentaforce-primary)' : stap > n ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                  color: stap === n ? 'var(--bg-app)' : stap > n ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                  border: stap > n ? '1px solid var(--mentaforce-primary)' : '1px solid var(--border)',
                }}>
                  {stap > n ? <Check size={14} aria-hidden /> : n}
                </div>
                {n < 3 && <div style={{ height: 2, width: 32, background: stap > n ? 'var(--mentaforce-primary)' : 'var(--border)' }} />}
              </div>
            ))}
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-3)' }}>{t('lichaam.genereer.stap', { stap })}</span>
          </div>
        )}

        {/* Stap 1: Doel */}
        {stap === 1 && (
          <div>
            <h2 id="doel-label" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>{t('lichaam.genereer.doelVraag')}</h2>
            <div role="radiogroup" aria-labelledby="doel-label" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOELEN.map(d => {
                const actief = doel === d.value
                const Icon = d.icon
                return (
                  <button
                    key={d.value}
                    type="button"
                    role="radio"
                    aria-checked={actief}
                    onClick={() => setDoel(d.value)}
                    className="mf-pressable"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                      background: actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 0.15s var(--ease), background 0.15s var(--ease)',
                    }}
                  >
                    <span style={{
                      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                      color: actief ? 'var(--bg-app)' : 'var(--text-3)',
                    }}>
                      <Icon size={20} aria-hidden />
                    </span>
                    <span style={{ fontSize: 15, fontWeight: actief ? 700 : 600, color: actief ? 'var(--text-1)' : 'var(--text-2)' }}>
                      {t(`lichaam.genereer.doel.${d.value}`)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Stap 2: Niveau & Tijd */}
        {stap === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20 }}>{t('lichaam.genereer.niveauTitel')}</h2>

            <p id="niveau-label" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>{t('lichaam.genereer.jouwNiveau')}</p>
            <div role="radiogroup" aria-labelledby="niveau-label" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {NIVEAUS.map(n => {
                const actief = niveau === n
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={actief}
                    onClick={() => setNiveau(n)}
                    className="mf-pressable"
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                      color: actief ? 'var(--bg-app)' : 'var(--text-2)',
                      border: `1.5px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                    }}
                  >
                    {t(`lichaam.sport.niveau.${n}`)}
                  </button>
                )
              })}
            </div>

            <p id="dagen-label" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>
              {t('lichaam.genereer.welkeDagen')} <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>{t('lichaam.genereer.geselecteerd', { aantal: gekozenDagen.length })}</span>
            </p>
            <div role="group" aria-labelledby="dagen-label" style={{ display: 'flex', gap: 8, marginBottom: gekozenDagen.length < 2 ? 4 : 24 }}>
              {TRAININGSDAGEN.map(dag => {
                const actief = gekozenDagen.includes(dag)
                return (
                  <button
                    key={dag}
                    type="button"
                    aria-pressed={actief}
                    aria-label={t(`lichaam.genereer.dag.${dag}`)}
                    onClick={() => toggleDag(dag)}
                    className="mf-pressable"
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                      color: actief ? 'var(--bg-app)' : 'var(--text-2)',
                      border: `1.5px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                      transition: 'background 0.12s var(--ease), color 0.12s var(--ease), border-color 0.12s var(--ease)',
                    }}
                  >
                    {t(`lichaam.genereer.dagKort.${dag}`)}
                  </button>
                )
              })}
            </div>
            {gekozenDagen.length < 2 && (
              <p role="alert" style={{ fontSize: 12, color: 'var(--mf-red)', marginBottom: 24, marginTop: 0 }}>
                {t('lichaam.genereer.minDagen')}
              </p>
            )}

            <p id="tijd-label" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>
              {t('lichaam.genereer.tijd')}
            </p>
            <div role="radiogroup" aria-labelledby="tijd-label" style={{ display: 'flex', gap: 8 }}>
              {TIJD_OPTIES.map(min => {
                const actief = beschikbareTijd === min
                return (
                  <button
                    key={min}
                    type="button"
                    role="radio"
                    aria-checked={actief}
                    aria-label={t('lichaam.genereer.minuten', { min })}
                    onClick={() => setBeschikbareTijd(min)}
                    className="mf-pressable"
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                      color: actief ? 'var(--bg-app)' : 'var(--text-2)',
                      border: `1.5px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                    }}
                  >
                    {t('lichaam.genereer.minKort', { min })}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Stap 3: Materiaal */}
        {stap === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{t('lichaam.genereer.materiaalTitel')}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 18 }}>{t('lichaam.genereer.materiaalIntro')}</p>

            <div role="group" aria-label={t('lichaam.genereer.materiaalAria')} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {MATERIAAL_OPTIES.map(m => {
                const actief = benodigdheden.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    role="checkbox"
                    aria-checked={actief}
                    onClick={() => toggleMateriaal(m)}
                    className="mf-pressable"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                      background: actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-card)', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                      border: `1.5px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                    }}
                  >
                    <span aria-hidden style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                      border: `2px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--bg-app)',
                    }}>
                      {actief && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: actief ? 'var(--text-1)' : 'var(--text-2)' }}>{t(`lichaam.genereer.materiaal.${m}`)}</span>
                  </button>
                )
              })}
            </div>

            <Field label={t('lichaam.genereer.blessures')} hint={t('lichaam.genereer.blessuresHint')} htmlFor="blessures">
              <Textarea
                id="blessures"
                value={blessures}
                onChange={e => setBlessures(e.target.value)}
                placeholder={t('lichaam.genereer.blessuresPlaceholder')}
                rows={3}
                style={{ resize: 'none' }}
              />
            </Field>
          </div>
        )}

        {/* Stap 4: Genereren */}
        {stap === 4 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 10 }}>
                <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, var(--mentaforce-primary-light) 0%, transparent 70%)' }} />
                </div>
                <Bot size={36} aria-hidden style={{ color: 'var(--mentaforce-primary)', position: 'relative', zIndex: 1 }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>{t('lichaam.genereer.bezigTitel')}</h2>
              <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 6 }}>{t('lichaam.genereer.bezigTekst')}</p>
            </div>

            <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {agentLabels.map(({ key, label }) => {
                const status = agentStatus[key]
                const isKlaar = status === 'klaar'
                const isBezig = status === 'bezig'
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isKlaar ? 'var(--mentaforce-primary-light)' : isBezig ? 'var(--mf-amber-light)' : 'var(--bg-subtle)',
                    border: `1.5px solid ${isKlaar ? 'var(--mentaforce-primary)' : isBezig ? 'var(--mf-amber)' : 'var(--border)'}`,
                  }}>
                    <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isKlaar && (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--mentaforce-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={14} strokeWidth={3} aria-hidden style={{ color: 'var(--bg-app)' }} />
                        </div>
                      )}
                      {isBezig && (
                        <Loader2 size={22} aria-hidden className="mf-gen-spin" style={{ color: 'var(--mf-amber)' }} />
                      )}
                      {status === 'wachten' && (
                        <div aria-hidden style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--border-strong)' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: isBezig ? 600 : 500,
                      color: isKlaar ? 'var(--mentaforce-primary)' : isBezig ? 'var(--mf-amber)' : 'var(--text-3)',
                    }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {fout && (
              <div role="alert" style={{
                marginTop: 20, padding: '16px 18px',
                background: 'var(--mf-red-light)', border: '1.5px solid var(--mf-red)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--mf-red)' }}>
                  <AlertTriangle size={16} aria-hidden /> {t('lichaam.genereer.fout')}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', color: 'var(--text-2)' }}>{fout}</div>
                <button
                  type="button"
                  onClick={() => { setFout(null); setLaden(false); Promise.resolve().then(startGenereren) }}
                  className="mf-pressable"
                  style={{
                    display: 'inline-block', marginTop: 12, padding: '8px 18px',
                    background: 'var(--mf-red)', color: 'var(--bg-app)', fontWeight: 600,
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14,
                  }}
                >
                  {t('lichaam.opnieuw')}
                </button>
              </div>
            )}
            <style>{`
              .mf-gen-spin { animation: mf-spin 0.8s linear infinite; }
              @media (prefers-reduced-motion: reduce) { .mf-gen-spin { animation: none; } }
            `}</style>
          </div>
        )}

        {/* Navigatie knoppen */}
        {stap < 4 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {stap > 1 && (
              <button
                type="button"
                onClick={() => setStap(s => s - 1)}
                className="mf-pressable"
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600,
                  background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border-strong)', cursor: 'pointer',
                }}
              >
                {t('lichaam.voedingSetup.vorige')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setStap(s => s + 1)}
              disabled={!kanVerder()}
              className="mf-pressable"
              style={{
                flex: 2, padding: '14px 0', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: kanVerder() ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                color: kanVerder() ? 'var(--bg-app)' : 'var(--text-4)',
                border: 'none', cursor: kanVerder() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s var(--ease)',
              }}
            >
              {stap === 3 ? <><Sparkles size={16} aria-hidden /> {t('lichaam.genereer.genereren')}</> : t('lichaam.voedingSetup.volgende')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
