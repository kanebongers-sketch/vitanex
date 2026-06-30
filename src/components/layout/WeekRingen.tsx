'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ACTIVITEITEN } from '@/lib/activiteiten'
import type { ActiviteitKey as AKey } from '@/lib/activiteiten'

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

      // allSettled + juiste schrijf-tabellen, zodat één missende tabel niet de
      // hele week leeg laat (bewegen = training_logs; meditatie = focus_timer_logs
      // type 'adem'; ademhaling = focus_sessies).
      const settled = await Promise.allSettled([
        // 0 water
        supabase.from('water_logs').select('datum, ml').eq('user_id', user.id).gte('datum', zesDagen).lte('datum', vandaag),
        // 1 stemming
        supabase.from('stemming_logs').select('aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', dagstartUtc),
        // 2 slaap
        supabase.from('slaap_logs').select('datum').eq('user_id', user.id).gte('datum', zesDagen).lte('datum', vandaag),
        // 3 bewegen (training_logs, datum)
        supabase.from('training_logs').select('datum').eq('user_id', user.id).gte('datum', zesDagen).lte('datum', vandaag),
        // 4 dankbaarheid
        supabase.from('dankbaarheid_logs').select('datum').eq('user_id', user.id).gte('datum', zesDagen).lte('datum', vandaag),
        // 5 meditatie (focus_timer_logs, type 'adem')
        supabase.from('focus_timer_logs').select('datum, duur_minuten').eq('user_id', user.id).eq('type', 'adem').gte('datum', zesDagen).lte('datum', vandaag),
        // 6 ademhaling (focus_sessies)
        supabase.from('focus_sessies').select('aangemaakt_op, duur_minuten').eq('user_id', user.id).gte('aangemaakt_op', dagstartUtc),
      ])

      if (!mounted) return

      const rows = (i: number): Array<Record<string, unknown>> => {
        const res = settled[i]
        if (res.status !== 'fulfilled') return []
        const v = res.value as { data?: unknown[] | null }
        return (v?.data as Array<Record<string, unknown>> | null) ?? []
      }

      // Bouw dagMap: datum → Set<AKey>
      const dagMap = new Map<string, Set<AKey>>()
      for (let i = 6; i >= 0; i--) dagMap.set(dagNL(i), new Set())

      // Water — per dag ml optellen, ≥1000ml = gedaan
      const waterPerDag: Record<string, number> = {}
      for (const r of rows(0)) {
        const d = String(r.datum)
        waterPerDag[d] = (waterPerDag[d] ?? 0) + (Number(r.ml) || 0)
      }
      for (const [d, ml] of Object.entries(waterPerDag)) {
        if (ml >= 1000) dagMap.get(d)?.add('water')
      }

      // Stemming
      for (const r of rows(1)) {
        dagMap.get(tsNaarNlDatum(String(r.aangemaakt_op)))?.add('mentaal')
      }

      // Slaap
      for (const r of rows(2)) {
        dagMap.get(String(r.datum))?.add('rust')
      }

      // Bewegen (training_logs.datum)
      for (const r of rows(3)) {
        dagMap.get(String(r.datum))?.add('fysiek')
      }

      // Dankbaarheid
      for (const r of rows(4)) {
        dagMap.get(String(r.datum))?.add('dankbaarheid')
      }

      // Meditatie / ademhaling — ≥1 min per dag
      const meditPerDag: Record<string, number> = {}
      for (const r of rows(5)) {
        const d = String(r.datum)
        meditPerDag[d] = (meditPerDag[d] ?? 0) + (Number(r.duur_minuten) || 0)
      }
      for (const r of rows(6)) {
        const d = tsNaarNlDatum(String(r.aangemaakt_op))
        meditPerDag[d] = (meditPerDag[d] ?? 0) + (Number(r.duur_minuten) || 0)
      }
      for (const [d, min] of Object.entries(meditPerDag)) {
        if (min >= 1) dagMap.get(d)?.add('meditatie')
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
