// "Jouw normaal": mediaan + gebruikelijk bereik, of eerlijk waarom die er nog niet is.

import { METRIEKEN, formatMetWaarde } from '@/lib/health/gezondheid-metrics'
import { MIN_METINGEN_NORMAAL, type Normaal } from '@/lib/gezondheid/normaal'
import { datumKort } from '@/lib/gezondheid/statistiek'
import {
  liggingTovNormaal, meetmomentLabel, type Ligging, type MetriekSamenvatting,
} from '@/lib/gezondheid/samenvatting'
import type { MetriekSleutel } from '@/lib/gezondheid/types'
import styles from './gezondheid.module.css'

interface NormaalBlokProps {
  sleutel: MetriekSleutel
  normaal: Normaal | null
  metingenInVenster: number
  samenvatting: MetriekSamenvatting | null
  vandaag: string
}

const LIGGING_TEKST: Record<Ligging, string> = {
  binnen: 'ligt binnen je gebruikelijke bereik',
  boven: 'ligt boven je gebruikelijke bereik',
  onder: 'ligt onder je gebruikelijke bereik',
}

function GeenNormaal({ sleutel, metingenInVenster }: { sleutel: MetriekSleutel; metingenInVenster: number }) {
  if (!METRIEKEN[sleutel].heeftNormaal) {
    return (
      <p className={styles.kleineTekst}>
        Hiervoor berekenen we geen normaal: een dag zonder training is geen meting, dus een mediaan zou
        niets eerlijks zeggen.
      </p>
    )
  }
  return (
    <p className={styles.kleineTekst}>
      Nog geen normaal. Daarvoor zijn minstens {MIN_METINGEN_NORMAAL} metingen in de afgelopen 28 dagen nodig;
      er {metingenInVenster === 1 ? 'is er' : 'zijn er'} nu {metingenInVenster}.
    </p>
  )
}

export function NormaalBlok({ sleutel, normaal, metingenInVenster, samenvatting, vandaag }: NormaalBlokProps) {
  const cfg = METRIEKEN[sleutel]
  return (
    <section aria-labelledby="kop-normaal">
      <h2 id="kop-normaal" className={styles.blokTitel}>Jouw normaal</h2>
      {normaal ? (
        <>
          <p className={styles.blokWaarde}>{formatMetWaarde(sleutel, normaal.mediaan)}</p>
          <p className={styles.kleineTekst}>
            Gebruikelijk: {cfg.formatteer(normaal.laag)} – {formatMetWaarde(sleutel, normaal.hoog)}. De mediaan
            van {normaal.aantal} metingen tussen {datumKort(normaal.vanaf)} en {datumKort(normaal.tot)}.
          </p>
          {samenvatting?.actueel && (
            <p className={`${styles.kleineTekst} ${styles.hint}`}>
              Je laatste meting ({meetmomentLabel(sleutel, samenvatting.laatste.datum, vandaag).toLowerCase()}){' '}
              {LIGGING_TEKST[liggingTovNormaal(samenvatting.laatste.waarde, normaal)]}.
            </p>
          )}
        </>
      ) : (
        <GeenNormaal sleutel={sleutel} metingenInVenster={metingenInVenster} />
      )}
    </section>
  )
}
