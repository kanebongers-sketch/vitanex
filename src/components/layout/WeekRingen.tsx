'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Kleur per weekdag: Ma Di Wo Do Vr Za Zo
const DAG_KLEUREN = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316']
const DAG_NAMEN   = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const TOTAAL = 6

function dagNL(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000)
  return d.toLocaleDateString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).split('-').reverse().join('-')
}

function tsNaarNlDatum(ts: string): string {
  return new Date(ts).toLocaleDateString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).split('-').reverse().join('-')
}

function weekdagIndex(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  return (d.getDay() + 6) % 7 // Ma=0 … Zo=6
}

interface DagScore { datum: string; gedaan: number }

export default function WeekRingen({ size = 22 }: { size?: number }) {
  const [scores, setScores] = useState<DagScore[]>([])

  useEffect(() => {
    let mounted = true

    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const vandaag  = dagNL(0)
      const zesDagen = dagNL(6)

      // Bereken 7-dag-start UTC voor timestamp-kolommen
      const dagstartUtc = (datum: string) =>
        new Date(`${datum}T00:00:00+01:00`).toISOString()
      const zesdagenStartUtc = dagstartUtc(zesDagen)

      const [waterRes, stemmingRes, slaapRes, sportRes, dankRes, meditRes] = await Promise.all([
        supabase.from('water_logs')
          .select('datum').eq('user_id', user.id)
          .gte('datum', zesDagen).lte('datum', vandaag),
        supabase.from('stemming_logs')
          .select('aangemaakt_op').eq('user_id', user.id)
          .gte('aangemaakt_op', zesdagenStartUtc),
        supabase.from('slaap_logs')
          .select('datum').eq('user_id', user.id)
          .gte('datum', zesDagen).lte('datum', vandaag),
        supabase.from('sport_logs')
          .select('aangemaakt_op').eq('user_id', user.id)
          .gte('aangemaakt_op', zesdagenStartUtc),
        supabase.from('dankbaarheid_logs')
          .select('datum').eq('user_id', user.id)
          .gte('datum', zesDagen).lte('datum', vandaag),
        supabase.from('ademhaling_sessies')
          .select('aangemaakt_op, duur_seconden').eq('user_id', user.id)
          .gte('aangemaakt_op', zesdagenStartUtc),
      ])

      if (!mounted) return

      // Sla per datum bij welke activiteiten gedaan zijn
      const dagMap: Record<string, Set<string>> = {}
      const init = () => new Set<string>()

      for (let i = 0; i < 7; i++) {
        dagMap[dagNL(6 - i)] = init()
      }

      // Water (datum-kolom)
      for (const r of waterRes.data ?? []) {
        dagMap[r.datum]?.add('water')
      }
      // Stemming (timestamp-kolom)
      for (const r of stemmingRes.data ?? []) {
        const d = tsNaarNlDatum(r.aangemaakt_op)
        dagMap[d]?.add('stemming')
      }
      // Slaap (datum-kolom)
      for (const r of slaapRes.data ?? []) {
        dagMap[r.datum]?.add('slaap')
      }
      // Sport (timestamp-kolom)
      for (const r of sportRes.data ?? []) {
        const d = tsNaarNlDatum(r.aangemaakt_op)
        dagMap[d]?.add('sport')
      }
      // Dankbaarheid (datum-kolom)
      for (const r of dankRes.data ?? []) {
        dagMap[r.datum]?.add('dankbaarheid')
      }
      // Meditatie/ademhaling — >=60s telt
      const meditPerDag: Record<string, number> = {}
      for (const r of meditRes.data ?? []) {
        const d = tsNaarNlDatum(r.aangemaakt_op)
        meditPerDag[d] = (meditPerDag[d] ?? 0) + (r.duur_seconden ?? 0)
      }
      for (const [d, sec] of Object.entries(meditPerDag)) {
        if (sec >= 60) dagMap[d]?.add('meditatie')
      }

      const result: DagScore[] = Object.entries(dagMap).map(([datum, gedaan]) => ({
        datum,
        gedaan: gedaan.size,
      }))

      // Sorteer chronologisch (oudste eerst = links)
      result.sort((a, b) => a.datum.localeCompare(b.datum))
      if (mounted) setScores(result)
    }

    laad()
    return () => { mounted = false }
  }, [])

  const r = size / 2 - 2.5
  const circ = 2 * Math.PI * r
  const vandaag = dagNL(0)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {scores.map((dag) => {
        const wIdx  = weekdagIndex(dag.datum)
        const kleur = DAG_KLEUREN[wIdx]
        const naam  = DAG_NAMEN[wIdx]
        const isVandaag = dag.datum === vandaag
        const pct   = dag.gedaan / TOTAAL
        const vol   = dag.gedaan === TOTAAL
        const leeg  = dag.gedaan === 0

        return (
          <div
            key={dag.datum}
            title={`${naam} — ${dag.gedaan}/${TOTAAL}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
          >
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ display: 'block' }}
            >
              {/* Achtergrondcirkel */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill={vol ? kleur : 'none'}
                stroke={kleur}
                strokeWidth={leeg ? 1.5 : 2}
                opacity={leeg ? 0.2 : vol ? 1 : 0.15}
              />
              {/* Progress arc */}
              {!vol && !leeg && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={kleur}
                  strokeWidth={2}
                  strokeDasharray={`${pct * circ} ${circ}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              )}
              {/* Getal in het midden (alleen bij niet-vol en niet-leeg) */}
              {!vol && !leeg && (
                <text
                  x={size / 2}
                  y={size / 2 + 3.5}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight="700"
                  fill={kleur}
                >
                  {dag.gedaan}
                </text>
              )}
              {/* Vinkje als alles gedaan */}
              {vol && (
                <polyline
                  points={`${size * 0.28},${size * 0.52} ${size * 0.44},${size * 0.66} ${size * 0.72},${size * 0.36}`}
                  fill="none"
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            {/* Dagletters onder de cirkel */}
            <span style={{
              fontSize: 7,
              fontWeight: isVandaag ? 700 : 500,
              color: isVandaag ? kleur : 'var(--text-4)',
              letterSpacing: 0,
              lineHeight: 1,
            }}>
              {naam}
            </span>
          </div>
        )
      })}
    </div>
  )
}
