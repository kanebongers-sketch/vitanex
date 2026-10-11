'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Bell, BellOff, Sparkles, Moon } from 'lucide-react'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { activeerPush, pushStatus, type PushStatus } from '@/lib/push/client'
import { useVertaling } from '@/lib/i18n/TaalProvider'

interface Voorkeuren {
  vandaag_aan: boolean
  checkin_aan: boolean
  streak_aan: boolean
  vita_week_aan: boolean
  stiltetijd_start: string
  stiltetijd_eind: string
  max_per_dag: number
}

const DEFAULTS: Voorkeuren = {
  vandaag_aan: true, checkin_aan: true, streak_aan: true, vita_week_aan: true,
  stiltetijd_start: '22:00', stiltetijd_eind: '08:00', max_per_dag: 2,
}

// Teksten: account.notificaties.soort.<key>.label / .beschrijving
const SOORTEN: (keyof Voorkeuren)[] = ['vandaag_aan', 'checkin_aan', 'streak_aan', 'vita_week_aan']

export default function NotificatiesPage() {
  const { toast } = useToast()
  const { t } = useVertaling()
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [voorkeuren, setVoorkeuren] = useState<Voorkeuren>(DEFAULTS)
  const [geconfigureerd, setGeconfigureerd] = useState(true)
  const [apparaat, setApparaat] = useState<PushStatus>('onbeschikbaar')

  const laad = useCallback((): Promise<void> => {
    return Promise.all([
      authFetch('/api/push/voorkeuren').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      pushStatus().catch(() => 'onbeschikbaar' as PushStatus),
    ]).then(([data, status]) => {
      if (data?.voorkeuren) setVoorkeuren({ ...DEFAULTS, ...data.voorkeuren })
      if (data && typeof data.geconfigureerd === 'boolean') setGeconfigureerd(data.geconfigureerd)
      setApparaat(status)
      setLaden(false)
    })
  }, [])

  useEffect(() => { void laad() }, [laad])

  function zetAan(): void {
    activeerPush()
      .then((status) => {
        setApparaat(status)
        if (status === 'granted') toast({ title: t('account.notificaties.aanTitel'), description: t('account.notificaties.aanTekst'), variant: 'success' })
        else if (status === 'denied') toast({ title: t('account.notificaties.geweigerdTitel'), description: t('account.notificaties.geweigerdTekst'), variant: 'warning' })
      })
      .catch(() => toast({ title: t('account.notificaties.fout'), description: t('account.notificaties.later'), variant: 'error' }))
  }

  function slaOp(): void {
    setBezig(true)
    authFetch('/api/push/voorkeuren', { method: 'PUT', body: JSON.stringify(voorkeuren) })
      .then((r) => {
        setBezig(false)
        if (!r.ok) { toast({ title: t('account.notificaties.opslaanMislukt'), description: t('account.notificaties.later'), variant: 'error' }); return }
        setOpgeslagen(true)
        setTimeout(() => setOpgeslagen(false), 2500)
      })
      .catch(() => { setBezig(false); toast({ title: t('account.notificaties.opslaanMislukt'), description: t('account.notificaties.later'), variant: 'error' }) })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 96px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/instellingen" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={15} aria-hidden /> {t('account.instellingen.kop')}
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>{t('account.notificaties.kop')}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>{t('account.notificaties.intro')}</p>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="mf-spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ApparaatStatus status={apparaat} geconfigureerd={geconfigureerd} onAan={zetAan} />

            {/* Slimme timing — Kane's keuze: de app kiest het moment */}
            <Card style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Sparkles size={16} aria-hidden style={{ flexShrink: 0, color: 'var(--brand, var(--mentaforce-primary))', marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{t('account.notificaties.slimKop')}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {t('account.notificaties.slimTekst')}
                  </p>
                </div>
              </div>
            </Card>

            {SOORTEN.map((key) => (
              <ToggleRij
                key={key}
                label={t(`account.notificaties.soort.${key}.label`)}
                beschrijving={t(`account.notificaties.soort.${key}.beschrijving`)}
                actief={Boolean(voorkeuren[key])}
                onToggle={() => setVoorkeuren((p) => ({ ...p, [key]: !p[key] }))}
              />
            ))}

            {/* Stiltetijd */}
            <Card style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Moon size={15} aria-hidden style={{ color: 'var(--text-3)' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{t('account.notificaties.stiltetijd')}</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 14 }}>{t('account.notificaties.stiltetijdTekst')}</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Field label={t('account.notificaties.van')}><Input type="time" value={voorkeuren.stiltetijd_start} onChange={(e) => setVoorkeuren((p) => ({ ...p, stiltetijd_start: e.target.value }))} style={{ width: 'auto' }} /></Field>
                <Field label={t('account.notificaties.tot')}><Input type="time" value={voorkeuren.stiltetijd_eind} onChange={(e) => setVoorkeuren((p) => ({ ...p, stiltetijd_eind: e.target.value }))} style={{ width: 'auto' }} /></Field>
              </div>
            </Card>

            {/* Daglimiet */}
            <Card style={{ padding: '18px 20px' }}>
              <Field label={t('account.notificaties.maxPerDag')} hint={t('account.notificaties.maxHint')}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map((n) => (
                    <button key={n} type="button" onClick={() => setVoorkeuren((p) => ({ ...p, max_per_dag: n }))}
                      aria-pressed={voorkeuren.max_per_dag === n}
                      style={{
                        minWidth: 44, height: 40, borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                        border: `1px solid ${voorkeuren.max_per_dag === n ? 'var(--brand, var(--mentaforce-primary))' : 'var(--border)'}`,
                        background: voorkeuren.max_per_dag === n ? 'var(--brand-soft, var(--mentaforce-primary-light))' : 'var(--bg-card)',
                        color: voorkeuren.max_per_dag === n ? 'var(--brand, var(--mentaforce-primary))' : 'var(--text-2)',
                      }}>{n}</button>
                  ))}
                </div>
              </Field>
            </Card>

            <Button onClick={slaOp} loading={bezig} leftIcon={opgeslagen ? <Check size={16} aria-hidden /> : undefined} style={{ width: '100%', marginTop: 4 }}>
              {bezig ? t('account.hrOnboarding.opslaan') : opgeslagen ? t('account.notificaties.opgeslagen') : t('account.notificaties.opslaan')}
            </Button>
          </div>
        )}
      </main>
      <style>{`.mf-switch:focus-visible { outline: 2px solid var(--brand, var(--mentaforce-primary)); outline-offset: 3px; }`}</style>
    </div>
  )
}

