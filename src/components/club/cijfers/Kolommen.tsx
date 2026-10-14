import { mooiMaximum, heel } from '@/lib/club/cijfers/opmaak'

// Staafgrafiek in SVG. De staven schalen mee met de breedte; de labels staan
// in gewone HTML eronder, zodat ze op elke schermbreedte leesbaar blijven.
// Amber = de reeks; een "zachte" staaf (bv. de lopende week) is half doorzichtig.

export interface Kolom {
  label: string
  /** Langere naam voor de tabel en de tooltip (bv. "week van 12 okt"). */
  naam: string
  waarde: number
  zacht?: boolean
}

interface Props {
  id: string
  titel: string
  beschrijving: string
  kolommen: Kolom[]
  eenheid: string
  /** Toon elk n-de label (bij veel weken). */
  labelElke?: number
}

const H = 100

export function Kolommen({ id, titel, beschrijving, kolommen, eenheid, labelElke = 1 }: Props) {
  const max = mooiMaximum(Math.max(0, ...kolommen.map((k) => k.waarde)))
  const n = Math.max(kolommen.length, 1)
  const breed = 100 / n
  const gat = Math.min(breed * 0.28, 2.4)
  return (
    <figure className="club-cijfers-figuur">
      <div className="club-cijfers-plot">
        <div className="club-cijfers-yas" aria-hidden>
          <span>{heel(max)}</span>
          <span>{heel(max / 2)}</span>
          <span>0</span>
        </div>
        <svg className="club-cijfers-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" role="img" aria-labelledby={`${id}-t ${id}-d`}>
          <title id={`${id}-t`}>{titel}</title>
          <desc id={`${id}-d`}>{beschrijving}</desc>
          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={0} x2={100} y1={H * f} y2={H * f} className="club-cijfers-raster" vectorEffect="non-scaling-stroke" />
          ))}
          {kolommen.map((k, i) => {
            const h = (k.waarde / max) * H
            return (
              <rect key={k.naam} x={i * breed + gat / 2} width={breed - gat} y={H - h} height={h} className={k.zacht ? 'club-cijfers-staaf club-cijfers-staaf--zacht' : 'club-cijfers-staaf'}>
                <title>{`${k.naam}: ${heel(k.waarde)} ${eenheid}`}</title>
              </rect>
            )
          })}
        </svg>
      </div>
      <div className="club-cijfers-xas" aria-hidden style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {kolommen.map((k, i) => (
          <span key={k.naam}>{i % labelElke === 0 || i === n - 1 ? k.label : ''}</span>
        ))}
      </div>
      <table className="club-sr">
        <caption>{titel}</caption>
        <thead>
          <tr>
            <th scope="col">Periode</th>
            <th scope="col">{eenheid}</th>
          </tr>
        </thead>
        <tbody>
          {kolommen.map((k) => (
            <tr key={k.naam}>
              <th scope="row">{k.naam}</th>
              <td>{k.waarde}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
