'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { CoachHeader, CoachStat, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { KOPPEL_STATUS_STIJL, type KlantOverzicht } from '@/lib/coaching/relatie'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { UserPlus, Users, ChevronRight, ShieldCheck, ShieldAlert, MailPlus } from 'lucide-react'

export default function CoachingPortaal() {
  const { t, taal } = useVertaling()
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [klanten, setKlanten] = useState<KlantOverzicht[]>([])
  const [email, setEmail] = useState('')
  const [koppelBezig, setKoppelBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  const laadKlanten = useCallback(async () => {
    const res = await authFetch('/api/coaching/klanten')
    if (res.ok) {
      const data = await res.json() as { klanten: KlantOverzicht[] }
      setKlanten(data.klanten ?? [])
    }
    setLaden(false)
  }, [])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) { router.push('/home'); return }
      await laadKlanten()
    }
    laad()
  }, [router, laadKlanten])

  async function koppelKlant() {
    if (!email.trim() || koppelBezig) return
    setKoppelBezig(true); setFout(null); setSucces(null)
    const res = await authFetch('/api/coaching/klanten', { method: 'POST', body: JSON.stringify({ email: email.trim() }) })
    const data = await res.json() as { error?: string }
    if (res.ok) {
      setSucces(t('coaching.overzicht.gekoppeld'))
      setEmail(''); await laadKlanten()
    } else {
      setFout((taal === 'nl' ? data.error : undefined) ?? t('coaching.overzicht.koppelenMislukt'))
    }
    setKoppelBezig(false)
  }

  const actief = klanten.filter(k => k.status === 'actief').length
  const wachtInzage = klanten.filter(k => k.status === 'actief' && !k.inzage_toestemming).length

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <CoachHeader
          eyebrow={t('coaching.overzicht.eyebrow')}
          titel={t('coaching.overzicht.titel')}
          subtitel={t('coaching.overzicht.subtitel')}
          rechts={
            <Link href="/coaching/uitnodigen" style={{ textDecoration: 'none' }}>
              <Button leftIcon={<MailPlus size={15} aria-hidden />}>{t('coaching.overzicht.uitnodigen')}</Button>
            </Link>
          }
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : (
          <>
            <div className="mf-animate-up mf-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
              <CoachStat label={t('coaching.overzicht.statKlanten')} waarde={klanten.length} glow={klanten.length > 0} />
              <CoachStat label={t('coaching.overzicht.statActief')} waarde={actief} accent="var(--mf-green)" />
              <CoachStat label={t('coaching.overzicht.wachtOpInzage')} waarde={wachtInzage} accent={wachtInzage > 0 ? 'var(--mf-amber)' : 'var(--text-1)'} />
            </div>

            {/* Klant koppelen */}
            <Card className="mf-animate-up mf-delay-2" style={{ padding: '20px 22px', marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> {t('coaching.overzicht.koppelTitel')}
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
                {t('coaching.overzicht.koppelTekst')}{' '}
                <Link href="/coaching/uitnodigen" style={{ color: 'var(--mf-green)', fontWeight: 600, textDecoration: 'none' }}>{t('coaching.overzicht.koppelLink')}</Link>.
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <Field label={t('coaching.overzicht.emailLabel')} error={fout ?? undefined}>
                    <input
                      type="email" className="mf-input" placeholder={t('coaching.overzicht.emailPlaceholder')} value={email} autoComplete="off"
                      onChange={e => { setEmail(e.target.value); setFout(null); setSucces(null) }}
                      onKeyDown={e => e.key === 'Enter' && koppelKlant()}
                      style={{ borderRadius: 12, padding: '11px 14px', width: '100%' }}
                    />
                  </Field>
                </div>
                <Button onClick={koppelKlant} loading={koppelBezig} disabled={!email.trim()} leftIcon={<UserPlus size={15} aria-hidden />}>{t('coaching.overzicht.koppelen')}</Button>
              </div>
              {succes && <p role="status" style={{ fontSize: 12.5, color: 'var(--mf-green)', marginTop: 12, fontWeight: 600 }}>{succes}</p>}
            </Card>

            {/* Klantenlijst */}
            {klanten.length === 0 ? (
              <CoachEmpty
                icon={Users}
                titel={t('coaching.overzicht.leegTitel')}
                tekst={t('coaching.overzicht.leegTekst')}
                actie={<Link href="/coaching/uitnodigen" style={{ textDecoration: 'none' }}><Button variant="secondary" leftIcon={<MailPlus size={15} aria-hidden />}>{t('coaching.overzicht.uitnodigen')}</Button></Link>}
              />
            ) : (
              <div className="mf-coach-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {klanten.map(k => {
                  const stijl = KOPPEL_STATUS_STIJL[k.status]
                  return (
                    <Link key={k.klant_id} href={`/coaching/${k.klant_id}`} style={{ textDecoration: 'none' }}>
                      <Card className="mf-coach-row" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 15, cursor: 'pointer' }}>
                        <Avatar naam={k.naam} avatarUrl={k.avatar_url} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{k.naam}</p>
                          <p style={{ fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.email ?? ''}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {k.status === 'actief' && (
                            k.inzage_toestemming ? (
                              <Badge variant="success" style={{ fontSize: 10, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={11} aria-hidden /> {t('coaching.overzicht.inzage')}</Badge>
                            ) : (
                              <Badge variant="warning" style={{ fontSize: 10, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ShieldAlert size={11} aria-hidden /> {t('coaching.overzicht.wachtOpInzage')}</Badge>
                            )
                          )}
                          {k.status !== 'actief' && (
                            <Badge variant="neutral" style={{ fontSize: 10, padding: '3px 9px', background: stijl.bg, color: stijl.color }}>{t(`coaching.labels.koppelStatus.${k.status}`)}</Badge>
                          )}
                          <ChevronRight size={17} aria-hidden style={{ color: 'var(--text-4)' }} />
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
