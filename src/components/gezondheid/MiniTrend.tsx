// Minitrend van 7 dagen: staafjes voor optellende metrieken, een lijn voor de
// rest. Puur decoratief (aria-hidden); de waarden staan als tekst in de regel.

import styles from './gezondheid.module.css'

interface MiniTrendProps {
  waarden: readonly (number | null)[]
  vorm: 'staaf' | 'lijn'
  groot?: boolean
}

const B = 70
const H = 30

export function MiniTrend({ waarden, vorm, groot = false }: MiniTrendProps) {
  const gemeten = waarden.filter((w): w is number => w !== null)
  const klasse = `${styles.mini}${groot ? ` ${styles.miniHero}` : ''}`
  if (gemeten.length === 0) return <svg className={klasse} viewBox={`0 0 ${B} ${H}`} aria-hidden="true" />

  const stap = B / waarden.length
  const max = Math.max(...gemeten)
  const min = vorm === 'staaf' ? 0 : Math.min(...gemeten)
  const bereik = max - min || 1
  const y = (w: number) => H - 2 - ((w - min) / bereik) * (H - 6)

  return (
    <svg className={klasse} viewBox={`0 0 ${B} ${H}`} aria-hidden="true" focusable="false">
      <line className={styles.miniBasis} x1={0} x2={B} y1={H - 0.5} y2={H - 0.5} />
      {vorm === 'staaf'
        ? waarden.map((w, i) => w === null ? null : (
          <rect
            key={i}
            className={i === waarden.length - 1 ? styles.miniStaafLaatste : styles.miniStaaf}
            x={i * stap + stap * 0.18} width={stap * 0.64}
            y={y(w)} height={Math.max(H - y(w), 1.5)} rx={1.5}
          />
        ))
        : <LijnPaden waarden={waarden} stap={stap} y={y} />}
    </svg>
  )
}

interface LijnPadenProps {
  waarden: readonly (number | null)[]
  stap: number
  y: (w: number) => number
}

function LijnPaden({ waarden, stap, y }: LijnPadenProps) {
  const punten = waarden.map((w, i) => (w === null ? null : { x: i * stap + stap / 2, y: y(w) }))
  const pad = punten.reduce((d, p, i) => {
    if (!p) return d
    const vorige = punten[i - 1]
    return `${d}${vorige ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }, '')
  return (
    <>
      <path className={styles.miniLijn} d={pad} />
      {punten.map((p, i) => p && <circle key={i} className={styles.miniPunt} cx={p.x} cy={p.y} r={i === punten.length - 1 ? 2.6 : 1.6} />)}
    </>
  )
}