function ApparaatStatus({ status, geconfigureerd, onAan }: { status: PushStatus; geconfigureerd: boolean; onAan: () => void }) {
  const { t } = useVertaling()
  // Eerlijk: als de bezorging (FCM) nog niet is aangezet, beloven we niets.
  if (!geconfigureerd) {
    return (
      <Card style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <BellOff size={16} aria-hidden style={{ flexShrink: 0, color: 'var(--text-3)', marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{t('account.notificaties.binnenkortKop')}</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{t('account.notificaties.binnenkortTekst')}</p>
          </div>
        </div>
      </Card>
    )
  }
  if (status === 'granted') {
    return (
      <Card style={{ padding: '16px 18px', borderColor: 'color-mix(in srgb, var(--mf-green, #2fbf71) 40%, transparent)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Bell size={16} aria-hidden style={{ flexShrink: 0, color: 'var(--mf-green, #2fbf71)' }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{t('account.notificaties.staanAan')}</p>
        </div>
      </Card>
    )
  }
  if (status === 'onbeschikbaar') {
    return (
      <Card style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Bell size={16} aria-hidden style={{ flexShrink: 0, color: 'var(--brand, var(--mentaforce-primary))', marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{t('account.notificaties.openApp')}</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{t('account.notificaties.openAppTekst')}</p>
          </div>
        </div>
      </Card>
    )
  }
  // 'prompt' of 'denied'
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{t('account.notificaties.aanzettenKop')}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
            {status === 'denied' ? t('account.notificaties.eerderGeweigerd') : t('account.notificaties.toestemming')}
          </p>
        </div>
        {status !== 'denied' && <Button onClick={onAan} leftIcon={<Bell size={16} aria-hidden />}>{t('account.notificaties.aanzetten')}</Button>}
      </div>
    </Card>
  )
}

function ToggleRij({ label, beschrijving, actief, onToggle }: { label: string; beschrijving: string; actief: boolean; onToggle: () => void }) {
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{label}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{beschrijving}</p>
        </div>
        <button type="button" role="switch" aria-checked={actief} aria-label={label} onClick={onToggle} className="mf-switch"
          style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: actief ? 'var(--brand, var(--mentaforce-primary))' : 'var(--border-strong)', position: 'relative', flexShrink: 0, transition: 'background 0.2s var(--ease)' }}>
          <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-card)', transition: 'transform 0.2s var(--ease)', transform: actief ? 'translateX(23px)' : 'translateX(3px)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
        </button>
      </div>
    </Card>
  )
}
