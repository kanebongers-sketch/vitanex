'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

const STEMMING_OPTIES = [
  { waarde: 1, emoji: '😫', label: 'Slecht' },
  { waarde: 2, emoji: '😔', label: 'Matig' },
  { waarde: 3, emoji: '😐', label: 'Neutraal' },
  { waarde: 4, emoji: '🙂', label: 'Goed' },
  { waarde: 5, emoji: '😄', label: 'Super!' },
]

const ENERGIE_OPTIES = [
  { waarde: 1, emoji: '🔋', label: 'Leeg' },
  { waarde: 2, emoji: '🔋', label: 'Laag' },
  { waarde: 3, emoji: '⚡', label: 'Normaal' },
  { waarde: 4, emoji: '⚡', label: 'Goed' },
  { waarde: 5, emoji: '🚀', label: 'Vol!' },
]

interface StemmingLog {
  id: string
  stemming: number
  energie: number | null
  emoji: string | null
  notitie: string | null
  aangemaakt_op: string
}

export default function StemmingPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [logs, setLogs] = useState<StemmingLog[]>([])
  const [stemming, setStemming] = useState<number>(3)
  const [energie, setEnergie] = useState<number>(3)
  const [notitie, setNotitie] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/stemming?limit=10')
      if (res.ok) {
        const json = await res.json() as { logs: StemmingLog[] }
        setLogs(json.logs ?? [])
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function verstuur() {
    setOpslaan(true)
    try {
      const res = await authFetch('/api/stemming', {
        method: 'POST',
        body: JSON.stringify({
          stemming,
          energie,
          emoji: STEMMING_OPTIES.find(o => o.waarde === stemming)?.emoji,
          notitie: notitie || undefined,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { log: StemmingLog }
        setLogs(prev => [json.log, ...prev.slice(0, 9)])
        setNotitie('')
        setSucces(true)
        setTimeout(() => setSucces(false), 3000)
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  const stemmingKleur = (s: number) =>
    s >= 4 ? '#1D9E75' : s >= 3 ? '#F59E0B' : '#EF4444'

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Dagelijkse stemming
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Hoe voel je je op dit moment?</p>
        </header>

        {succes && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803D', fontWeight: 600 }}>
            Stemming opgeslagen ✓
          </div>
        )}

        {/* Stemming kiezer */}
        <div style={{ background: 'white', borderRadius: 20, padding: '20px', border: '1px solid #E5E7EB', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
            Stemming
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            {STEMMING_OPTIES.map(o => (
              <button key={o.waarde} onClick={() => setStemming(o.waarde)} style={{
                flex: 1, height: 56, borderRadius: 14, cursor: 'pointer',
                background: stemming === o.waarde ? stemmingKleur(o.waarde) + '15' : '#F9FAFB',
                border: stemming === o.waarde ? `2px solid ${stemmingKleur(o.waarde)}` : '2px solid transparent',
                fontSize: 24,
                transition: 'all 0.12s',
              }}>
                {o.emoji}
              </button>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: stemmingKleur(stemming) }}>
            {STEMMING_OPTIES.find(o => o.waarde === stemming)?.label}
          </p>
        </div>

        {/* Energie */}
        <div style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #E5E7EB', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
            Energieniveau
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {ENERGIE_OPTIES.map(o => (
              <button key={o.waarde} onClick={() => setEnergie(o.waarde)} style={{
                flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: energie === o.waarde ? '#6366f1' : '#F3F4F6',
                color: energie === o.waarde ? 'white' : '#6B7280',
                fontWeight: 700, fontSize: 11,
                transition: 'background 0.12s',
              }}>
                {o.waarde}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
            {ENERGIE_OPTIES.find(o => o.waarde === energie)?.label}
          </p>
        </div>

        {/* Notitie */}
        <div style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #E5E7EB', marginBottom: 16 }}>
          <textarea
            value={notitie}
            onChange={e => setNotitie(e.target.value)}
            placeholder="Wat speelt er? (optioneel)"
            maxLength={150}
            rows={2}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontSize: 13, color: '#374151', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button onClick={verstuur} disabled={opslaan} style={{
          width: '100%', padding: '14px', borderRadius: 14, marginBottom: 28,
          background: opslaan ? '#9CA3AF' : '#111827',
          color: 'white', border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 700,
        }}>
          {opslaan ? 'Opslaan…' : 'Log stemming →'}
        </button>

        {/* Recente stemming */}
        {logs.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
              Recente check-ins
            </p>

            {/* Mini stemming grafiek */}
            <div style={{ background: 'white', borderRadius: 14, padding: '14px', border: '1px solid #E5E7EB', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
                {[...logs].reverse().map(log => {
                  const h = (log.stemming / 5) * 36
                  return (
                    <div key={log.id} title={STEMMING_OPTIES.find(o => o.waarde === log.stemming)?.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{
                        width: '70%', borderRadius: 3,
                        height: h,
                        background: stemmingKleur(log.stemming),
                        transition: 'height 0.3s',
                      }} />
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  background: 'white', borderRadius: 12, padding: '12px 14px',
                  border: '1px solid #E5E7EB',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>
                    {STEMMING_OPTIES.find(o => o.waarde === log.stemming)?.emoji ?? '😐'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: stemmingKleur(log.stemming) }}>
                      {STEMMING_OPTIES.find(o => o.waarde === log.stemming)?.label}
                      {log.energie && ` · energie ${log.energie}/5`}
                    </p>
                    {log.notitie && <p style={{ fontSize: 11, color: '#9CA3AF' }}>{log.notitie}</p>}
                  </div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>
                    {new Date(log.aangemaakt_op).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

