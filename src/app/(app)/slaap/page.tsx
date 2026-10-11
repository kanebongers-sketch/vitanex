'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Check, Angry, Frown, Meh, Smile, Laugh } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { ActiviteitBadge } from '@/components/navigatie/ActiviteitBadge'
import { vitaEvent } from '@/lib/vita/events'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { urenUitTijden, slaapschuld, regelmaat } from '@/lib/slaap/stats'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import type { Params } from '@/lib/i18n/vertaal'

type Vertaal = (sleutel: string, params?: Params) => string

interface SlaapLog {
  id: string
  datum: string
  uren_slaap: number
  kwaliteit: number | null
  uitgerust: number | null
  bedtijd: string | null
  wektijd: string | null
  notitie: string | null
}

/** Labels per score 1-5: lichaam.slaap.kwaliteit.k<n> en lichaam.slaap.uitgerust.u<n>. */
const kwaliteitLabel = (t: Vertaal, k: number): string => t(`lichaam.slaap.kwaliteit.k${k}`)
const uitgerustLabel = (t: Vertaal, u: number): string => t(`lichaam.slaap.uitgerust.u${u}`)
// Index 0 is leeg (kwaliteit start bij 1); lucide-iconen volgen dezelfde 5-puntsschaal als stemming.
const KWALITEIT_ICOON: (LucideIcon | null)[] = [null, Angry, Frown, Meh, Smile, Laugh]

