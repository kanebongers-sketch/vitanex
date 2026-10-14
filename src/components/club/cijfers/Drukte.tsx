import { WEEKDAG_KORT, weekdagNaam } from '@/lib/club/cijfers/tijd'
import { heel } from '@/lib/club/cijfers/opmaak'

// Drukte per weekdag en uur als heatmap. Cellen in SVG, labels in HTML.
// Amber met meer dekking = drukker; leeg = geen enkele check-in.

interface Props {
  raster: number[][]
  uren: number[]
  beschrijving: string
}

const CEL = 10

export function Drukte({ raster, uren, beschrijving }: Props) {
  const max = Math.max(1, ...raster.flat())
  const breedte = uren.length * CEL
  return (
    <figure className="club-cijfers-figuur club-cijfers-drukte">
      <div className="club-cijfers-drukte-vlak">
        <div className="club-cijfers-drukte-dagen" aria-hidden>
          {WEEKDAG_KORT.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <svg className="club-cijfers-drukte-svg" viewBox={`0 0 ${breedte} ${7 * CEL}`} preserveAspectRatio="none" role="img" aria-labelledby="drukte-t drukte-d">
          <title id="drukte-t">Drukte per weekdag en uur</title>
          <desc id="drukte-d">{beschrijving}</desc>
          {raster.map((rij, d) =>
            uren.map((uur, i) => {
              const n = rij[uur] ?? 0
              return (
                <rect
                  key={`${d}-${uur}`}
                  x={i * CEL + 0.6}
                  y={d * CEL + 0.6}
                  width={CEL - 1.2}
                  height={CEL - 1.2}
                  rx={1.2}
                  className={n === 0 ? 'club-cijfers-cel club-cijfers-cel--leeg' : 'club-cijfers-cel'}
                  style={n === 0 ? undefined : { opacity: 0.14 + 0.86 * (n / max) }}
                >
                  <title>{`${weekdagNaam(d + 1)} ${uur}:00: ${heel(n)} check-ins`}</title>
                </rect>
              )
            }),
          )}
        </svg>
      </div>
      <div className="club-cijfers-drukte-uren" aria-hidden style={{ gridTemplateColumns: `repeat(${uren.length}, minmax(0, 1fr))` }}>
        {uren.map((u) => (
          <span key={u}>{u % 3 === 0 ? `${u}` : ''}</span>
        ))}
      </div>
      <figcaption className="club-cijfers-schaal">
        <span>Rustig</span>
        <span className="club-cijfers-schaal-balk" aria-hidden />
        <span>Druk</span>
      </figcaption>
      <table className="club-sr">
        <caption>Check-ins per weekdag en uur</caption>
        <thead>
          <tr>
            <th scope="col">Dag</th>
            {uren.map((u) => (
              <th key={u} scope="col">{`${u}:00`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {raster.map((rij, d) => (
            <tr key={WEEKDAG_KORT[d]}>
              <th scope="row">{weekdagNaam(d + 1)}</th>
              {uren.map((u) => (
                <td key={u}>{rij[u] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
