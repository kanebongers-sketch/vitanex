import { formatEuro, maandKort, type TrendMaand } from './finance'

// Een rustige spark van de winst per maand. De balk-hoogte draagt de omvang, de
// kleur draagt het teken: cyaan bij winst, danger bij verlies. De huidige maand
// krijgt een vollere tint. Hoogte staat als statische inline-percentage — nooit
// geanimeerd (dat zou layout triggeren). De balken zelf zijn decoratief; elke
// balk krijgt een tekstueel alternatief via `role="img"` + aria-label.

interface MiniTrendProps {
  trend: TrendMaand[]
  huidigeMaand: string
}

export function MiniTrend({ trend, huidigeMaand }: MiniTrendProps) {
  // Deel door de grootste absolute winst zodat één uitschieter de rest niet plat
  // drukt. `1` als bodem voorkomt delen door nul als alles op nul staat.
  const maxAbs = Math.max(...trend.map((m) => Math.abs(m.winst)), 1)

  return (
    <div className="fin__trend">
      <h3 className="fin__trend-kop">Winst per maand</h3>
      <div className="fin__trend-rij">
        {trend.map((m) => (
          <Balk key={m.maand} maand={m} maxAbs={maxAbs} huidig={m.maand === huidigeMaand} />
        ))}
      </div>
    </div>
  )
}

interface BalkProps {
  maand: TrendMaand
  maxAbs: number
  huidig: boolean
}

function Balk({ maand, maxAbs, huidig }: BalkProps) {
  const verlies = maand.winst < 0
  const hoogtePct = Math.max(6, Math.round((Math.abs(maand.winst) / maxAbs) * 100))
  const klasse = [
    'fin__balk',
    verlies ? 'fin__balk--verlies' : '',
    huidig ? 'fin__balk--huidig' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={klasse}
      role="img"
      aria-label={`${maandKort(maand.maand)}: winst ${formatEuro(maand.winst)}`}
    >
      <span className="fin__balk-spoor" aria-hidden="true">
        <span className="fin__balk-vulling" style={{ height: `${hoogtePct}%` }} />
      </span>
      <span className="fin__balk-label" aria-hidden="true">
        {maandKort(maand.maand)}
      </span>
    </div>
  )
}
