import { mooiMaximum, heel } from '@/lib/club/cijfers/opmaak'
import { Plot, XAs, yVan } from './Plot'

// Staafgrafiek. De staven schalen mee met de breedte binnen een vast tekenvlak;
// de labels staan in gewone HTML eronder. Merkkleur = de reeks; een "zachte"
// staaf (de lopende week) is half doorzichtig. Onder de grafiek een tabel voor schermlezers.

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

export function Kolommen({ id, titel, beschrijving, kolommen, eenheid, labelElke = 1 }: Props) {
  const max = mooiMaximum(Math.max(0, ...kolommen.map((k) => k.waarde)))
  const n = Math.max(kolommen.length, 1)
  const breed = 100 / n
  const gat = Math.min(breed * 0.3, 2.4)
  const nul = yVan(0)
  const streepjes = [0, 0.5, 1].map((f) => ({ label: heel(max * f), fractie: f }))
  return (
    <figure className="club-cijfers-figuur">
      <Plot id={id} titel={titel} beschrijving={beschrijving} streepjes={streepjes}>
        {kolommen.map((k, i) => {
          const top = yVan(k.waarde / max)
          return (
            <rect key={k.naam} x={i * breed + gat / 2} width={breed - gat} y={top} height={Math.max(0, nul - top)} className={k.zacht ? 'club-cijfers-staaf club-cijfers-staaf--zacht' : 'club-cijfers-staaf'}>
              <title>{`${k.naam}: ${heel(k.waarde)} ${eenheid}`}</title>
            </rect>
          )
        })}
      </Plot>
      <XAs labels={kolommen.map((k) => k.label)} sleutels={kolommen.map((k) => k.naam)} labelElke={labelElke} />
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
