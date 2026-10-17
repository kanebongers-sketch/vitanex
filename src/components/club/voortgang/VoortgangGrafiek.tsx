import { useId } from 'react'
import { paden, schaal } from '@/lib/club/voortgang/grafiek'
import type { ReeksInfo, ReeksPunt } from '@/lib/club/voortgang/tijdlijn'
import { datumKort, getal } from './weergave'

interface VoortgangGrafiekProps {
  reeks: readonly ReeksPunt[]
  info: ReeksInfo
  /** Kleiner vlak voor de ledenapp. */
  compact?: boolean
}

/**
 * Eigen SVG-lijn: de x-as volgt de tijd, ronde hulplijnen, een zacht vlak onder
 * de lijn. Een intake is een ruit, een losse meting een rondje.
 */
export function VoortgangGrafiek({ reeks, info, compact = false }: VoortgangGrafiekProps) {
  const vulId = useId()
  const vlak = compact ? { breedte: 340, hoogte: 150, links: 34, marge: 12 } : { breedte: 640, hoogte: 220, links: 44, marge: 16 }
  const { punten, raster } = schaal(reeks, vlak)
  if (punten.length === 0) return null
  const onder = vlak.hoogte - vlak.marge
  const { lijn, vlak: vulling } = paden(punten, onder)
  const eenheid = info.eenheid ? ` ${info.eenheid}` : ''
  const samenvatting = `${info.label}: ${reeks.map((p) => `${datumKort(p.datum)} ${getal(p.waarde)}${eenheid}`).join(', ')}`

  return (
    <figure className={`club-voortgang-grafiek${compact ? ' club-voortgang-grafiek--compact' : ''}`}>
      <svg viewBox={`0 0 ${vlak.breedte} ${vlak.hoogte + 22}`} role="img" aria-label={samenvatting}>
        <defs>
          <linearGradient id={vulId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" className="club-voortgang-vul-boven" />
            <stop offset="100%" className="club-voortgang-vul-onder" />
          </linearGradient>
        </defs>
        {raster.map((r) => (
          <g key={r.waarde} aria-hidden>
            <line x1={vlak.links} x2={vlak.breedte - vlak.marge} y1={r.y} y2={r.y} className="club-voortgang-raster" />
            <text x={vlak.links - 8} y={r.y} className="club-voortgang-as-tekst" textAnchor="end" dominantBaseline="middle">
              {getal(r.waarde)}
            </text>
          </g>
        ))}
        {punten.length > 1 && <path d={vulling} fill={`url(#${vulId})`} aria-hidden />}
        {punten.length > 1 && <path d={lijn} className="club-voortgang-lijn" aria-hidden />}
        {punten.map((p, i) => {
          const laatste = i === punten.length - 1
          const intake = reeks[i]?.bron === 'intake'
          const r = laatste ? 6 : 4
          return (
            <g key={`${p.datum}-${i}`} className={laatste ? 'club-voortgang-punt club-voortgang-punt--nu' : 'club-voortgang-punt'}>
              {intake ? (
                <rect x={p.x - r} y={p.y - r} width={r * 2} height={r * 2} transform={`rotate(45 ${p.x} ${p.y})`} />
              ) : (
                <circle cx={p.x} cy={p.y} r={r} />
              )}
              <title>{`${datumKort(p.datum)}: ${getal(p.waarde)}${eenheid}${intake ? ' (intake)' : ''}`}</title>
            </g>
          )
        })}
        <text x={punten[0].x} y={vlak.hoogte + 16} className="club-voortgang-as-tekst" textAnchor={punten.length > 1 ? 'start' : 'middle'} aria-hidden>
          {datumKort(punten[0].datum)}
        </text>
        {punten.length > 1 && (
          <text x={punten[punten.length - 1].x} y={vlak.hoogte + 16} className="club-voortgang-as-tekst" textAnchor="end" aria-hidden>
            {datumKort(punten[punten.length - 1].datum)}
          </text>
        )}
      </svg>
    </figure>
  )
}
