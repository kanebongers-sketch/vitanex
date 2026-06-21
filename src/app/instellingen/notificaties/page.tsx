'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

interface Voorkeuren {
  checkin_reminder: boolean
  stemming_reminder: boolean
  slaap_reminder: boolean
  reminder_tijd: string
}

export default function NotificatiesPage() {
  const router = useRouter()
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
    await supabase.from('notificatie_voorkeuren').upsert({
      user_id: userId,
      ...voorkeuren,
      bijgewerkt_op: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setBezig(false)
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 2500)
  }

  const OPTIES = [
    {
      key: 'checkin_reminder' as const,
      label: 'Wekelijkse check-in herinnering',
      beschrijving: 'Ontvang een herinnering om je wekelijkse check-in te doen',
      kleur: 'var(--mf-green)',
    },
    {
      key: 'stemming_reminder' as const,
      label: 'Dagelijkse stemming herinnering',
      beschrijving: 'Dagelijkse nudge om je stemming en energie te loggen',
      kleur: 'var(--mf-amber)',
    },
    {
      key: 'slaap_reminder' as const,
      label: 'Slaap logging herinnering',
      beschrijving: 'Herinnering om je slaap bij te houden',
      kleur: 'var(--mf-purple)',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 600, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/instellingen" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: 13 }}>â† Instellingen</Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Notificaties</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>Beheer jouw herinneringen en nudges</p>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="mf-spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Toggle opties */}
            {OPTIES.map(opt => (
              <div key={opt.key} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{opt.beschrijving}</p>
                  </div>
                  <button
                    onClick={() => setVoorkeuren(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                    style={{
                      width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer',
                      background: voorkeuren[opt.key] ? opt.kleur : 'var(--border)',
                      position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s',
                      left: voorkeuren[opt.key] ? 23 : 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              </div>
            ))}

            {/* Tijdstip */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 20px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Voorkeurstijdstip</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>Op welk moment wil je herinneringen ontvangen?</p>
              <input
                type="time"
                value={voorkeuren.reminder_tijd}
                onChange={e => setVoorkeuren(prev => ({ ...prev, reminder_tijd: e.target.value }))}
                style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 14px', fontSize: 14, outline: 'none', color: 'var(--text-2)' }}
              />
            </div>

            {/* Push notificaties info */}
            <div style={{ background: 'var(--mf-green-light)', borderRadius: 16, border: '1px solid #BBF7D0', padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 3 }}>Push notificaties via de app</p>
                  <p style={{ fontSize: 12, color: 'var(--mf-green-dark)', lineHeight: 1.5 }}>
                    Voor push notificaties op je telefoon, download de Vitaal app. In de app kun je notificaties inschakelen via je telefooninstellingen.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={slaOp}
              disabled={bezig}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 600,
                color: 'white', border: 'none', cursor: 'pointer', background: 'var(--mf-green)',
                opacity: bezig ? 0.7 : 1, marginTop: 4,
              }}
            >
              {bezig ? 'Opslaan...' : opgeslagen ? '✓ Opgeslagen!' : 'Voorkeuren opslaan'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

