// Alle overige metingen, per groep, compact. Daaronder eerlijk wat (nog) niet
// gemeten wordt, met de weg naar de koppelingen.

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  GROEP_LABELS, GROEP_VOLGORDE, METRIEKEN, formatMetWaarde,
} from '@/lib/health/gezondheid-metrics'
import { meetmomentLabel, type MetriekSamenvatting } from '@/lib/gezondheid/samenvatting'
import { METRIEK_SLEUTELS, type MetriekSleutel } from '@/lib/gezondheid/types'
import { METRIEK_ICONEN } from './metriek-iconen'
import styles from './gezondheid.module.css'

interface AlleMetriekenProps {
  samenvattingen: readonly MetriekSamenvatting[]
  /** Alle metingen met data, ook de vastgezette (die staan hier niet in de lijst). */
  gemeten: readonly MetriekSleutel[]
  vandaag: string
  koppelRoute: string
}

export function CompactRegel({ s, vandaag }: { s: MetriekSamenvatting; vandaag: string }) {
  const Icoon = METRIEK_ICONEN[s.sleutel]
  return (
    <Link href={`/gezondheid/${s.sleutel}`} className={styles.compactRegel}>
      <Icoon size={18} aria-hidden="true" />
      <span className={styles.compactLabel}>{METRIEKEN[s.sleutel].label}</span>
      <span className={styles.compactWaarde}>
        {formatMetWaarde(s.sleutel, s.laatste.waarde)}
        <span className={styles.compactDatum}>{meetmomentLabel(s.sleutel, s.laatste.datum, vandaag)}</span>
      </span>
      <ChevronRight size={16} className={styles.pijl} aria-hidden="true" />
    </Link>
  )
}

export function AlleMetrieken({ samenvattingen, gemeten, vandaag, koppelRoute }: AlleMetriekenProps) {
  const metData = new Set<MetriekSleutel>(gemeten)
  const nietGemeten = METRIEK_SLEUTELS.filter((s) => !metData.has(s))
  const groepen = GROEP_VOLGORDE
    .map((groep) => ({ groep, lijst: samenvattingen.filter((s) => METRIEKEN[s.sleutel].groep === groep) }))
    .filter((g) => g.lijst.length > 0)

  return (
    <>
      {groepen.length > 0 && (
        <div className={styles.groepen}>
          {groepen.map(({ groep, lijst }) => (
            <section key={groep} aria-labelledby={`groep-${groep}`}>
              <h3 id={`groep-${groep}`} className={styles.groepTitel}>{GROEP_LABELS[groep]}</h3>
              <ul className={styles.compactLijst}>
                {lijst.map((s) => <li key={s.sleutel}><CompactRegel s={s} vandaag={vandaag} /></li>)}
              </ul>
            </section>
          ))}
        </div>
      )}
      {nietGemeten.length > 0 && (
        <p className={`${styles.kleineTekst} ${styles.nietGemeten}`}>
          Nog geen metingen van: {nietGemeten.map((s) => METRIEKEN[s].label).join(', ')}.
          {' '}Niet elk horloge of elke telefoon meet alles. Meet jouw apparaat dit wel?{' '}
          <Link href={koppelRoute} className={styles.link}>Controleer je koppelingen</Link>.
        </p>
      )}
    </>
  )
}
