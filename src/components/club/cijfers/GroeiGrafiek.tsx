import { heel, metTeken, mooieAs, mooiMaximum } from '@/lib/club/cijfers/opmaak'
import { Plot, XAs, yVan } from './Plot'

// Twee grafieken met elk een eigen schaal, onder elkaar op dezelfde weken:
// boven het ledenbestand als lijn (as rond de echte waarden, niet vanaf nul),
// onder instroom (groen, omhoog) en uitstroom (koraal, omlaag) als staven rond nul.

interface Props {
  labels: string[]
  namen: string[]
  bestand: number[]
  instroom: number[]
  uitstroom: number[]
  labelElke: number
}

function xMidden(i: number, n: number): number {
  return ((i + 0.5) / n) * 100
}

function Bestand({ namen, bestand }: Pick<Props, 'namen' | 'bestand'>) {
  const n = Math.max(bestand.length, 1)
  const as = mooieAs(Math.min(...bestand), Math.max(...bestand))
  const f = (w: number) => (w - as.min) / Math.max(as.max - as.min, 1)
  const punten = bestand.map((w, i) => `${xMidden(i, n).toFixed(2)},${yVan(f(w)).toFixed(2)}`)
  const lijn = punten.length === 1 ? `M0,${yVan(f(bestand[0])).toFixed(2)} L100,${yVan(f(bestand[0])).toFixed(2)}` : `M${punten.join(' L')}`
  const vlak = punten.length > 1 ? `${lijn} L${xMidden(n - 1, n).toFixed(2)},${yVan(0)} L${xMidden(0, n).toFixed(2)},${yVan(0)} Z` : null
  return (
    <Plot
      id="groei-bestand"
      titel="Ledenbestand per week"
      beschrijving={`Van ${heel(bestand[0] ?? 0)} naar ${heel(bestand.at(-1) ?? 0)} leden over ${n} weken.`}
      streepjes={as.streepjes.map((w) => ({ label: heel(w), fractie: f(w) }))}
    >
      {vlak && <path d={vlak} className="club-cijfers-vlak" />}
      <path d={lijn} className="club-cijfers-lijn" vectorEffect="non-scaling-stroke" />
      {bestand.map((w, i) => (
        <rect key={namen[i]} x={(i / n) * 100} width={100 / n} y={0} height={100} className="club-cijfers-raak">
          <title>{`${namen[i]}: ${heel(w)} leden`}</title>
        </rect>
      ))}
    </Plot>
  )
}

function Stroom({ namen, instroom, uitstroom }: Pick<Props, 'namen' | 'instroom' | 'uitstroom'>) {
  const n = Math.max(instroom.length, 1)
  const max = mooiMaximum(Math.max(1, ...instroom, ...uitstroom))
  const breed = 100 / n
  const gat = Math.min(breed * 0.3, 2.4)
  const nul = yVan(0.5)
  return (
    <Plot
      id="groei-stroom"
      titel="Instroom en uitstroom per week"
      beschrijving={`${heel(instroom.reduce((s, w) => s + w, 0))} nieuwe leden en ${heel(uitstroom.reduce((s, w) => s + w, 0))} vertrokken leden over ${n} weken.`}
      streepjes={[
        { label: `+${heel(max)}`, fractie: 1 },
        { label: '0', fractie: 0.5 },
        { label: `−${heel(max)}`, fractie: 0 },
      ]}
      laag
    >
      {instroom.map((w, i) => {
        const top = yVan(0.5 + (w / max) * 0.5)
        return (
          <rect key={`in-${namen[i]}`} x={i * breed + gat / 2} width={breed - gat} y={top} height={nul - top} className="club-cijfers-staaf--in">
            <title>{`${namen[i]}: ${heel(w)} nieuw`}</title>
          </rect>
        )
      })}
      {uitstroom.map((w, i) => (
        <rect key={`uit-${namen[i]}`} x={i * breed + gat / 2} width={breed - gat} y={nul} height={yVan(0.5 - (w / max) * 0.5) - nul} className="club-cijfers-staaf--uit">
          <title>{`${namen[i]}: ${heel(w)} vertrokken`}</title>
        </rect>
      ))}
    </Plot>
  )
}

export function GroeiGrafiek({ labels, namen, bestand, instroom, uitstroom, labelElke }: Props) {
  if (bestand.length === 0) return <p className="club-leeg">Nog geen weken om te tonen.</p>
  const netto = instroom.reduce((s, w) => s + w, 0) - uitstroom.reduce((s, w) => s + w, 0)
  return (
    <figure className="club-cijfers-figuur club-cijfers-groei">
      <div className="club-cijfers-deel">
        <p className="club-cijfers-deelkop">
          Ledenbestand <span>aan het eind van elke week</span>
        </p>
        <Bestand namen={namen} bestand={bestand} />
      </div>
      <div className="club-cijfers-deel">
        <p className="club-cijfers-deelkop">
          Instroom en uitstroom <span>netto {metTeken(netto)}</span>
        </p>
        <Stroom namen={namen} instroom={instroom} uitstroom={uitstroom} />
        <XAs labels={labels} sleutels={namen} labelElke={labelElke} />
      </div>
      <figcaption className="club-cijfers-legenda">
        <span data-reeks="lijn">Ledenbestand</span>
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
