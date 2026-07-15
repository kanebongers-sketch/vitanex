'use client'

import { useEffect, useState } from 'react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { PIJLER_KEYS, isPijlerKey, pijlerDef, type PijlerKey } from '@/lib/pijlers/pijlers'
import { dagenGeleden, weekdagKort, weekdagLang, type PijlerWeekDag } from '@/lib/pijlers/week'

// ── SVG donut-segment ──────────────────────────────────────────────────────
// Zes segmenten, één per canonieke pijler, startend bovenaan (−90°) met de klok
// mee. De POSITIE identificeert de pijler — er is bewust geen kleurcodering
// (ui.md: strikt navy + cyan; accessibility.md: nooit kleur alleen als drager
// van betekenis). Het tekstuele alternatief hieronder doet het echte werk.
const GAP = 3 // graden ruimte tussen segmenten
const N = PIJLER_KEYS.length
const STAP = 360 / N

function segmentPad(i: number, cx: number, cy: number, R: number, r: number): string {
  const start = i * STAP + GAP / 2 - 90
  const einde = (i + 1) * STAP - GAP / 2 - 90
  const rad = (deg: number) => (deg * Math.PI) / 180
  const cos = Math.cos, sin = Math.sin

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

// ── Tekstueel alternatief ──────────────────────────────────────────────────
// Een donut van 26px is voor een screenreader niets. Komma's i.p.v. em-dash:
// die wordt per screenreader-engine anders (of niet) voorgelezen — zelfde
// afweging als in PijlerKaart.
function dagLabel(dag: PijlerWeekDag): string {
  const dagNaam = weekdagLang(dag.datum)
  const aantal = dag.gelogd.length
  if (aantal === 0) return `${dagNaam}: niets gelogd`

  const namen = dag.gelogd.map((k) => pijlerDef(k)?.label.toLowerCase() ?? k).join(', ')
  const woord = aantal === 1 ? 'pijler' : 'pijlers'
  return `${dagNaam}: ${aantal} van ${N} ${woord} gelogd, ${namen}`
}

// ── Gedeelde week-data ─────────────────────────────────────────────────────
// WeekRingen staat twee keer onvoorwaardelijk in de Navbar (sidebar én mobiele
// topbar) en een derde keer zodra het mobiele menu opent. CSS verbergt er één,
// maar React mount ze allemaal en draait elke useEffect. Zonder deze cache kost
// élke paginanavigatie 2-3× een volledige fetch — puur voor een navbar-widget.
// Eén in-flight belofte + korte TTL maakt daar één fetch van, ook over
// navigaties heen.
const CACHE_TTL_MS = 60_000
let weekCache: { tijd: number; data: PijlerWeekDag[] } | null = null
let weekLopend: Promise<PijlerWeekDag[]> | null = null

function haalWeek(): Promise<PijlerWeekDag[]> {
  if (weekCache && Date.now() - weekCache.tijd < CACHE_TTL_MS) {
    return Promise.resolve(weekCache.data)
  }
  if (weekLopend) return weekLopend
  weekLopend = laadWeek()
    .then((data) => {
      weekCache = { tijd: Date.now(), data }
      return data
    })
    .finally(() => { weekLopend = null })
  return weekLopend
}

async function laadWeek(): Promise<PijlerWeekDag[]> {
  const res = await authFetch('/api/pijlers/week')
  if (!res.ok) throw new Error(`Pijler-week ophalen mislukt (${res.status})`)
  return leesWeek(await res.json())
}

/**
 * Narrowing op de systeemgrens: de API is een externe bron, dus valideren i.p.v.
 * casten. Onbekende pijler-keys vallen eruit — beter geen segment dan een
 * segment op de verkeerde positie.
 */
function leesWeek(json: unknown): PijlerWeekDag[] {
  const dagen: unknown = (json as { dagen?: unknown } | null)?.dagen
  if (!Array.isArray(dagen)) return []

  // `Array.isArray` versmalt `unknown` naar `any[]`; expliciet naar `unknown[]`
  // zodat er geen impliciete `any` de callbacks in lekt.
  return (dagen as unknown[]).flatMap((rij): PijlerWeekDag[] => {
    const { datum, gelogd } = (rij ?? {}) as { datum?: unknown; gelogd?: unknown }
    if (typeof datum !== 'string' || !Array.isArray(gelogd)) return []
    return [{
      datum,
      gelogd: (gelogd as unknown[]).filter(
        (k): k is PijlerKey => typeof k === 'string' && isPijlerKey(k),
      ),
    }]
  })
}

// ── Component ──────────────────────────────────────────────────────────────
export default function WeekRingen({ size = 26 }: { size?: number }) {
  const [dagen, setDagen] = useState<PijlerWeekDag[]>([])

  useEffect(() => {
    let actief = true
    haalWeek()
      .then((d) => { if (actief) setDagen(d) })
      // Geen data → geen ringen. Eerlijker dan een lege week tonen alsof er niets
      // gelogd is, en de navigatie mag hier nooit op blokkeren.
      .catch(() => { if (actief) setDagen([]) })
    return () => { actief = false }
  }, [])

  const cx = size / 2, cy = size / 2
  const R = size / 2 - 2                // buitenradius
  const r = Math.max(2, size * 0.14)    // gat in het midden
  const vandaag = dagenGeleden(0)
  const labelSz = Math.max(7, size * 0.26)
  const gap = Math.max(4, size * 0.16)

  return (
    <ul style={{ display: 'flex', alignItems: 'flex-end', gap, listStyle: 'none', margin: 0, padding: 0 }}>
      {dagen.map((dag) => {
        const isVandaag = dag.datum === vandaag
        return (
          <li key={dag.datum} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={dagLabel(dag)}
              style={{ display: 'block' }}
            >
              {PIJLER_KEYS.map((key, i) => {
                const vol = dag.gelogd.includes(key)
                return (
                  <path
                    key={key}
                    d={segmentPad(i, cx, cy, R, r)}
                    fill={vol ? 'var(--brand)' : 'var(--text-4)'}
                    opacity={vol ? 1 : 0.35}
                  />
                )
              })}
              {isVandaag && (
                <circle
                  cx={cx} cy={cy} r={R + 1.5}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
              )}
            </svg>
            {/* Decoratief: de dagnaam staat al in het aria-label van de ring. */}
            <span
              aria-hidden
              style={{
                fontSize: labelSz,
                fontWeight: isVandaag ? 800 : 500,
                color: isVandaag ? 'var(--brand)' : 'var(--text-4)',
                lineHeight: 1,
              }}
            >
              {weekdagKort(dag.datum)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