function kwaliteitKleur(k: number): string {
  if (k >= 4) return 'var(--mf-green)'
  if (k === 3) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function urenNaarTijd(t: Vertaal, uren: number): string {
  const h = Math.floor(uren)
  const m = Math.round((uren - h) * 60)
  return m > 0 ? t('lichaam.slaap.duurUurMin', { u: h, m }) : t('lichaam.slaap.duurUur', { u: h })
}

function slaapKleur(u: number): string {
  if (u >= 7) return 'var(--mf-green)'
  if (u >= 5) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function SlaapBarchart({ logs }: { logs: SlaapLog[] }) {
  const { t, taal } = useVertaling()
  const vandaag = new Date()
  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(vandaag)
    d.setDate(d.getDate() - (6 - i))
    const datum = d.toISOString().split('T')[0]
    const log = logs.find(l => l.datum === datum)
    return {
      datum,
      dag: d.toLocaleDateString(INTL_LOCALE[taal], { weekday: 'narrow' }),
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
        {t('lichaam.slaap.zevenDagen')}
      </p>
      <div
        role="img"
        aria-label={t('lichaam.slaap.weekAria', {
          dagen: dagen
            .map(d => `${d.dag} ${d.uren !== null ? t('lichaam.slaap.urenAria', { uren: d.uren }) : t('lichaam.slaap.geenData')}`)
            .join(', '),
        })}
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
                  {t('lichaam.slaap.urenKort', { uren: d.uren % 1 === 0 ? d.uren : d.uren.toFixed(1) })}
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
          { kleur: 'var(--mf-green)', label: t('lichaam.slaap.legendaGoed') },
          { kleur: 'var(--mf-amber)', label: t('lichaam.slaap.legendaMatig') },
          { kleur: 'var(--mf-red)',   label: t('lichaam.slaap.legendaKort') },
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
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const [laden, setLaden] = useState(true)
  const [logs, setLogs] = useState<SlaapLog[]>([])
  const [gemiddeldUren, setGemiddeldUren] = useState<number | null>(null)
  const [gemiddeldKwaliteit, setGemiddeldKwaliteit] = useState<number | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)

  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0])
  const [uren, setUren] = useState<number>(7.5)
  const [kwaliteit, setKwaliteit] = useState<number>(3)
  const [uitgerust, setUitgerust] = useState<number>(3)
  const [bedtijd, setBedtijd] = useState('')
  const [wektijd, setWektijd] = useState('')
  const [doelUren, setDoelUren] = useState<number>(8)
  const [streefbedtijd, setStreefbedtijd] = useState('')
  const [heeftDoel, setHeeftDoel] = useState(false)
  const [doelOpslaan, setDoelOpslaan] = useState(false)
  const [notitie, setNotitie] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/slaap?limit=14')
      if (res.ok) {
        const json = await res.json() as { logs: SlaapLog[]; gemiddeld_uren: number | null; gemiddeld_kwaliteit: number | null; doel?: { uren: number | null; streefbedtijd: string | null } }
        setLogs(json.logs ?? [])
        setGemiddeldUren(json.gemiddeld_uren)
        setGemiddeldKwaliteit(json.gemiddeld_kwaliteit)
        if (json.doel?.uren != null) { setDoelUren(json.doel.uren); setHeeftDoel(true) }
        if (json.doel?.streefbedtijd) setStreefbedtijd(json.doel.streefbedtijd.slice(0, 5))

        const vandaag = json.logs.find(l => l.datum === new Date().toISOString().split('T')[0])
        if (vandaag) {
          setUren(vandaag.uren_slaap)
          setKwaliteit(vandaag.kwaliteit ?? 3)
          setUitgerust(vandaag.uitgerust ?? 3)
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
        body: JSON.stringify({ datum, uren_slaap: uren, kwaliteit, uitgerust, bedtijd: bedtijd || undefined, wektijd: wektijd || undefined, notitie: notitie || undefined }),
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
        toast({ title: t('lichaam.voeding.opslaanMislukt'), description: t('lichaam.slaap.opslaanTekst'), variant: 'error' })
      }
    } catch {
      toast({ title: t('lichaam.voeding.opslaanMislukt'), description: t('lichaam.slaap.ietsMis'), variant: 'error' })
    }
    setOpslaan(false)
  }

  async function verstuurDoel() {
    setDoelOpslaan(true)
    try {
      const res = await authFetch('/api/slaap/doel', {
        method: 'POST',
        body: JSON.stringify({ uren: doelUren, streefbedtijd: streefbedtijd || null }),
      })
      if (res.ok) { setHeeftDoel(true); toast({ title: t('lichaam.slaap.doelOpgeslagen'), variant: 'success' }) }
      else toast({ title: t('lichaam.voeding.opslaanMislukt'), variant: 'error' })
    } catch {
      toast({ title: t('lichaam.voeding.opslaanMislukt'), variant: 'error' })
    }
    setDoelOpslaan(false)
  }

  // Afgeleide inzichten (pure stats): slaapschuld t.o.v. je doel + regelmaat van je
  // bedtijd, over de recente nachten. Eerlijk: geen data → geen cijfer.
  const urenReeks = logs.map(l => l.uren_slaap)
  const schuld = heeftDoel ? slaapschuld(urenReeks, doelUren) : null
  const bedtijden = logs.map(l => l.bedtijd).filter((b): b is string => typeof b === 'string' && b.length > 0)
  const regelmaatScore = regelmaat(bedtijden)

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
            {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <ActiviteitBadge activiteit="slaap" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            {t('lichaam.slaap.titel')}
          </h1>
        </header>

        {/* Stats */}
        {(gemiddeldUren !== null || gemiddeldKwaliteit !== null) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {gemiddeldUren !== null && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 6px' }}>
                  {t('lichaam.slaap.gemSlaap')}
                </p>
                <p style={{ fontSize: 26, fontWeight: 800, color: slaapKleur(gemiddeldUren), margin: 0, letterSpacing: '-0.02em' }}>
                  {urenNaarTijd(t, gemiddeldUren)}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-4)', margin: '3px 0 0' }}>{t('lichaam.slaap.tweeWeken')}</p>
              </div>
            )}
            {gemiddeldKwaliteit !== null && (() => {
              const gemRond = Math.round(gemiddeldKwaliteit)
              const GemIcoon = KWALITEIT_ICOON[gemRond] ?? Meh
              return (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 6px' }}>
                  {t('lichaam.slaap.gemKwaliteit')}
                </p>
                <GemIcoon size={28} aria-hidden strokeWidth={1.75} style={{ color: kwaliteitKleur(gemRond), display: 'block' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-4)', margin: '6px 0 0' }}>
                  {gemiddeldKwaliteit.toFixed(1)}/5 · {kwaliteitLabel(t, gemRond)}
                </p>
              </div>
              )
            })()}
          </div>
        )}

        {/* Slaapschuld + regelmaat — de "functioneel beter"-inzichten */}
        {(schuld !== null || regelmaatScore !== null) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {schuld !== null && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 6px' }}>{t('lichaam.slaap.schuld')}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: schuld === 0 ? 'var(--mf-green)' : 'var(--mf-amber)', margin: 0, letterSpacing: '-0.02em' }}>
                  {schuld === 0 ? t('lichaam.slaap.opSchema') : urenNaarTijd(t, schuld)}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-4)', margin: '3px 0 0' }}>{t('lichaam.slaap.tekort', { uren: doelUren })}</p>
              </div>
            )}
            {regelmaatScore !== null && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 6px' }}>{t('lichaam.slaap.regelmaat')}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: regelmaatScore >= 70 ? 'var(--mf-green)' : regelmaatScore >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)', margin: 0, letterSpacing: '-0.02em' }}>
                  {regelmaatScore}<span style={{ fontSize: 13, color: 'var(--text-4)' }}>/100</span>
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-4)', margin: '3px 0 0' }}>{t('lichaam.slaap.consistentie')}</p>
              </div>
            )}
          </div>
        )}

        {/* Slaapdoel instellen */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 10px' }}>{t('lichaam.slaap.doel')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <Field label={t('lichaam.slaap.doelUren')}>
              <Input type="number" inputMode="decimal" min={4} max={12} step={0.5} value={doelUren} onChange={e => setDoelUren(Math.max(0, Math.min(24, parseFloat(e.target.value) || 0)))} />
            </Field>
            <Field label={t('lichaam.slaap.streefbedtijd')}>
              <Input type="time" value={streefbedtijd} onChange={e => setStreefbedtijd(e.target.value)} />
            </Field>
            <Button onClick={verstuurDoel} loading={doelOpslaan} variant="secondary">{doelOpslaan ? '…' : t(heeftDoel ? 'lichaam.slaap.bijwerken' : 'lichaam.slaap.instellen')}</Button>
          </div>
        </div>

        <div className={logs.length > 0 ? 'mf-home-layout' : ''} style={{ alignItems: 'start' }}>
        <div>{/* form column */}

        {succes && (
          <div role="status" style={{
            background: 'var(--mf-green-light)', border: '1px solid var(--mentaforce-primary)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--mf-green)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Check size={16} aria-hidden style={{ color: 'var(--mf-green)', flexShrink: 0 }} /> {t('lichaam.slaap.opgeslagen')}
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
              {urenNaarTijd(t, uren)}
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
            {t('lichaam.slaap.logInvoeren')}
          </p>

          <div style={{ marginBottom: 16 }}>
            <Field label={t('lichaam.slaap.datum')}>
              <Input
                type="date"
                value={datum}
                onChange={e => setDatum(e.target.value)}
              />
            </Field>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="slaap-uren" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              {t('lichaam.slaap.urenGeslapen')}{' '}
              <strong style={{ color: slaapKleur(uren) }}>{urenNaarTijd(t, uren)}</strong>
            </label>
            <input
              id="slaap-uren"
              type="range" min={0} max={12} step={0.5} value={uren}
              aria-valuetext={urenNaarTijd(t, uren)}
              onChange={e => setUren(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: slaapKleur(uren) }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-4)', marginTop: 2 }}>
              <span>{t('lichaam.slaap.duurUur', { u: 0 })}</span><span>{t('lichaam.slaap.duurUur', { u: 6 })}</span><span>{t('lichaam.slaap.duurUur', { u: 12 })}</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }} id="slaap-kwaliteit-label">{t('lichaam.slaap.kwaliteitLabel')}</p>
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
                  aria-label={kwaliteitLabel(t, k)}
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
              {kwaliteitLabel(t, kwaliteit)}
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }} id="slaap-uitgerust-label">{t('lichaam.slaap.uitgerustVraag')}</p>
            <div style={{ display: 'flex', gap: 8 }} role="group" aria-labelledby="slaap-uitgerust-label">
              {[1, 2, 3, 4, 5].map(u => {
                const actief = uitgerust === u
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUitgerust(u)}
                    aria-pressed={actief}
                    aria-label={uitgerustLabel(t, u)}
                    style={{
                      flex: 1, height: 44, minWidth: 44, borderRadius: 'var(--radius-sm)',
                      border: actief ? '1px solid transparent' : '1px solid var(--border-strong)',
                      cursor: 'pointer',
                      background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                      color: actief ? 'var(--bg-app)' : 'var(--text-3)',
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    {u}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6, textAlign: 'center' }}>
              {uitgerustLabel(t, uitgerust)}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Field label={t('lichaam.slaap.bedtijd')}>
              <Input type="time" value={bedtijd} onChange={e => { const v = e.target.value; setBedtijd(v); const u = urenUitTijden(v, wektijd); if (u !== null) setUren(u) }} />
            </Field>
            <Field label={t('lichaam.slaap.wektijd')}>
              <Input type="time" value={wektijd} onChange={e => { const v = e.target.value; setWektijd(v); const u = urenUitTijden(bedtijd, v); if (u !== null) setUren(u) }} />
            </Field>
          </div>
          {bedtijd && wektijd && urenUitTijden(bedtijd, wektijd) !== null && (
            <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '-8px 0 16px', textAlign: 'center' }}>
              {t('lichaam.slaap.automatisch')} <strong style={{ color: 'var(--text-2)' }}>{urenNaarTijd(t, urenUitTijden(bedtijd, wektijd) as number)}</strong>
            </p>
          )}

          <div style={{ marginBottom: 16 }}>
            <Field label={t('lichaam.slaap.notitie')}>
              <Textarea
                value={notitie}
                onChange={e => setNotitie(e.target.value)}
                placeholder={t('lichaam.slaap.notitiePlaceholder')}
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
            {opslaan ? t('lichaam.slaap.opslaanBezig') : t('lichaam.slaap.loggen')}
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
                    {urenNaarTijd(t, log.uren_slaap)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>
                      {new Date(log.datum + 'T12:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    {log.kwaliteit ? (() => {
                      const LogKwIcoon = KWALITEIT_ICOON[log.kwaliteit] ?? Meh
                      return (
                      <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <LogKwIcoon size={13} aria-hidden strokeWidth={1.75} style={{ color: kwaliteitKleur(log.kwaliteit), flexShrink: 0 }} /> {kwaliteitLabel(t, log.kwaliteit)}
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
              title={t('lichaam.slaap.leegTitel')}
              description={t('lichaam.slaap.leegTekst')}
            />
          </section>
        )}
        </div>
      </main>
    </div>
  )
}
