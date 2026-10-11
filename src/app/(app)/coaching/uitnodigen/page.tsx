'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { CoachHeader, CoachStat, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { MailPlus, Mail, X, Check, Clock } from 'lucide-react'
import type { CoachingUitnodiging, UitnodigingStatus } from '@/lib/coaching/uitnodiging'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE, type Taal } from '@/lib/i18n/talen'

const STATUS_VARIANT: Record<UitnodigingStatus, 'warning' | 'success' | 'neutral'> = {
  open:         'warning',
  geaccepteerd: 'success',
  ingetrokken:  'neutral',
  verlopen:     'neutral',
}

function formatDatum(waarde: string | null, taal: Taal): string {
  if (!waarde) return ''
  return new Date(waarde).toLocaleDateString(INTL_LOCALE[taal], { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CoachingUitnodigenPagina() {
  const { t, taal } = useVertaling()
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [uitnodigingen, setUitnodigingen] = useState<CoachingUitnodiging[]>([])
  const [email, setEmail] = useState('')
  const [naam, setNaam] = useState('')
  const [bezig, setBezig] = useState(false)
  const [intrekBezig, setIntrekBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  const laadUitnodigingen = useCallback(async () => {
    const res = await authFetch('/api/coaching/uitnodigingen')
    if (res.ok) {
      const data = await res.json() as { uitnodigingen: CoachingUitnodiging[] }
      setUitnodigingen(data.uitnodigingen ?? [])
    }
    setLaden(false)
  }, [])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      await laadUitnodigingen()
    }
    laad()
  }, [router, laadUitnodigingen])

  async function verstuurUitnodiging() {
    if (!email.trim() || bezig) return
    setBezig(true)
    setFout(null)
    setSucces(null)
    const res = await authFetch('/api/coaching/uitnodigingen', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), naam: naam.trim() || undefined }),
    })
    const data = await res.json() as { error?: string; email?: string }
    if (res.ok) {
      setSucces(t('coaching.uitnodigen.verstuurd', { email: data.email ?? email.trim() }))
      setEmail('')
      setNaam('')
      await laadUitnodigingen()
    } else {
      setFout((taal === 'nl' ? data.error : undefined) ?? t('coaching.uitnodigen.mislukt'))
    }
    setBezig(false)
  }

  async function trekIn(id: string) {
    if (intrekBezig) return
    setIntrekBezig(id)
    setFout(null)
    setSucces(null)
    const res = await authFetch(`/api/coaching/uitnodigingen/${id}`, { method: 'DELETE' })
    if (res.ok) {
      await laadUitnodigingen()
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setFout((taal === 'nl' ? data.error : undefined) ?? t('coaching.uitnodigen.intrekkenMislukt'))
    }
    setIntrekBezig(null)
  }

  const openstaand = uitnodigingen.filter(u => u.status === 'open').length
  const geaccepteerd = uitnodigingen.filter(u => u.status === 'geaccepteerd').length

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 720, margin: '0 auto' }}>
        <CoachHeader
          eyebrow={t('coaching.overzicht.eyebrow')}
          titel={t('coaching.overzicht.uitnodigen')}
          subtitel={t('coaching.uitnodigen.subtitel')}
          backHref="/coaching"
          backLabel={t('coaching.algemeen.terugNaarKlanten')}
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : (
          <>
            {/* Hero-stats */}
            <div className="mf-animate-up mf-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
              <CoachStat label={t('coaching.uitnodigen.statVerstuurd')} waarde={uitnodigingen.length} glow={uitnodigingen.length > 0} />
              <CoachStat label={t('coaching.labels.uitnodigingStatus.open')} waarde={openstaand} accent={openstaand > 0 ? 'var(--mf-amber)' : 'var(--text-1)'} />
              <CoachStat label={t('coaching.labels.uitnodigingStatus.geaccepteerd')} waarde={geaccepteerd} accent="var(--mf-green)" />
            </div>

            {/* Uitnodigen-formulier */}
            <Card className="mf-animate-up mf-delay-2" style={{ padding: '20px 22px', marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailPlus size={15} aria-hidden style={{ color: 'var(--mf-green)' }} />
                {t('coaching.uitnodigen.nieuwe')}
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>
                {t('coaching.uitnodigen.uitleg')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 220 }}>
                    <Field label={t('coaching.overzicht.emailLabel')} error={fout ?? undefined}>
                      <input
                        type="email"
                        className="mf-input"
                        placeholder={t('coaching.overzicht.emailPlaceholder')}
                        value={email}
                        autoComplete="off"
                        onChange={e => { setEmail(e.target.value); setFout(null); setSucces(null) }}
                        onKeyDown={e => e.key === 'Enter' && verstuurUitnodiging()}
                        style={{ borderRadius: 12, padding: '11px 14px', width: '100%' }}
                      />
                    </Field>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <Field label={t('coaching.uitnodigen.naam')}>
                      <input
                        type="text"
                        className="mf-input"
                        placeholder={t('coaching.uitnodigen.voornaam')}
                        value={naam}
                        autoComplete="off"
                        onChange={e => setNaam(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && verstuurUitnodiging()}
                        style={{ borderRadius: 12, padding: '11px 14px', width: '100%' }}
                      />
                    </Field>
                  </div>
                </div>
                <div>
                  <Button onClick={verstuurUitnodiging} loading={bezig} disabled={!email.trim()} leftIcon={<Mail size={15} aria-hidden />}>
                    {t('coaching.uitnodigen.versturen')}
                  </Button>
                </div>
              </div>
              {succes && (
                <p role="status" style={{ fontSize: 12.5, color: 'var(--mf-green)', marginTop: 14, fontWeight: 600 }}>{succes}</p>
              )}
            </Card>

            {/* Lijst */}
            {uitnodigingen.length === 0 ? (
              <CoachEmpty
                icon={Mail}
                titel={t('coaching.uitnodigen.leegTitel')}
                tekst={t('coaching.uitnodigen.leegTekst')}
              />
            ) : (
              <section aria-label={t('coaching.uitnodigen.lijstAria')} className="mf-coach-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {uitnodigingen.map(u => {
                  const variant = STATUS_VARIANT[u.status]
                  const verloopt = u.status === 'open' ? new Date(u.verloopt_op).getTime() < Date.now() : false
                  const isAcc = u.status === 'geaccepteerd'
                  const wachtOpen = u.status === 'open' && !verloopt
                  const ringBg = isAcc ? 'var(--mf-green-light)' : wachtOpen ? 'var(--mf-amber-light)' : 'var(--bg-subtle)'
                  const ringColor = isAcc ? 'var(--mf-green)' : wachtOpen ? 'var(--mf-amber)' : 'var(--text-3)'
                  return (
                    <Card key={u.id} style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span
                        aria-hidden
                        style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: ringBg, color: ringColor }}
                      >
                        {isAcc ? <Check size={17} /> : <Clock size={17} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.naam || u.email}
                        </p>
                        <p style={{ fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.naam ? `${u.email} · ` : ''}
                          {u.status === 'geaccepteerd'
                            ? t('coaching.uitnodigen.geaccepteerdOp', { datum: formatDatum(u.geaccepteerd_op, taal) })
                            : t('coaching.uitnodigen.verstuurdOp', { datum: formatDatum(u.aangemaakt_op, taal) })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Badge variant={verloopt ? 'neutral' : variant} style={{ fontSize: 10, padding: '3px 9px' }}>
                          {t(`coaching.labels.uitnodigingStatus.${verloopt ? 'verlopen' : u.status}`)}
                        </Badge>
                        {u.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => trekIn(u.id)}
                            loading={intrekBezig === u.id}
                            leftIcon={<X size={14} aria-hidden />}
                            aria-label={t('coaching.uitnodigen.intrekkenAria', { email: u.email })}
                            style={{ color: 'var(--mf-red)' }}
                          >
                            {t('coaching.uitnodigen.intrekken')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
