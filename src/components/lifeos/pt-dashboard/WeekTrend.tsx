import type { WeekPunt } from '@/lib/lifeos/pt-dashboard/analyse'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'

// Leads per week als staafdiagram (inline SVG, schaalt mee via viewBox). Het
// cyaan deel van een staaf = leads uit die week die nu klant zijn. Puur
// weergave; de cijfers komen uit `weekReeks` (lib/lifeos/pt-dashboard/analyse.ts).
// Voor screenreaders staat dezelfde data in een verborgen tabel.

interface Props {
  weken: readonly WeekPunt[]
  /** Uniek per pagina: koppelt <title>/<desc> aan de grafiek. */
  id?: string
  kop?: string
}

const B = 280
const H = 168
const BOVEN = 18
const ONDER = 22
const PLOT = H - BOVEN - ONDER

export function WeekTrend({ weken, id = 'ptd-an-week', kop = 'Leads per week' }: Props) {
  const totaal = weken.reduce((n, p) => n + p.leads, 0)
  const klant = weken.reduce((n, p) => n + p.klant, 0)
  const max = Math.max(1, ...weken.map((p) => p.leads))
  const vak = weken.length > 0 ? B / weken.length : B
  const breedte = Math.min(26, vak * 0.56)
  const hoogte = (n: number) => (n / max) * PLOT
  const samenvatting =
    weken.length === 0
      ? 'Geen weken om te tonen.'
      : `${totaal} lead${totaal === 1 ? '' : 's'} in de laatste ${weken.length} weken, waarvan ${klant} nu klant. ` +
        `Deze week: ${weken[weken.length - 1].leads}.`

  return (
    <div className="ptd-an-blok">
      <div className="ptd-an-blokkop">
        <h3>{kop}</h3>
        <span>laatste {weken.length} weken</span>
      </div>
      {totaal === 0 ? (
        <p className="ptd-leeg">Nog geen leads in deze weken. Vul in wie je spreekt, dan zie je hier je ritme per week.</p>
      ) : (
        <>
          <svg className="ptd-an-grafiek" viewBox={`0 0 ${B} ${H}`} role="img" aria-labelledby={`${id}-titel ${id}-uitleg`}>
            <title id={`${id}-titel`}>{kop}</title>
            <desc id={`${id}-uitleg`}>{samenvatting}</desc>
            <line className="ptd-an-as" x1={0} x2={B} y1={BOVEN + PLOT + 0.5} y2={BOVEN + PLOT + 0.5} />
            {weken.map((p, i) => {
              const x = i * vak + (vak - breedte) / 2
              const midden = i * vak + vak / 2
              const huidig = i === weken.length - 1
              return (
                <g key={p.start} aria-hidden="true">
                  {p.leads > 0 ? (
                    <rect className="ptd-an-staaf" x={x} y={BOVEN + PLOT - hoogte(p.leads)} width={breedte} height={hoogte(p.leads)} rx={3} />
                  ) : null}
                  {p.klant > 0 ? (
                    <rect className="ptd-an-staaf--klant" x={x} y={BOVEN + PLOT - hoogte(p.klant)} width={breedte} height={hoogte(p.klant)} rx={3} />
                  ) : null}
                  <text className="ptd-an-waarde" x={midden} y={BOVEN + PLOT - hoogte(p.leads) - 5} textAnchor="middle">
                    {p.leads}
                  </text>
                  <text className={huidig ? 'ptd-an-wk ptd-an-wk--nu' : 'ptd-an-wk'} x={midden} y={H - 6} textAnchor="middle">
                    {huidig ? 'nu' : `wk ${p.week}`}
                  </text>
                </g>
              )
            })}
          </svg>
          <ul className="ptd-an-legenda" aria-hidden="true">
            <li><i className="ptd-an-stip" /> Leads (op gespreksdatum)</li>
            <li><i className="ptd-an-stip ptd-an-stip--klant" /> Daarvan nu klant</li>
          </ul>
          <table className="sr-only">
            <caption>{kop}</caption>
            <thead>
              <tr><th scope="col">Week</th><th scope="col">Leads</th><th scope="col">Daarvan nu klant</th></tr>
            </thead>
            <tbody>
              {weken.map((p) => (
                <tr key={p.start}>
                  <th scope="row">Week {p.week} (vanaf {dagKort(p.start)})</th>
                  <td>{p.leads}</td>
                  <td>{p.klant}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ptd-hint">De huidige week loopt nog. Wie klant wordt, telt mee in de week van het eerste gesprek.</p>
        </>
      )}
    </div>
  )
}
