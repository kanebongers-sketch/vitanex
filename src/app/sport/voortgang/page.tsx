'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type OefeningLog = {
  id: string
  oefening_naam: string
  set_nummer: number
  herhalingen: number
  gewicht_kg: number | null
  aangemaakt_op: string
  training_logs: { datum: string; naam: string }
}

type OefeningGroep = {
  naam: string
  logs: OefeningLog[]
  beginGewicht: number
  huidigGewicht: number
  progressieProcent: number
  sessies: SessieData[]
}

type SessieData = {
  datum: string
  maxGewicht: number
  totaalVolume: number
}

export default function VoortgangPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<OefeningLog[]>([])
  const [geselecteerdeOefening, setGeselecteerdeOefening] = useState<string>('')
  const [oefeningen, setOefeningen] = useState<OefeningGroep[]>([])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('oefening_logs')
        .select(`
          id, oefening_naam, set_nummer, herhalingen, gewicht_kg, aangemaakt_op,
          training_logs!inner(datum, naam)
        `)
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: true })

      if (data) {
        const typed = (data as unknown) as OefeningLog[]
        setLogs(typed)
        const groepen = verwerk(typed)
        setOefeningen(groepen)
        if (groepen.length > 0) setGeselecteerdeOefening(groepen[0].naam)
      }
      setLoading(false)
    }
    init()
  }, [router])

  function verwerk(data: OefeningLog[]): OefeningGroep[] {
    const map = new Map<string, OefeningLog[]>()
    for (const log of data) {
      const bestaande = map.get(log.oefening_naam) || []
      map.set(log.oefening_naam, [...bestaande, log])
    }

    return Array.from(map.entries()).map(([naam, logsVoorOefening]) => {
      const sessieMap = new Map<string, OefeningLog[]>()
      for (const log of logsVoorOefening) {
        const datum = log.training_logs.datum
        const bestaande = sessieMap.get(datum) || []
        sessieMap.set(datum, [...bestaande, log])
      }

      const sessies: SessieData[] = Array.from(sessieMap.entries()).map(([datum, sessielogs]) => {
        const maxGewicht = Math.max(...sessielogs.map(l => l.gewicht_kg ?? 0))
        const totaalVolume = sessielogs.reduce((acc, l) => acc + (l.herhalingen * (l.gewicht_kg ?? 0)), 0)
        return { datum, maxGewicht, totaalVolume }
      }).sort((a, b) => a.datum.localeCompare(b.datum))

      const beginGewicht = sessies[0]?.maxGewicht ?? 0
      const huidigGewicht = sessies[sessies.length - 1]?.maxGewicht ?? 0
      const progressieProcent = beginGewicht > 0
        ? Math.round(((huidigGewicht - beginGewicht) / beginGewicht) * 100)
        : 0

      return { naam, logs: logsVoorOefening, beginGewicht, huidigGewicht, progressieProcent, sessies }
    })
  }

  const actieveGroep = oefeningen.find(o => o.naam === geselecteerdeOefening)
  const totaalTrainingen = new Set(logs.map(l => l.training_logs.datum)).size
  const totaalSets = logs.length
  const besteOefening = [...oefeningen].sort((a, b) => b.progressieProcent - a.progressieProcent)[0]

  const recenteLogs = actieveGroep
    ? [...actieveGroep.logs].sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op)).slice(0, 10)
    : []

  const chartSessies = actieveGroep ? actieveGroep.sessies.slice(-8) : []
  const chartMax = chartSessies.length > 0 ? Math.max(...chartSessies.map(s => s.maxGewicht)) : 1

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <p style={{ color: '#6b7280', marginTop: 80 }}>Laden...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: 48 }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px 0' }}>

        <div style={{ marginBottom: 24 }}>
          <Link href="/sport" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none' }}>
            ← Terug naar sport
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: '8px 0 4px' }}>
            Mijn voortgang
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15 }}>Volg je gewichtsprogressie per oefening</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Trainingen', waarde: totaalTrainingen, kleur: '#185FA5' },
            { label: 'Sets gelogd', waarde: totaalSets, kleur: '#1D9E75' },
            { label: 'Beste oefening', waarde: besteOefening ? `+${besteOefening.progressieProcent}%` : '—', kleur: '#F97316', sub: besteOefening?.naam },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{stat.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: stat.kleur }}>{stat.waarde}</p>
              {stat.sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.sub}</p>}
            </div>
          ))}
        </div>

        {oefeningen.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📊</p>
            <p style={{ color: '#374151', fontWeight: 600, marginBottom: 8 }}>Nog geen logs gevonden</p>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Log je eerste training om je voortgang te zien.</p>
          </div>
        ) : (
          <>
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 8 }}>Selecteer oefening</label>
              <select
                value={geselecteerdeOefening}
                onChange={e => setGeselecteerdeOefening(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 15, color: '#111827', background: '#f9fafb', outline: 'none' }}
              >
                {oefeningen.map(o => (
                  <option key={o.naam} value={o.naam}>{o.naam}</option>
                ))}
              </select>
            </div>

            {actieveGroep && (
              <>
                <div style={{ background: '#fff', borderRadius: 12, padding: '20px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{actieveGroep.naam}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ background: '#f0fdf4', color: '#1D9E75', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                        Start: {actieveGroep.beginGewicht} kg
                      </span>
                      <span style={{ background: '#eff6ff', color: '#185FA5', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                        Nu: {actieveGroep.huidigGewicht} kg
                      </span>
                      <span style={{
                        background: actieveGroep.progressieProcent >= 0 ? '#f0fdf4' : '#fef2f2',
                        color: actieveGroep.progressieProcent >= 0 ? '#1D9E75' : '#ef4444',
                        borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600
                      }}>
                        {actieveGroep.progressieProcent >= 0 ? '+' : ''}{actieveGroep.progressieProcent}%
                      </span>
                    </div>
                  </div>

                  {chartSessies.length < 2 ? (
                    <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Log meer sessies om een grafiek te zien.</p>
                  ) : (
                    <svg width="100%" height="180" viewBox={`0 0 ${chartSessies.length * 72} 180`} preserveAspectRatio="none">
                      {chartSessies.map((sessie, i) => {
                        const barH = chartMax > 0 ? Math.max(8, (sessie.maxGewicht / chartMax) * 130) : 8
                        const x = i * 72 + 8
                        const y = 140 - barH
                        return (
                          <g key={sessie.datum}>
                            <rect x={x} y={y} width={56} height={barH} rx={6} fill="#1D9E75" opacity={0.85} />
                            <text x={x + 28} y={y - 5} textAnchor="middle" fontSize={11} fill="#374151" fontWeight="600">
                              {sessie.maxGewicht}kg
                            </text>
                            <text x={x + 28} y={158} textAnchor="middle" fontSize={9} fill="#9ca3af">
                              {sessie.datum.slice(5)}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  )}
                </div>

                <div style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Recente sets</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                          {['Datum', 'Set', 'Reps', 'Gewicht', 'Volume'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recenteLogs.map((log, i) => {
                          const volume = log.herhalingen * (log.gewicht_kg ?? 0)
                          return (
                            <tr key={log.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{log.training_logs.datum}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{log.set_nummer}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{log.herhalingen}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{log.gewicht_kg ?? '—'} kg</td>
                              <td style={{ padding: '10px 12px', color: '#1D9E75', fontWeight: 600 }}>{volume > 0 ? `${volume} kg` : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
