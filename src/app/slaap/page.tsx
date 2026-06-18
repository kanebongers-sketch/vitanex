'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface SlaapLog {
  id: string
  datum: string
  uren_slaap: number
  kwaliteit: number | null
  bedtijd: string | null
  wektijd: string | null
  notitie: string | null
}

const KWALITEIT_LABELS = ['', 'Heel slecht', 'Slecht', 'Gemiddeld', 'Goed', 'Uitstekend']
const KWALITEIT_EMOJI  = ['', '😫', '😴', '😐', '🙂', '😄']

function urenNaarTijd(uren: number) {
  const h = Math.floor(uren)
  const m = Math.round((uren - h) * 60)
  return `${h}u${m > 0 ? ` ${m}m` : ''}`
}

export default function SlaapPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [logs, setLogs] = useState<SlaapLog[]>([])
  const [gemiddeldUren, setGemiddeldUren] = useState<number | null>(null)
  const [gemiddeldKwaliteit, setGemiddeldKwaliteit] = useState<number | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)

  // Form state
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0])
  const [uren, setUren] = useState<number>(7.5)
  const [kwaliteit, setKwaliteit] = useState<number>(3)
  const [bedtijd, setBedtijd] = useState('')
  const [wektijd, setWektijd] = useState('')
  const [notitie, setNotitie] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/slaap?limit=14')
      if (res.ok) {
        const json = await res.json() as { logs: SlaapLog[]; gemiddeld_uren: number | null; gemiddeld_kwaliteit: number | null }
        setLogs(json.logs ?? [])
        setGemiddeldUren(json.gemiddeld_uren)
        setGemiddeldKwaliteit(json.gemiddeld_kwaliteit)

        // Pre-fill vandaag als al aanwezig
        const vandaag = json.logs.find(l => l.datum === new Date().toISOString().split('T')[0])
        if (vandaag) {
          setUren(vandaag.uren_slaap)
          setKwaliteit(vandaag.kwaliteit ?? 3)
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
        body: JSON.stringify({ datum, uren_slaap: uren, kwaliteit, bedtijd: bedtijd || undefined, wektijd: wektijd || undefined, notitie: notitie || undefined }),
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
        setTimeout(() => router.push('/vandaag'), 1500)
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  const slaapKleur = (u: number) => u >= 7 ? '#1D9E75' : u >= 5 ? '#F59E0B' : '#EF4444'

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Slaaptracker
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Log je slaap en ontdek patronen</p>
        </header>

        {/* Stats */}
        {(gemiddeldUren !== null || gemiddeldKwaliteit !== null) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {gemiddeldUren !== null && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 6 }}>
                  Gem. slaap
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, color: slaapKleur(gemiddeldUren) }}>
                  {urenNaarTijd(gemiddeldUren)}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>afgelopen 2 weken</p>
              </div>
            )}
            {gemiddeldKwaliteit !== null && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 6 }}>
                  Gem. kwaliteit
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)' }}>{KWALITEIT_EMOJI[Math.round(gemiddeldKwaliteit)]}</p>
                <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                  {gemiddeldKwaliteit.toFixed(1)}/5 — {KWALITEIT_LABELS[Math.round(gemiddeldKwaliteit)]}
                </p>
              </div>
            )}
          </div>
        )}

        {succes && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803D', fontWeight: 600 }}>
            Slaap opgeslagen ✓
          </div>
        )}

        {/* Form */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '20px', border: '1px solid var(--border)', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 16 }}>
            Log invoeren
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Datum</label>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, boxSizing: 'border-box', background: 'var(--bg-card)', color: 'var(--text-1)' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              Uren geslapen: <strong style={{ color: slaapKleur(uren) }}>{urenNaarTijd(uren)}</strong>
            </label>
            <input type="range" min={0} max={12} step={0.5} value={uren} onChange={e => setUren(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: slaapKleur(uren) }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-4)' }}>
              <span>0u</span><span>6u</span><span>12u</span>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>Kwaliteit</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(k => (
                <button key={k} onClick={() => setKwaliteit(k)} style={{
                  flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: kwaliteit === k ? 'var(--mf-green)' : 'var(--bg-subtle)',
                  fontSize: 16, transition: 'background 0.12s',
                }}>
                  {KWALITEIT_EMOJI[k]}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4, textAlign: 'center' }}>{KWALITEIT_LABELS[kwaliteit]}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Bedtijd</label>
              <input type="time" value={bedtijd} onChange={e => setBedtijd(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, boxSizing: 'border-box', background: 'var(--bg-card)', color: 'var(--text-1)' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Wektijd</label>
              <input type="time" value={wektijd} onChange={e => setWektijd(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, boxSizing: 'border-box', background: 'var(--bg-card)', color: 'var(--text-1)' }} />
            </div>
          </div>

          <textarea
            value={notitie}
            onChange={e => setNotitie(e.target.value)}
            placeholder="Notitie (nachtmerrie, stress, cafeïne...)"
            maxLength={200}
            rows={2}
            style={{
              width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
              padding: '10px 12px', fontSize: 13, color: 'var(--text-2)',
              outline: 'none', resize: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', marginBottom: 14,
            }}
          />

          <button onClick={verstuur} disabled={opslaan} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: opslaan ? '#9CA3AF' : 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
            boxShadow: opslaan ? 'none' : '0 4px 16px rgba(29,158,117,0.35)',
            color: 'white', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700,
          }}>
            {opslaan ? 'Opslaan…' : 'Slaap loggen →'}
          </button>
        </div>

        {/* Geschiedenis */}
        {logs.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 10 }}>
              Laatste 14 dagen
            </p>
            {/* Bar chart */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
                {logs.slice(0, 14).reverse().map(log => {
                  const maxU = 10
                  const h = Math.max(4, (log.uren_slaap / maxU) * 56)
                  return (
                    <div key={log.id} title={`${log.datum}: ${urenNaarTijd(log.uren_slaap)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{
                        width: '100%', borderRadius: 4,
                        background: slaapKleur(log.uren_slaap),
                        height: h,
                      }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-4)' }}>14 dagen geleden</span>
                <span style={{ fontSize: 9, color: 'var(--text-4)' }}>Vandaag</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.slice(0, 7).map(log => (
                <div key={log.id} style={{
                  background: 'var(--bg-card)', borderRadius: 12, padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: slaapKleur(log.uren_slaap) + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 11, color: slaapKleur(log.uren_slaap),
                  }}>
                    {urenNaarTijd(log.uren_slaap)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                      {new Date(log.datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    {log.kwaliteit && <p style={{ fontSize: 10, color: 'var(--text-4)' }}>
                      {KWALITEIT_EMOJI[log.kwaliteit]} {KWALITEIT_LABELS[log.kwaliteit]}
                    </p>}
                  </div>
                  {log.bedtijd && <p style={{ fontSize: 10, color: 'var(--text-4)' }}>
                    {log.bedtijd.slice(0, 5)} → {log.wektijd?.slice(0, 5) ?? '?'}
                  </p>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

