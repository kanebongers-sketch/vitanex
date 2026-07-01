'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Lightbulb } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface Voorkeuren {
  checkin_reminder: boolean
  stemming_reminder: boolean
  slaap_reminder: boolean
  reminder_tijd: string
}

export default function NotificatiesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [voorkeuren, setVoorkeuren] = useState<Voorkeuren>({
    checkin_reminder: true,
    stemming_reminder: false,
    slaap_reminder: false,
    reminder_tijd: '08:00',
  })
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('notificatie_voorkeuren')
        .select('checkin_reminder, stemming_reminder, slaap_reminder, reminder_tijd')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setVoorkeuren({ ...voorkeuren, ...data })
      setLaden(false)
    }
    laad()
  }, [router])

  async function slaOp() {
    if (!userId) return
    setBezig(true)
    const { error } = await supabase.from('notificatie_voorkeuren').upsert({
      user_id: userId,
      ...voorkeuren,
      bijgewerkt_op: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setBezig(false)
    if (error) {
      toast({ title: 'Opslaan mislukt', description: 'Probeer het later opnieuw.', variant: 'error' })
      return
    }
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 2500)
  }

  const OPTIES = [
    {
      key: 'checkin_reminder' as const,
      label: 'Wekelijkse check-in herinnering',
      beschrijving: 'Ontvang een herinnering om je wekelijkse check-in te doen',
    },
    {
      key: 'stemming_reminder' as const,
      label: 'Dagelijkse stemming herinnering',
      beschrijving: 'Dagelijkse nudge om je stemming en energie te loggen',
    },
    {
      key: 'slaap_reminder' as const,
      label: 'Slaap logging herinnering',
      beschrijving: 'Herinnering om je slaap bij te houden',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link
            href="/instellingen"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', textDecoration: 'none', fontSize: 13 }}
          >
            <ArrowLeft size={15} aria-hidden />
            Instellingen
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Notificaties</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>Beheer jouw herinneringen en nudges</p>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="mf-spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Toggle opties */}
            {OPTIES.map(opt => {
              const actief = voorkeuren[opt.key]
              return (
                <Card key={opt.key} style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{opt.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{opt.beschrijving}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={actief}
                      aria-label={opt.label}
                      onClick={() => setVoorkeuren(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                      className="mf-switch"
                      style={{
                        width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer',
                        background: actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
                        position: 'relative', flexShrink: 0, transition: 'background 0.2s var(--ease)',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                        background: 'var(--bg-card)', transition: 'transform 0.2s var(--ease)',
                        transform: actief ? 'translateX(23px)' : 'translateX(3px)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      }} />
                    </button>
                  </div>
                </Card>
              )
            })}

            {/* Tijdstip */}
            <Card style={{ padding: '18px 20px' }}>
              <Field label="Voorkeurstijdstip" hint="Op welk moment wil je herinneringen ontvangen?">
                <Input
                  type="time"
                  value={voorkeuren.reminder_tijd}
                  onChange={e => setVoorkeuren(prev => ({ ...prev, reminder_tijd: e.target.value }))}
                  style={{ width: 'auto' }}
                />
              </Field>
            </Card>

            {/* Push notificaties info */}
            <div style={{ background: 'var(--mentaforce-primary-light)', borderRadius: 'var(--radius-card)', border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 35%, transparent)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Lightbulb size={16} aria-hidden style={{ flexShrink: 0, color: 'var(--mentaforce-primary)', marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>Push notificaties via de app</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    Voor push notificaties op je telefoon, download de Vitaal app. In de app kun je notificaties inschakelen via je telefooninstellingen.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={slaOp}
              loading={bezig}
              leftIcon={opgeslagen ? <Check size={16} aria-hidden /> : undefined}
              style={{ width: '100%', marginTop: 4 }}
            >
              {bezig ? 'Opslaan...' : opgeslagen ? 'Opgeslagen!' : 'Voorkeuren opslaan'}
            </Button>
          </div>
        )}
      </main>
      <style>{`
        .mf-switch:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 3px;
        }
      `}</style>
    </div>
  )
}
