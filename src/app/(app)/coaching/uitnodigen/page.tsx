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
import { MailPlus, Mail, ArrowLeft, X, Check, Clock } from 'lucide-react'
import type { CoachingUitnodiging, UitnodigingStatus } from '@/lib/coaching/uitnodiging-server'

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <Link
            href="/coaching"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 12 }}
          >
            <ArrowLeft size={14} aria-hidden /> Terug naar coaching
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Klant uitnodigen
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Nodig een nieuwe klant uit per e-mail. Ze maken een account aan of loggen in en worden
            automatisch aan jou gekoppeld.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : (
          <>
            {/* Stat-strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Verstuurd', waarde: uitnodigingen.length, kleur: 'var(--text-1)' },
                { label: 'Openstaand', waarde: openstaand, kleur: openstaand > 0 ? 'var(--mf-amber)' : 'var(--text-1)' },
                { label: 'Geaccepteerd', waarde: geaccepteerd, kleur: 'var(--mf-green)' },
              ].map(s => (
                <Card key={s.label} style={{ padding: '16px 18px' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: s.kleur }}>{s.waarde}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Uitnodigen-formulier */}
            <Card style={{ padding: '18px 20px', marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
                <MailPlus size={15} aria-hidden style={{ color: 'var(--mf-green)' }} />
                Nieuwe uitnodiging
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
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
                        style={{ borderRadius: 12, padding: '10px 14px', width: '100%' }}
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
                        style={{ borderRadius: 12, padding: '10px 14px', width: '100%' }}
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
                <p role="status" style={{ fontSize: 12, color: 'var(--mf-green)', marginTop: 12, fontWeight: 600 }}>{succes}</p>
              )}
            </Card>

            {/* Lijst */}
            {uitnodigingen.length === 0 ? (
              <Card style={{ padding: 8 }}>
                <EmptyState
                  icon={Mail}
                  title="Nog geen uitnodigingen"
                  description="Stuur je eerste uitnodiging via het e-mailadres van je klant."
                />
              </Card>
            ) : (
              <section aria-label="Verstuurde uitnodigingen" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {uitnodigingen.map(u => {
                  const stijl = STATUS_STIJL[u.status]
                  const verloopt = u.status === 'open' ? new Date(u.verloopt_op).getTime() < Date.now() : false
                  return (
                    <Card key={u.id} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span
                        aria-hidden
                        style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                      >
                        {u.status === 'geaccepteerd' ? <Check size={16} style={{ color: 'var(--mf-green)' }} /> : <Clock size={16} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.naam || u.email}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.naam ? `${u.email} · ` : ''}
                          {u.status === 'geaccepteerd'
                            ? `Geaccepteerd op ${formatDatum(u.geaccepteerd_op)}`
                            : `Verstuurd op ${formatDatum(u.aangemaakt_op)}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Badge variant={verloopt ? 'neutral' : stijl.variant} style={{ fontSize: 10, padding: '2px 8px' }}>
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
