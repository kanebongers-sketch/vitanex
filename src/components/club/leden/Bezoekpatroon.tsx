import { perWeekdag, weekBalken, WEEKDAG_KORT } from '@/lib/club/leden/patroon'

// Het bezoekpatroon van een lid: 12 staafjes (per 7 dagen, de laatste eindigt
// vandaag) en een strook per weekdag. Eigen SVG, geen grafiekbibliotheek.

interface BezoekpatroonProps {
  bezoeken: Date[]
  nu: Date
}

const B = 560
const H = 150
const ONDER = 22
const BOVEN = 14

function Balken({ bezoeken, nu }: BezoekpatroonProps) {
  const balken = weekBalken(bezoeken, nu)
  const max = Math.max(3, ...balken.map((b) => b.aantal))
  const vak = B / balken.length
  const breed = vak * 0.56
  const schaal = (H - ONDER - BOVEN) / max
  const totaal = balken.reduce((s, b) => s + b.aantal, 0)
  return (
    <figure className="club-leden-patroon">
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={`Bezoeken per week, laatste 12 weken: samen ${totaal}. ${balken.map((b) => `week vanaf ${b.label}: ${b.aantal}`).join(', ')}.`}>
        {[1, 2, 3].filter((n) => n <= max).map((n) => (
          <line key={n} x1={0} x2={B} y1={H - ONDER - n * schaal} y2={H - ONDER - n * schaal} className="club-leden-patroon-lijn" />
        ))}
        {balken.map((b, i) => {
          const hoog = Math.max(b.aantal * schaal, b.aantal ? 4 : 2)
          const x = i * vak + (vak - breed) / 2
          return (
            <g key={b.label} className={b.huidig ? 'club-leden-balk club-leden-balk--nu' : 'club-leden-balk'}>
              <rect x={x} y={H - ONDER - hoog} width={breed} height={hoog} rx={3} data-leeg={b.aantal === 0 || undefined} />
              {b.aantal ? <text x={x + breed / 2} y={H - ONDER - hoog - 4} textAnchor="middle" className="club-leden-balk-getal">{b.aantal}</text> : null}
              {i % 2 === 1 || b.huidig ? <text x={x + breed / 2} y={H - 6} textAnchor="middle" className="club-leden-balk-label">{b.huidig ? 'nu' : b.label}</text> : null}
            </g>
          )
        })}
      </svg>
      <figcaption className="club-hint">Bezoeken per week (een dag met een check-in telt als een bezoek).</figcaption>
    </figure>
  )
}

function Weekdagen({ bezoeken, nu }: BezoekpatroonProps) {
  const telling = perWeekdag(bezoeken, nu)
  const max = Math.max(1, ...telling)
  return (
    <ol className="club-leden-weekdagen" aria-label="Bezoeken per weekdag, laatste 12 weken">
      {telling.map((n, i) => (
        <li key={WEEKDAG_KORT[i]}>
          <span className="club-leden-weekdag-vak" aria-hidden style={{ opacity: n ? 0.18 + 0.82 * (n / max) : 1 }} data-leeg={n === 0 || undefined} />
          <span className="club-leden-weekdag-naam">{WEEKDAG_KORT[i]}</span>
          <span className="club-getal">{n}</span>
        </li>
      ))}
    </ol>
  )
}

export function Bezoekpatroon({ bezoeken, nu }: BezoekpatroonProps) {
  return (
    <div className="club-leden-patroon-wrap">
      <Balken bezoeken={bezoeken} nu={nu} />
      <Weekdagen bezoeken={bezoeken} nu={nu} />
    </div>
  )
}
