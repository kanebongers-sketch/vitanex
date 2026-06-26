'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ── Activiteiten (vaste volgorde = segmenten in de taart) ──────────────────
const ACTIVITEITEN = [
  { key: 'mentaal',      kleur: '#8B5CF6' }, // violet   — stemming
  { key: 'fysiek',       kleur: '#10B981' }, // groen    — sport
  { key: 'water',        kleur: '#06B6D4' }, // cyaan    — water
  { key: 'rust',         kleur: '#6366F1' }, // indigo   — slaap
  { key: 'meditatie',    kleur: '#F59E0B' }, // amber    — ademhaling
  { key: 'dankbaarheid', kleur: '#F97316' }, // oranje   — dankbaarheid
] as const

type AKey = typeof ACTIVITEITEN[number]['key']

// ── Helpers ────────────────────────────────────────────────────────────────

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

// weekdag: ma=0 … zo=6
function weekdagNaam(dateStr: string): string {
  const dag = (new Date(dateStr + 'T12:00:00').getDay() + 6) % 7
  return ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'][dag]
}

// ── SVG pie-segment pad ────────────────────────────────────────────────────
// Segmenten starten bovenaan (−90°), draaien met de klok mee.
// Kleine gap (3°) tussen segmenten voor leesbaarheid.
const GAP = 3  // graden gap
const N   = ACTIVITEITEN.length
const STAP = 360 / N

function segmentPad(
  i: number,
  cx: number, cy: number,
  R: number, r: number,   // outer / inner radius
): string {
  const start = i * STAP + GAP / 2 - 90
  const einde = (i + 1) * STAP - GAP / 2 - 90
  const rad   = (deg: number) => (deg * Math.PI) / 180
  const cos   = Math.cos, sin = Math.sin

  const x1 = cx + R * cos(rad(start)), y1 = cy + R * sin(rad(start))
  const x2 = cx + R * cos(rad(einde)), y2 = cy + R * sin(rad(einde))
  const x3 = cx + r * cos(rad(einde)), y3 = cy + r * sin(rad(einde))
  const x4 = cx + r * cos(rad(start)), y4 = cy + r * sin(rad(start))

  const large = STAP - GAP > 180 ? 1 : 0

  return [
    `M ${x1} ${y1}`,
    `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${r} ${r} 0 ${large} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ')
}

// ── Types ──────────────────────────────────────────────────────────────────
type DagData = {
  datum: string
  gedaan: Set<AKey>
}

// ── Component ──────────────────────────────────────────────────────────────
export default function WeekRingen({ size = 26 }: { size?: number }) {
  const [dagen, setDagen] = useState<DagData[]>([])

  useEffect(() => {
    let mounted = true

    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const vandaag  = dagNL(0)
      const zesDagen = dagNL(6)
      const dagstartUtc = new Date(`${zesDagen}T00:00:00+01:00`).toISOString()

      const [waterRes, stemmingRes, slaapRes, sportRes, dankRes, meditRes] = await Promise.all([
        supabase.from('water_logs')
          .select('datum, ml').eq('user_id', user.id)
          .gte('datum', zesDagen).lte('datum', vandaag),
        supabase.from('stemming_logs')
          .select('aangemaakt_op').eq('user_id', user.id)
          .gte('aangemaakt_op', dagstartUtc),
        supabase.from('slaap_logs')
          .select('datum').eq('user_id', user.id)
          .gte('datum', zesDagen).lte('datum', vandaag),
        supabase.from('sport_logs')
          .select('aangemaakt_op').eq('user_id', user.id)
          .gte('aangemaakt_op', dagstartUtc),
        supabase.from('dankbaarheid_logs')
          .select('datum').eq('user_id', user.id)
          .gte('datum', zesDagen).lte('datum', vandaag),
        supabase.from('ademhaling_sessies')
          .select('aangemaakt_op, duur_seconden').eq('user_id', user.id)
          .gte('aangemaakt_op', dagstartUtc),
      ])

      if (!mounted) return

      // Bouw dagMap: datum → Set<AKey>
      const dagMap = new Map<string, Set<AKey>>()
      for (let i = 6; i >= 0; i--) dagMap.set(dagNL(i), new Set())

      // Water — per dag ml optellen, ≥1000ml = gedaan
      const waterPerDag: Record<string, number> = {}
      for (const r of waterRes.data ?? []) {
        waterPerDag[r.datum] = (waterPerDag[r.datum] ?? 0) + (r.ml ?? 0)
      }
      for (const [d, ml] of Object.entries(waterPerDag)) {
        if (ml >= 1000) dagMap.get(d)?.add('water')
      }

      // Stemming
      for (const r of stemmingRes.data ?? []) {
        dagMap.get(tsNaarNlDatum(r.aangemaakt_op))?.add('mentaal')
      }

      // Slaap
      for (const r of slaapRes.data ?? []) {
        dagMap.get(r.datum)?.add('rust')
      }

      // Sport
      for (const r of sportRes.data ?? []) {
        dagMap.get(tsNaarNlDatum(r.aangemaakt_op))?.add('fysiek')
      }

      // Dankbaarheid
      for (const r of dankRes.data ?? []) {
        dagMap.get(r.datum)?.add('dankbaarheid')
      }

      // Meditatie — ≥60s per dag
      const meditPerDag: Record<string, number> = {}
      for (const r of meditRes.data ?? []) {
        const d = tsNaarNlDatum(r.aangemaakt_op)
        meditPerDag[d] = (meditPerDag[d] ?? 0) + (r.duur_seconden ?? 0)
      }
      for (const [d, sec] of Object.entries(meditPerDag)) {
        if (sec >= 60) dagMap.get(d)?.add('meditatie')
      }

      const result: DagData[] = Array.from(dagMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([datum, gedaan]) => ({ datum, gedaan }))

      if (mounted) setDagen(result)
    }

    laad()
    return () => { mounted = false }
  }, [])

  const cx = size / 2, cy = size / 2
  const R  = size / 2 - 2      // outer radius
  const r  = Math.max(2, size * 0.14) // inner donut hole
  const vandaag  = dagNL(0)
  const labelSz  = Math.max(7, size * 0.26)
  const gap      = Math.max(4, size * 0.16)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap }}>
      {dagen.map(({ datum, gedaan }) => {
        const isVandaag = datum === vandaag
        const daglabel  = weekdagNaam(datum)
        return (
          <div key={datum} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ display: 'block' }}
            >
              {ACTIVITEITEN.map(({ key, kleur }, i) => {
                const vol = gedaan.has(key)
                return (
                  <path
                    key={key}
                    d={segmentPad(i, cx, cy, R, r)}
                    fill={kleur}
                    opacity={vol ? 1 : 0.13}
                  />
                )
              })}
              {/* Vandaag: witte ring */}
              {isVandaag && (
                <circle
                  cx={cx} cy={cy} r={R + 1.5}
                  fill="none"
                  stroke="var(--mf-green)"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
              )}
            </svg>
            <span style={{
              fontSize: labelSz,
              fontWeight: isVandaag ? 800 : 500,
              color: isVandaag ? 'var(--mf-green)' : 'var(--text-4)',
              lineHeight: 1,
            }}>
              {daglabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}
