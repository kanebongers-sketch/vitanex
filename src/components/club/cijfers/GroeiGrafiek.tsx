import { heel, mooiMaximum } from '@/lib/club/cijfers/opmaak'

// Ledenbestand als amber lijn, met daaronder instroom (lichtgrijs, omhoog) en
// uitstroom (donkergrijs, omlaag) per week. Twee SVG's die dezelfde x-as delen.

interface Props {
  labels: string[]
  namen: string[]
  bestand: number[]
  instroom: number[]
  uitstroom: number[]
  labelElke: number
}

const H = 100

function lijnPad(waarden: number[], min: number, max: number): string {
  const n = waarden.length
  const bereik = Math.max(max - min, 1)
  return waarden
    .map((w, i) => {
      const x = n === 1 ? 50 : ((i + 0.5) / n) * 100
      const y = H - ((w - min) / bereik) * H
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

export function GroeiGrafiek({ labels, namen, bestand, instroom, uitstroom, labelElke }: Props) {
  const laag = Math.min(...bestand)
  const hoog = Math.max(...bestand)
  const marge = Math.max(2, Math.ceil((hoog - laag) * 0.25))
  const min = Math.max(0, laag - marge)
  const max = hoog + marge
  const stroomMax = mooiMaximum(Math.max(1, ...instroom, ...uitstroom))
  const n = Math.max(bestand.length, 1)
  const breed = 100 / n
  const pad = lijnPad(bestand, min, max)
  return (
    <figure className="club-cijfers-figuur">
      <div className="club-cijfers-plot">
        <div className="club-cijfers-yas" aria-hidden>
          <span>{heel(max)}</span>
          <span>{heel((max + min) / 2)}</span>
          <span>{heel(min)}</span>
        </div>
        <svg className="club-cijfers-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" role="img" aria-labelledby="groei-t groei-d">
          <title id="groei-t">Ledenbestand per week</title>
          <desc id="groei-d">{`Van ${heel(bestand[0] ?? 0)} naar ${heel(bestand.at(-1) ?? 0)} leden over ${n} weken.`}</desc>
          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={0} x2={100} y1={H * f} y2={H * f} className="club-cijfers-raster" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={`${pad} L${(((n - 0.5) / n) * 100).toFixed(2)},${H} L${((0.5 / n) * 100).toFixed(2)},${H} Z`} className="club-cijfers-vlak" />
          <path d={pad} className="club-cijfers-lijn" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="club-cijfers-plot club-cijfers-plot--stroom">
        <div className="club-cijfers-yas" aria-hidden>
          <span>+{heel(stroomMax)}</span>
          <span>0</span>
          <span>{'−'}{heel(stroomMax)}</span>
        </div>
        <svg className="club-cijfers-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
          <line x1={0} x2={100} y1={H / 2} y2={H / 2} className="club-cijfers-raster" vectorEffect="non-scaling-stroke" />
          {instroom.map((w, i) => {
            const h = (w / stroomMax) * (H / 2)
            return <rect key={`in-${namen[i]}`} x={i * breed + breed * 0.18} width={breed * 0.64} y={H / 2 - h} height={h} className="club-cijfers-staaf--in" />
          })}
          {uitstroom.map((w, i) => {
            const h = (w / stroomMax) * (H / 2)
            return <rect key={`uit-${namen[i]}`} x={i * breed + breed * 0.18} width={breed * 0.64} y={H / 2} height={h} className="club-cijfers-staaf--uit" />
          })}
        </svg>
      </div>
      <div className="club-cijfers-xas" aria-hidden style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {labels.map((l, i) => (
          <span key={namen[i]}>{i % labelElke === 0 || i === n - 1 ? l : ''}</span>
        ))}
      </div>
      <figcaption className="club-cijfers-legenda">
        <span data-reeks="hoofd">Ledenbestand</span>
        <span data-reeks="in">Instroom</span>
        <span data-reeks="uit">Uitstroom</span>
      </figcaption>
      <table className="club-sr">
        <caption>Ledenbestand, instroom en uitstroom per week</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Ledenbestand</th>
            <th scope="col">Instroom</th>
            <th scope="col">Uitstroom</th>
          </tr>
        </thead>
        <tbody>
          {namen.map((naam, i) => (
            <tr key={naam}>
              <th scope="row">{naam}</th>
              <td>{bestand[i]}</td>
              <td>{instroom[i]}</td>
              <td>{uitstroom[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
