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
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { KOPPEL_STATUS_STIJL, type KlantOverzicht } from '@/lib/coaching/relatie'
import { UserPlus, Users, ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react'

export default function CoachingPortaal() {
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
      const { data: profiel } = await supabase
        .from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      await laadKlanten()
    }
    laad()
  }, [router, laadKlanten])

  async function koppelKlant() {
    if (!email.trim() || koppelBezig) return
    setKoppelBezig(true)
    setFout(null)
    setSucces(null)
    const res = await authFetch('/api/coaching/klanten', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json() as { error?: string }
    if (res.ok) {
      setSucces('Klant gekoppeld. Vraag de klant om inzage te bevestigen.')
      setEmail('')
      await laadKlanten()
    } else {
      setFout(data.error ?? 'Koppelen mislukt.')
    }
    setKoppelBezig(false)
  }

  const actief = klanten.filter(k => k.status === 'actief').length
  const wachtInzage = klanten.filter(k => k.status === 'actief' && !k.inzage_toestemming).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Coaching
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Je 1-op-1 coachingklanten — voortgang, welzijn en trajecten op één plek.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : (
          <>
            {/* Stat-strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Klanten', waarde: klanten.length, kleur: 'var(--text-1)' },
                { label: 'Actief', waarde: actief, kleur: 'var(--mf-green)' },
                { label: 'Wacht op inzage', waarde: wachtInzage, kleur: wachtInzage > 0 ? 'var(--mf-amber)' : 'var(--text-1)' },
              ].map(s => (
                <Card key={s.label} style={{ padding: '16px 18px' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: s.kleur }}>{s.waarde}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Klant koppelen */}
            <Card style={{ padding: '18px 20px', marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
                <UserPlus size={15} aria-hidden style={{ color: 'var(--mf-green)' }} />
                Klant koppelen
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
                Koppel een bestaand account op e-mailadres, of{' '}
                <Link href="/coaching/uitnodigen" style={{ color: 'var(--mf-green)', fontWeight: 600, textDecoration: 'none' }}>
                  nodig een nieuwe klant uit
                </Link>.
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <Field label="E-mailadres klant" error={fout ?? undefined}>
                    <input
                      type="email"
                      className="mf-input"
                      placeholder="klant@voorbeeld.nl"
                      value={email}
                      autoComplete="off"
                      onChange={e => { setEmail(e.target.value); setFout(null); setSucces(null) }}
                      onKeyDown={e => e.key === 'Enter' && koppelKlant()}
                      style={{ borderRadius: 12, padding: '10px 14px', width: '100%' }}
                    />
                  </Field>
                </div>
                <Button onClick={koppelKlant} loading={koppelBezig} disabled={!email.trim()} leftIcon={<UserPlus size={15} aria-hidden />}>
                  Koppelen
                </Button>
              </div>
              {succes && (
                <p role="status" style={{ fontSize: 12, color: 'var(--mf-green)', marginTop: 10, fontWeight: 600 }}>{succes}</p>
              )}
            </Card>

            {/* Klantenlijst */}
            {klanten.length === 0 ? (
              <Card style={{ padding: 8 }}>
                <EmptyState
                  icon={Users}
                  title="Nog geen klanten"
                  description="Koppel je eerste coachingklant via het e-mailadres van hun MentaForce-account."
                />
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {klanten.map(k => {
                  const stijl = KOPPEL_STATUS_STIJL[k.status]
                  return (
                    <Link key={k.klant_id} href={`/coaching/${k.klant_id}`} style={{ textDecoration: 'none' }}>
                      <Card className="mf-klant-rij" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                        <Avatar naam={k.naam} avatarUrl={k.avatar_url} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{k.naam}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {k.email ?? ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {k.status === 'actief' && (
                            k.inzage_toestemming ? (
                              <Badge variant="success" style={{ fontSize: 10, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <ShieldCheck size={11} aria-hidden /> Inzage
                              </Badge>
                            ) : (
                              <Badge variant="warning" style={{ fontSize: 10, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <ShieldAlert size={11} aria-hidden /> Wacht op inzage
                              </Badge>
                            )
                          )}
                          <Badge variant="neutral" style={{ fontSize: 10, padding: '2px 8px', background: stijl.bg, color: stijl.color }}>
                            {stijl.label}
                          </Badge>
                          <ChevronRight size={16} aria-hidden style={{ color: 'var(--text-4)' }} />
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        <style>{`
          .mf-klant-rij { transition: border-color 0.15s var(--ease), transform 0.1s var(--ease); }
          .mf-klant-rij:hover { border-color: var(--mf-green); transform: translateY(-1px); }
        `}</style>
      </main>
    </div>
  )
}
