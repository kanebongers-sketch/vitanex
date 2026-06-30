'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Chart, type ChartDatum } from '@/components/ui/Chart'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'


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

export default function VoortgangPage() {
  const router = useRouter()
  const selectId = useId()
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


  const actieveGroep = oefeningen.find(o => o.naam === geselecteerdeOefening)
  const totaalTrainingen = new Set(logs.map(l => l.training_logs.datum)).size
  const totaalSets = logs.length
  const besteOefening = [...oefeningen].sort((a, b) => b.progressieProcent - a.progressieProcent)[0]

  const recenteLogs = actieveGroep
    ? [...actieveGroep.logs].sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op)).slice(0, 10)
    : []

  const chartSessies = actieveGroep ? actieveGroep.sessies.slice(-8) : []
  const chartData: ChartDatum[] = chartSessies.map(s => ({
    datum: s.datum.slice(5),
    'Max. gewicht': s.maxGewicht,
  }))

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <p style={{ color: 'var(--text-3)', marginTop: 80 }}>Laden…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: 48 }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px 0' }}>

        <header style={{ marginBottom: 24 }}>
          <Link href="/sport" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--mentaforce-primary)', fontSize: 14, textDecoration: 'none' }}>
            <ArrowLeft size={15} aria-hidden /> Terug naar sport
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            Mijn voortgang
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 15 }}>Volg je gewichtsprogressie per oefening</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Trainingen', waarde: totaalTrainingen, kleur: 'var(--mf-blue)' },
            { label: 'Sets gelogd', waarde: totaalSets, kleur: 'var(--mentaforce-primary)' },
            { label: 'Beste oefening', waarde: besteOefening ? `+${besteOefening.progressieProcent}%` : '—', kleur: 'var(--mf-orange)', sub: besteOefening?.naam },
          ].map((stat, i) => (
            <Card key={i} style={{ padding: '20px 16px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{stat.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: stat.kleur, letterSpacing: '-0.02em' }}>{stat.waarde}</p>
              {stat.sub && <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.sub}</p>}
            </Card>
          ))}
        </div>

        {oefeningen.length === 0 ? (
          <Card>
            <EmptyState
              icon={BarChart2}
              title="Nog geen logs gevonden"
              description="Log je eerste training om je voortgang te zien."
            />
          </Card>
        ) : (
          <>
            <Card style={{ padding: '16px 20px', marginBottom: 24 }}>
              <label htmlFor={selectId} style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Selecteer oefening</label>
              <select
                id={selectId}
                value={geselecteerdeOefening}
                onChange={e => setGeselecteerdeOefening(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: 15, color: 'var(--text-1)', background: 'var(--bg-subtle)', outline: 'none' }}
              >
                {oefeningen.map(o => (
                  <option key={o.naam} value={o.naam}>{o.naam}</option>
                ))}
              </select>
            </Card>

            {actieveGroep && (
              <>
                <Card style={{ padding: '20px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{actieveGroep.naam}</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Badge variant="success">Start: {actieveGroep.beginGewicht} kg</Badge>
                      <Badge variant="accent">Nu: {actieveGroep.huidigGewicht} kg</Badge>
                      <Badge variant={actieveGroep.progressieProcent >= 0 ? 'success' : 'danger'}>
                        {actieveGroep.progressieProcent >= 0 ? '+' : ''}{actieveGroep.progressieProcent}%
                      </Badge>
                    </div>
                  </div>

                  {chartData.length < 2 ? (
                    <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Log meer sessies om een grafiek te zien.</p>
                  ) : (
                    <Chart
                      type="bar"
                      data={chartData}
                      xKey="datum"
                      series={[{ key: 'Max. gewicht', label: 'Max. gewicht (kg)' }]}
                      summary={`Gewichtsprogressie voor ${actieveGroep.naam}: maximaal gewicht per sessie in kilogram over de laatste ${chartData.length} sessies.`}
                      height={180}
                    />
                  )}
                </Card>

                <Card style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Recente sets</h2>
                  <Table caption={`Recente sets voor ${actieveGroep.naam}`}>
                    <THead>
                      <Tr>
                        <Th scope="col">Datum</Th>
                        <Th scope="col">Set</Th>
                        <Th scope="col">Reps</Th>
                        <Th scope="col">Gewicht</Th>
                        <Th scope="col" align="right">Volume</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {recenteLogs.map((log) => {
                        const volume = log.herhalingen * (log.gewicht_kg ?? 0)
                        return (
                          <Tr key={log.id}>
                            <Td>{log.training_logs.datum}</Td>
                            <Td>{log.set_nummer}</Td>
                            <Td>{log.herhalingen}</Td>
                            <Td>{log.gewicht_kg ?? '—'} kg</Td>
                            <Td align="right" style={{ color: 'var(--mentaforce-primary)', fontWeight: 600 }}>{volume > 0 ? `${volume} kg` : '—'}</Td>
                          </Tr>
                        )
                      })}
                    </TBody>
                  </Table>
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
