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

const STATUS_STIJL: Record<UitnodigingStatus, { variant: 'warning' | 'success' | 'neutral'; label: string }> = {
  open:         { variant: 'warning', label: 'Openstaand' },
  geaccepteerd: { variant: 'success', label: 'Geaccepteerd' },
  ingetrokken:  { variant: 'neutral', label: 'Ingetrokken' },
  verlopen:     { variant: 'neutral', label: 'Verlopen' },
}

function formatDatum(waarde: string | null): string {
  if (!waarde) return ''
  return new Date(waarde).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CoachingUitnodigenPagina() {
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
      setSucces(`Uitnodiging verstuurd naar ${data.email ?? email.trim()}.`)
      setEmail('')
      setNaam('')
      await laadUitnodigingen()
    } else {
      setFout(data.error ?? 'Uitnodigen mislukt.')
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
      setFout(data.error ?? 'Intrekken mislukt.')
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
          eyebrow="Coaching"
          titel="Klant uitnodigen"
          subtitel="Nodig een nieuwe klant uit per e-mail. Ze maken een account aan of loggen in en worden automatisch aan jou gekoppeld."
          backHref="/coaching"
          backLabel="Terug naar klanten"
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : (
          <>
            {/* Hero-stats */}
            <div className="mf-animate-up mf-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
              <CoachStat label="Verstuurd" waarde={uitnodigingen.length} glow={uitnodigingen.length > 0} />
              <CoachStat label="Openstaand" waarde={openstaand} accent={openstaand > 0 ? 'var(--mf-amber)' : 'var(--text-1)'} />
              <CoachStat label="Geaccepteerd" waarde={geaccepteerd} accent="var(--mf-green)" />
            </div>

            {/* Uitnodigen-formulier */}
            <Card className="mf-animate-up mf-delay-2" style={{ padding: '20px 22px', marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailPlus size={15} aria-hidden style={{ color: 'var(--mf-green)' }} />
                Nieuwe uitnodiging
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>
                De link in de e-mail blijft 14 dagen geldig. De klant bepaalt zelf welke gegevens ze delen.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 220 }}>
                    <Field label="E-mailadres klant" error={fout ?? undefined}>
                      <input
                        type="email"
                        className="mf-input"
                        placeholder="klant@voorbeeld.nl"
                        value={email}
                        autoComplete="off"
                        onChange={e => { setEmail(e.target.value); setFout(null); setSucces(null) }}
                        onKeyDown={e => e.key === 'Enter' && verstuurUitnodiging()}
                        style={{ borderRadius: 12, padding: '11px 14px', width: '100%' }}
                      />
                    </Field>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <Field label="Naam (optioneel)">
                      <input
                        type="text"
                        className="mf-input"
                        placeholder="Voornaam"
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
                    Uitnodiging versturen
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
                titel="Nog geen uitnodigingen"
                tekst="Stuur je eerste uitnodiging via het e-mailadres van je klant."
              />
            ) : (
              <section aria-label="Verstuurde uitnodigingen" className="mf-coach-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {uitnodigingen.map(u => {
                  const stijl = STATUS_STIJL[u.status]
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
                            ? `Geaccepteerd op ${formatDatum(u.geaccepteerd_op)}`
                            : `Verstuurd op ${formatDatum(u.aangemaakt_op)}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Badge variant={verloopt ? 'neutral' : stijl.variant} style={{ fontSize: 10, padding: '3px 9px' }}>
                          {verloopt ? 'Verlopen' : stijl.label}
                        </Badge>
                        {u.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => trekIn(u.id)}
                            loading={intrekBezig === u.id}
                            leftIcon={<X size={14} aria-hidden />}
                            aria-label={`Uitnodiging voor ${u.email} intrekken`}
                            style={{ color: 'var(--mf-red)' }}
                          >
                            Intrekken
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
