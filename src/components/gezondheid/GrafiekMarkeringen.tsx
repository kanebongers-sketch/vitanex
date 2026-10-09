// SVG-laag van de detailgrafiek: raster, normaalband, mediaan en de data
// (staven of lijn). Rekent in een viewBox van (n × 10) × 100 die zonder
// beeldverhouding meeschaalt; lijndiktes blijven gelijk via non-scaling-stroke.

import type { Normaal } from '@/lib/gezondheid/normaal'
import { rasterWaarden, yProcent, type Domein } from '@/lib/gezondheid/grafiek'
import type { TrendPunt } from '@/lib/gezondheid/trends'
import styles from './gezondheid.module.css'

interface GrafiekMarkeringenProps {
  punten: readonly TrendPunt[]
  domein: Domein
  normaal: Normaal | null
  vorm: 'staaf' | 'lijn'
  actief: number | null
}

const KOLOM = 10

function Staven({ punten, domein, actief }: Omit<GrafiekMarkeringenProps, 'normaal' | 'vorm'>) {
  const breedte = punten.length > 14 ? 6 : 5
  return (
    <>
      {punten.map((p, i) => {
        if (p.waarde === null) return null
        const top = yProcent(p.waarde, domein)
        const klasse = i === actief ? styles.staafGekozen : p.onvolledig ? styles.staafOnvolledig : ''
        return (
          <rect
            key={p.sleutel}
            className={`${styles.staaf} ${klasse}`}
            x={i * KOLOM + (KOLOM - breedte) / 2} width={breedte}
            y={top} height={Math.max(100 - top, 0.8)}
            style={{ animationDelay: `${i * 12}ms` }}
          />
        )
      })}
    </>
  )
}

function Lijn({ punten, domein, actief }: Omit<GrafiekMarkeringenProps, 'normaal' | 'vorm'>) {
  const coords = punten.map((p, i) => (p.waarde === null ? null : { x: i * KOLOM + KOLOM / 2, y: yProcent(p.waarde, domein) }))
  const pad = coords.reduce((d, c, i) => (c ? `${d}${coords[i - 1] ? 'L' : 'M'}${c.x},${c.y.toFixed(2)}` : d), '')
  return (
    <>
      <path className={styles.lijn} d={pad} />
      {coords.map((c, i) => c && (
        <line
          key={punten[i].sleutel}
          className={`${styles.punt}${i === actief ? ` ${styles.puntGekozen}` : ''}`}
          x1={c.x} x2={c.x} y1={c.y} y2={c.y}
        />
      ))}
    </>
  )
}

export function GrafiekMarkeringen({ punten, domein, normaal, vorm, actief }: GrafiekMarkeringenProps) {
  const breedte = punten.length * KOLOM
  return (
    <svg viewBox={`0 0 ${breedte} 100`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {rasterWaarden(domein).map((w) => {
        const y = yProcent(w, domein)
        return <line key={w} className={styles.raster} x1={0} x2={breedte} y1={y} y2={y} />
      })}
      {normaal && (
        <>
          <rect
            className={styles.band} x={0} width={breedte}
            y={yProcent(normaal.hoog, domein)}
            height={Math.max(yProcent(normaal.laag, domein) - yProcent(normaal.hoog, domein), 0.5)}
          />
          <line
            className={styles.mediaanLijn} x1={0} x2={breedte}
            y1={yProcent(normaal.mediaan, domein)} y2={yProcent(normaal.mediaan, domein)}
          />
        </>
      )}
      {actief !== null && (
        <line className={styles.cursor} x1={actief * KOLOM + KOLOM / 2} x2={actief * KOLOM + KOLOM / 2} y1={0} y2={100} />
      )}
      {vorm === 'staaf'
        ? <Staven punten={punten} domein={domein} actief={actief} />
        : <Lijn punten={punten} domein={domein} actief={actief} />}
    </svg>
  )
}
