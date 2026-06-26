'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

const STAP_DOEL = 10_000
const KLEUR = '#F97316'   // oranje — past bij beweging
const LICHT  = '#FFF7ED'

interface DagStap { datum: string; stappen: number | null }

function dagNaam(datum: string): string {
  return new Date(datum + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2)
}

function vandaagStr(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date())
}

function StappenRing({ stappen, doel }: { stappen: number; doel: number }) {
  const r = 62
  const circ = 2 * Math.PI * r
  const pct = Math.min(stappen / doel, 1)
  const pctOverschot = pct > 1 ? (stappen / doel - 1) : 0
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke={`${KLEUR}20`} strokeWidth="12" />
      <circle
        cx="80" cy="80" r={r} fill="none"
        stroke={KLEUR} strokeWidth="12"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
      />
      {pctOverschot > 0 && (
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke="#22C55E" strokeWidth="12"
          strokeDasharray={`${Math.min(pctOverschot, 1) * circ} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
        />
      )}
      <text x="80" y="74" textAnchor="middle" fontSize="28" fontWeight="800" fill={stappen >= doel ? '#22C55E' : KLEUR}>
        {stappen.toLocaleString('nl-NL')}
      </text>
      <text x="80" y="91" textAnchor="middle" fontSize="11" fill="var(--text-4)" fontWeight="500">
        stappen
      </text>
      <text x="80" y="107" textAnchor="middle" fontSize="10" fill="var(--text-3)">
        doel: {doel.toLocaleString('nl-NL')}
      </text>
    </svg>
  )
}

export default function StappenPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [vandaag, setVandaag] = useState(0)
  const [dagen, setDagen] = useState<DagStap[]>([])
  const [invoer, setInvoer] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)
  const [trackerLaden, setTrackerLaden] = useState(false)
  const [trackerFout, setTrackerFout] = useState<string | null>(null)

  const laadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const res = await authFetch('/api/stappen')
    if (res.ok) {
      const json = await res.json() as { dagen: DagStap[] }
      setDagen(json.dagen ?? [])
      const hVandaag = (json.dagen ?? []).find(d => d.datum === vandaagStr())
      setVandaag(hVandaag?.stappen ?? 0)
    }
    setLaden(false)
  }, [router])

  useEffect(() => { laadData() }, [laadData])

  async function slaOpHandmatig() {
    const n = parseInt(invoer.replace(/\D/g, ''), 10)
    if (!n || n < 0 || n > 200_000) return
    setOpslaan(true)
    const res = await authFetch('/api/stappen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stappen: n }),
    })
    if (res.ok) {
      setVandaag(n)
      setInvoer('')
      setSucces(true)
      setTimeout(() => setSucces(false), 2500)
      laadData()
    }
    setOpslaan(false)
  }

  async function leesViaTracker() {
    setTrackerLaden(true)
    setTrackerFout(null)
    try {
      const platform = Capacitor.getPlatform()
      if (platform === 'ios') {
        const { leesAppleHealthBereik, vraagAppleHealthPermissies } = await import('@/lib/apple-health')
        const ok = await vraagAppleHealthPermissies()
        if (!ok) { setTrackerFout('Geen toegang tot Apple Health'); setTrackerLaden(false); return }
        const metingen = await leesAppleHealthBereik(1)
        const vandaagMeting = metingen.find(m => m.datum === vandaagStr())
        if (vandaagMeting?.stappen) {
          const res = await authFetch('/api/stappen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stappen: vandaagMeting.stappen }),
          })
          if (res.ok) {
            setVandaag(vandaagMeting.stappen)
            setSucces(true)
            setTimeout(() => setSucces(false), 2500)
            laadData()
          }
        } else {
          setTrackerFout('Geen stappenteller data gevonden in Apple Health')
        }
      } else if (platform === 'android') {
        const { leesHealthBereik, vraagPermissies } = await import('@/lib/health-connect')
        const ok = await vraagPermissies()
        if (!ok) { setTrackerFout('Geen toegang tot Health Connect'); setTrackerLaden(false); return }
        const metingen = await leesHealthBereik(1)
        const vandaagMeting = metingen.find(m => m.datum === vandaagStr())
        if (vandaagMeting?.stappen) {
          const res = await authFetch('/api/stappen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stappen: vandaagMeting.stappen }),
          })
          if (res.ok) {
            setVandaag(vandaagMeting.stappen)
            setSucces(true)
            setTimeout(() => setSucces(false), 2500)
            laadData()
          }
        } else {
          setTrackerFout('Geen stappenteller data gevonden in Health Connect')
        }
      } else {
        setTrackerFout('Tracker beschikbaar in de iOS/Android app')
      }
    } catch {
      setTrackerFout('Kon geen verbinding maken met de tracker')
    }
    setTrackerLaden(false)
  }

  const pct = Math.min(Math.round((vandaag / STAP_DOEL) * 100), 100)
  const maxStappen = Math.max(...dagen.map(d => d.stappen ?? 0), STAP_DOEL)

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: KLEUR, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: KLEUR, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bewegen</span>
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            Dagelijkse stappen
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 4 }}>
            Doel: {STAP_DOEL.toLocaleString('nl-NL')} stappen per dag
          </p>
        </header>

        {/* Vandaag ring */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, padding: '28px 20px',
          boxShadow: 'var(--shadow-sm)', marginBottom: 16, textAlign: 'center',
          border: `1px solid ${KLEUR}22`,
        }}>
          <StappenRing stappen={vandaag} doel={STAP_DOEL} />
          {vandaag >= STAP_DOEL && (
            <p style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: '#22C55E' }}>
              🎉 Dagdoel behaald! Geweldig!
            </p>
          )}
          {vandaag > 0 && vandaag < STAP_DOEL && (
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-3)' }}>
              Nog {(STAP_DOEL - vandaag).toLocaleString('nl-NL')} stappen te gaan ({pct}%)
            </p>
          )}
          {vandaag === 0 && (
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-4)' }}>
              Voer je stappen in of sync via je tracker
            </p>
          )}
        </div>

        {/* Succes melding */}
        {succes && (
          <div style={{
            background: LICHT, border: `1px solid ${KLEUR}44`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            fontSize: 14, color: KLEUR, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>✓</span> Stappen opgeslagen!
          </div>
        )}

        {/* Handmatige invoer */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 16, padding: '20px',
          boxShadow: 'var(--shadow-sm)', marginBottom: 14,
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>
            Stappen handmatig invoeren
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number"
              inputMode="numeric"
              placeholder="bijv. 8500"
              value={invoer}
              onChange={e => setInvoer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && slaOpHandmatig()}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid var(--border)', background: 'var(--bg-app)',
                fontSize: 16, color: 'var(--text-1)', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={slaOpHandmatig}
              disabled={opslaan || !invoer}
              style={{
                padding: '12px 20px', borderRadius: 10, fontWeight: 700,
                fontSize: 15, border: 'none', cursor: invoer ? 'pointer' : 'not-allowed',
                background: invoer ? KLEUR : 'var(--bg-subtle)',
                color: invoer ? '#fff' : 'var(--text-4)',
              }}
            >
              {opslaan ? '…' : 'Opslaan'}
            </button>
          </div>

          {/* Snelle opties */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[5000, 7500, 10000, 12500].map(n => (
              <button
                key={n}
                onClick={() => setInvoer(String(n))}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${invoer === String(n) ? KLEUR : 'var(--border)'}`,
                  background: invoer === String(n) ? LICHT : 'var(--bg-app)',
                  color: invoer === String(n) ? KLEUR : 'var(--text-3)',
                  cursor: 'pointer',
                }}
              >
                {(n / 1000).toLocaleString('nl-NL')}k
              </button>
            ))}
          </div>
        </div>

        {/* Tracker sync */}
        <button
          onClick={leesViaTracker}
          disabled={trackerLaden}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 14,
            background: trackerLaden ? 'var(--bg-subtle)' : 'var(--bg-card)',
            border: `1.5px solid ${KLEUR}44`,
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: trackerLaden ? 'default' : 'pointer', marginBottom: 4,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span style={{ fontSize: 22 }}>📱</span>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
              {trackerLaden ? 'Synchroniseren…' : 'Sync via Apple Health / Health Connect'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
              Automatisch stappen ophalen uit je tracker
            </div>
          </div>
          <span style={{ fontSize: 18, color: 'var(--text-4)' }}>›</span>
        </button>

        {trackerFout && (
          <p style={{ fontSize: 12, color: 'var(--mf-red)', marginBottom: 14, paddingLeft: 4 }}>
            {trackerFout}
          </p>
        )}

        {/* 7-daagse grafiek */}
        {dagen.length > 0 && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, padding: '18px 16px',
            boxShadow: 'var(--shadow-sm)', marginTop: 14,
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 14 }}>
              7 DAGEN OVERZICHT
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {(() => {
                const vandaag_ = vandaagStr()
                const rijen = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(Date.now() - (6 - i) * 86_400_000)
                  const ds = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(d)
                  const gevonden = dagen.find(r => r.datum === ds)
                  return { datum: ds, stappen: gevonden?.stappen ?? 0, isVandaag: ds === vandaag_ }
                })
                return rijen.map(({ datum, stappen: s, isVandaag }) => {
                  const hoogte = Math.max(4, ((s ?? 0) / maxStappen) * 72)
                  const bereikt = (s ?? 0) >= STAP_DOEL
                  return (
                    <div key={datum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%', height: hoogte, borderRadius: 6,
                        background: bereikt ? '#22C55E' : isVandaag ? KLEUR : `${KLEUR}55`,
                        marginTop: 'auto',
                        transition: 'height 0.5s ease',
                      }} />
                      <span style={{
                        fontSize: 10, fontWeight: isVandaag ? 800 : 500,
                        color: isVandaag ? KLEUR : 'var(--text-4)',
                      }}>
                        {dagNaam(datum)}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                Gem: {dagen.length ? Math.round(dagen.reduce((s, d) => s + (d.stappen ?? 0), 0) / dagen.filter(d => (d.stappen ?? 0) > 0).length || 0).toLocaleString('nl-NL') : '–'} stappen
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                Totaal: {dagen.reduce((s, d) => s + (d.stappen ?? 0), 0).toLocaleString('nl-NL')}
              </span>
            </div>
          </div>
        )}
      </main>

      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  )
}
