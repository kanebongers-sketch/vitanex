// Eén regel in de samenvatting: label, laatste meting, minitrend en normaal.
// De eerste vastgezette metriek krijgt de grote (hero) variant.

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { METRIEKEN, formatMetWaarde } from '@/lib/health/gezondheid-metrics'
import { meetmomentLabel, type MetriekSamenvatting } from '@/lib/gezondheid/samenvatting'
import { METRIEK_ICONEN } from './metriek-iconen'
import { MetriekWaarde } from './MetriekWaarde'
import { MiniTrend } from './MiniTrend'
import styles from './gezondheid.module.css'

interface MetriekRegelProps {
  samenvatting: MetriekSamenvatting
  vandaag: string
  hero?: boolean
}

export function MetriekRegel({ samenvatting, vandaag, hero = false }: MetriekRegelProps) {
  const { sleutel, laatste, actueel, mini, normaal } = samenvatting
  const cfg = METRIEKEN[sleutel]
  const Icoon = METRIEK_ICONEN[sleutel]
  const moment = meetmomentLabel(sleutel, laatste.datum, vandaag)

  return (
    <Link
      href={`/gezondheid/${sleutel}`}
      className={styles.regel}
      aria-label={`${cfg.label}: ${formatMetWaarde(sleutel, laatste.waarde)}, ${moment.toLowerCase()}. Bekijk details.`}
    >
      <span className={styles.regelKop}>
        <Icoon size={16} aria-hidden="true" />
        {cfg.label}
        <span className={styles.regelDatum}>
          {actueel ? moment : <em className={styles.oud}>Laatst gemeten: {moment.toLowerCase()}</em>}
        </span>
        <ChevronRight size={16} className={styles.pijl} aria-hidden="true" />
      </span>
      <MetriekWaarde sleutel={sleutel} waarde={laatste.waarde} groot={hero} />
      <MiniTrend waarden={mini} vorm={cfg.grafiek} groot={hero} />
      <span className={styles.regelVoet}>
        {normaal
          ? <span>Normaal {cfg.formatteer(normaal.laag)} – {formatMetWaarde(sleutel, normaal.hoog)}</span>
          : cfg.heeftNormaal && <span>Nog geen normaal: minimaal 5 metingen nodig</span>}
        <span>Afgelopen 7 dagen</span>
      </span>
    </Link>
  )
}
