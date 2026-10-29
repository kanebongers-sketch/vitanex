import { heel, metTeken, mooieAs, mooiMaximum } from '@/lib/club/cijfers/opmaak'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS, type CijfersTekst } from '@/lib/aiyourgym/taal/woorden/club/cijfers'
import { Plot, XAs, yVan } from './Plot'

// Twee grafieken met elk een eigen schaal, onder elkaar op dezelfde maanden:
// boven het ledenbestand als lijn (as rond de echte waarden, niet vanaf nul),
// onder instroom (groen, omhoog) en uitstroom (koraal, omlaag) als staven rond nul.

interface Props {
  labels: string[]
  namen: string[]
  bestand: number[]
  instroom: number[]
  uitstroom: number[]
  labelElke: number
  /** Per kolom: nog niet compleet (de lopende maand), staat lichter. */
  zacht: boolean[]
  taal: Taal
}

type Groei = CijfersTekst['groei']

function xMidden(i: number, n: number): number {
  return ((i + 0.5) / n) * 100
}

function Bestand({ namen, bestand, taal, t }: Pick<Props, 'namen' | 'bestand' | 'taal'> & { t: Groei }) {
  const n = Math.max(bestand.length, 1)
  const as = mooieAs(Math.min(...bestand), Math.max(...bestand))
  const f = (w: number) => (w - as.min) / Math.max(as.max - as.min, 1)
  const punten = bestand.map((w, i) => `${xMidden(i, n).toFixed(2)},${yVan(f(w)).toFixed(2)}`)
  const lijn = punten.length === 1 ? `M0,${yVan(f(bestand[0])).toFixed(2)} L100,${yVan(f(bestand[0])).toFixed(2)}` : `M${punten.join(' L')}`
  const vlak = punten.length > 1 ? `${lijn} L${xMidden(n - 1, n).toFixed(2)},${yVan(0)} L${xMidden(0, n).toFixed(2)},${yVan(0)} Z` : null
  return (
    <Plot
      id="groei-bestand"
      titel={t.bestandTitel}
      beschrijving={t.bestandUitleg(heel(bestand[0] ?? 0, taal), heel(bestand.at(-1) ?? 0, taal), n)}
      streepjes={as.streepjes.map((w) => ({ label: heel(w, taal), fractie: f(w) }))}
    >
      {vlak && <path d={vlak} className="club-cijfers-vlak" />}
      <path d={lijn} className="club-cijfers-lijn" vectorEffect="non-scaling-stroke" />
      {bestand.map((w, i) => (
        <rect key={namen[i]} x={(i / n) * 100} width={100 / n} y={0} height={100} className="club-cijfers-raak">
          <title>{t.bestandPunt(namen[i], heel(w, taal))}</title>
        </rect>
      ))}
    </Plot>
  )
}

function Stroom({ namen, instroom, uitstroom, zacht, taal, t }: Pick<Props, 'namen' | 'instroom' | 'uitstroom' | 'zacht' | 'taal'> & { t: Groei }) {
  const n = Math.max(instroom.length, 1)
  const max = mooiMaximum(Math.max(1, ...instroom, ...uitstroom))
  const breed = 100 / n
  const gat = Math.min(breed * 0.3, 2.4)
  const nul = yVan(0.5)
  return (
    <Plot
      id="groei-stroom"
      titel={t.stroomTitel}
      beschrijving={t.stroomUitleg(heel(instroom.reduce((s, w) => s + w, 0), taal), heel(uitstroom.reduce((s, w) => s + w, 0), taal), n)}
      streepjes={[
        { label: `+${heel(max, taal)}`, fractie: 1 },
        { label: '0', fractie: 0.5 },
        { label: `−${heel(max, taal)}`, fractie: 0 },
      ]}
      laag
    >
      {instroom.map((w, i) => {
        const top = yVan(0.5 + (w / max) * 0.5)
        return (
          <rect key={`in-${namen[i]}`} x={i * breed + gat / 2} width={breed - gat} y={top} height={nul - top} className={zacht[i] ? 'club-cijfers-staaf--in club-cijfers-staaf--zacht' : 'club-cijfers-staaf--in'}>
            <title>{t.nieuwPunt(namen[i], heel(w, taal))}</title>
          </rect>
        )
      })}
      {uitstroom.map((w, i) => (
        <rect key={`uit-${namen[i]}`} x={i * breed + gat / 2} width={breed - gat} y={nul} height={yVan(0.5 - (w / max) * 0.5) - nul} className={zacht[i] ? 'club-cijfers-staaf--uit club-cijfers-staaf--zacht' : 'club-cijfers-staaf--uit'}>
          <title>{t.wegPunt(namen[i], heel(w, taal))}</title>
        </rect>
      ))}
    </Plot>
  )
}

export function GroeiGrafiek({ labels, namen, bestand, instroom, uitstroom, labelElke, zacht, taal }: Props) {
  const t = CIJFERS[taal].groei
  const maandKop = CIJFERS[taal].algemeen.maand
  if (bestand.length === 0) return <p className="club-leeg">{t.geenMaanden}</p>
  const netto = instroom.reduce((s, w) => s + w, 0) - uitstroom.reduce((s, w) => s + w, 0)
  return (
    <figure className="club-cijfers-figuur club-cijfers-groei">
      <div className="club-cijfers-deel">
        <p className="club-cijfers-deelkop">
          {t.bestandKop} <span>{t.bestandSub}</span>
        </p>
        <Bestand namen={namen} bestand={bestand} taal={taal} t={t} />
      </div>
      <div className="club-cijfers-deel">
        <p className="club-cijfers-deelkop">
          {t.stroomKop} <span>{t.netto(metTeken(netto, taal))}</span>
        </p>
        <Stroom namen={namen} instroom={instroom} uitstroom={uitstroom} zacht={zacht} taal={taal} t={t} />
        <XAs labels={labels} sleutels={namen} labelElke={labelElke} />
      </div>
      <figcaption className="club-cijfers-legenda">
        <span data-reeks="lijn">{t.bestand}</span>
        <span data-reeks="in">{t.instroom}</span>
        <span data-reeks="uit">{t.uitstroom}</span>
      </figcaption>
      <table className="club-sr">
        <caption>{t.tabel}</caption>
        <thead>
          <tr>
            <th scope="col">{maandKop}</th>
            <th scope="col">{t.bestand}</th>
            <th scope="col">{t.instroom}</th>
            <th scope="col">{t.uitstroom}</th>
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
