'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'


interface UitdagingLog { user_id: string; datum: string; waarde: number | null }

interface Uitdaging {
  id: string
  naam: string
  beschrijving: string | null
  type: string
  doel_waarde: number | null
  eenheid: string | null
  start_datum: string
  eind_datum: string
  team_uitdaging_logs: UitdagingLog[]
}

const TYPE_LABELS: Record<string, string> = {
  stappen: '👟 Stappen', checkin: '✅ Check-ins', sport: '💪 Sport',
  voeding: '🥗 Voeding', meditatie: '🧘 Meditatie', focus: '⏱️ Focus', custom: '🎯 Overig',
}

function dagsTot(datum: string): number {
  const nu = new Date()
  const d = new Date(datum)
  return Math.max(0, Math.ceil((d.getTime() - nu.getTime()) / 86400000))
}

function voortgangPct(logs: UitdagingLog[], doelWaarde: number | null, userId: string | null): number {
  if (!userId) return 0
  const mijnLogs = logs.filter(l => l.user_id === userId)
  if (!mijnLogs.length) return 0
  if (!doelWaarde) return mijnLogs.length > 0 ? 100 : 0
  const totaal = mijnLogs.reduce((s, l) => s + (l.waarde ?? 1), 0)
  return Math.min(100, Math.round((totaal / doelWaarde) * 100))
}

export default function TeamUitdagingenPagina() {
  const router = useRouter()
  const [uitdagingen, setUitdagingen] = useState<Uitdaging[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)
  const [loggen, setLoggen] = useState<string | null>(null)
  const [logWaarde, setLogWaarde] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      try {
        const res = await authFetch('/api/team-uitdagingen')
        if (res.ok) {
          const json = await res.json() as { uitdagingen: Uitdaging[] }
          setUitdagingen(json.uitdagingen ?? [])
        }
      } catch { /* niet-kritiek */ }
      setLaden(false)
    }
    laad()
  }, [router])

  async function logVoortgang(uitdagingId: string) {
    setLoggen(uitdagingId)
    try {
      const res = await authFetch(`/api/team-uitdagingen/${uitdagingId}/log`, {
        method: 'POST',
        body: JSON.stringify({ waarde: logWaarde ? Number(logWaarde) : undefined }),
      })
      if (res.ok) {
        const json = await res.json() as { log: UitdagingLog }
        setUitdagingen(prev => prev.map(u =>
          u.id === uitdagingId
            ? { ...u, team_uitdaging_logs: [...u.team_uitdaging_logs, json.log] }
            : u,
        ))
        setLogWaarde('')
      }
    } catch { /* stil falen */ }
    setLoggen(null)
  }

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
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Team uitdagingen
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              Doe mee met collectieve uitdagingen en boost je teamwelzijn
            </p>
          </div>
          <Link href="/uitdagingen" style={{ fontSize: 12, color: 'var(--mentaforce-primary, #6366f1)', fontWeight: 600, textDecoration: 'none' }}>
            Alle uitdagingen →
          </Link>
        </header>

        {uitdagingen.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '48px 24px',
            border: '2px dashed #E5E7EB', textAlign: 'center',
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 70%)' }} />
              </div>
              <div style={{ fontSize: 48, position: 'relative', zIndex: 1 }}>🏆</div>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>
              Geen actieve uitdagingen
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 }}>
              Je HR-team kan uitdagingen aanmaken via het HR-portaal.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {uitdagingen.map(u => {
              const pct = voortgangPct(u.team_uitdaging_logs, u.doel_waarde, userId)
              const dagen = dagsTot(u.eind_datum)
              const deelnemers = new Set(u.team_uitdaging_logs.map(l => l.user_id)).size
              const heeftVandaag = u.team_uitdaging_logs.some(
                l => l.user_id === userId && l.datum === new Date().toISOString().split('T')[0],
              )

              return (
                <article key={u.id} style={{
                  background: 'var(--bg-card)', borderRadius: 20, padding: '20px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
                          {TYPE_LABELS[u.type] ?? u.type}
                        </span>
                        {heeftVandaag && (
                          <span style={{ fontSize: 10, background: 'var(--mf-green-light)', color: 'var(--mf-green)', fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                            ✓ vandaag gelogd
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>{u.naam}</h2>
                      {u.beschrijving && (
                        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{u.beschrijving}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{pct}%</p>
                      <p style={{ fontSize: 10, color: 'var(--text-3)' }}>jouw voortgang</p>
                    </div>
                  </div>

                  {/* Voortgangsbalk */}
                  <div style={{ height: 6, borderRadius: 9999, background: 'var(--bg-subtle)', marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 9999, width: `${pct}%`,
                      background: pct >= 100 ? 'var(--mf-green)' : 'linear-gradient(90deg, #6366f1, #8B5CF6)',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {deelnemers} deelnemer{deelnemers !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 11, color: dagen <= 3 ? 'var(--mf-red)' : 'var(--text-3)', fontWeight: dagen <= 3 ? 700 : 400 }}>
                      {dagen === 0 ? 'Vandaag laatste dag!' : `${dagen} dag${dagen !== 1 ? 'en' : ''} resterend`}
                    </span>
                  </div>

                  {/* Log sectie */}
                  {u.doel_waarde ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        value={logWaarde}
                        onChange={e => setLogWaarde(e.target.value)}
                        placeholder={`Voer ${u.eenheid ?? 'waarde'} in`}
                        min={0}
                        style={{
                          flex: 1, padding: '9px 12px', borderRadius: 10,
                          border: '1px solid var(--border)', fontSize: 13, outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => logVoortgang(u.id)}
                        disabled={loggen === u.id || !logWaarde}
                        style={{
                          padding: '9px 16px', borderRadius: 10, border: 'none',
                          background: 'var(--text-1)', color: 'white', fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', opacity: loggen === u.id || !logWaarde ? 0.5 : 1,
                        }}
                      >
                        {loggen === u.id ? '…' : 'Log'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => logVoortgang(u.id)}
                      disabled={loggen === u.id || heeftVandaag}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                        background: heeftVandaag ? 'var(--bg-subtle)' : 'var(--text-1)',
                        color: heeftVandaag ? 'var(--text-3)' : 'white',
                        fontWeight: 700, fontSize: 13, cursor: heeftVandaag ? 'default' : 'pointer',
                      }}
                    >
                      {heeftVandaag ? '✓ Vandaag geregistreerd' : loggen === u.id ? 'Bezig…' : 'Deelnemen vandaag'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}

