// "Jouw normaal": mediaan + gebruikelijk bereik, of eerlijk waarom die er nog niet is.

import { METRIEKEN, formatMetWaarde } from '@/lib/health/gezondheid-metrics'
import { MIN_METINGEN_NORMAAL, type Normaal } from '@/lib/gezondheid/normaal'
import { datumKort } from '@/lib/gezondheid/statistiek'
import {
  liggingTovNormaal, meetmomentLabel, type MetriekSamenvatting,
} from '@/lib/gezondheid/samenvatting'
import type { MetriekSleutel } from '@/lib/gezondheid/types'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface NormaalBlokProps {
  sleutel: MetriekSleutel
  normaal: Normaal | null
  metingenInVenster: number
  samenvatting: MetriekSamenvatting | null
  vandaag: string
}

function GeenNormaal({ sleutel, metingenInVenster }: { sleutel: MetriekSleutel; metingenInVenster: number }) {
  const ts = useTaalset()
  if (!METRIEKEN[sleutel].heeftNormaal) {
    return <p className={styles.kleineTekst}>{ts.t('lichaam.normaal.nietVoorDeze')}</p>
  }
  return (
    <p className={styles.kleineTekst}>
      {ts.t(metingenInVenster === 1 ? 'lichaam.normaal.nogNietEen' : 'lichaam.normaal.nogNietMeer', {
        minimum: MIN_METINGEN_NORMAAL, aantal: metingenInVenster,
      })}
    </p>
  )
}

export function NormaalBlok({ sleutel, normaal, metingenInVenster, samenvatting, vandaag }: NormaalBlokProps) {
  const ts = useTaalset()
  const cfg = METRIEKEN[sleutel]
  return (
    <section aria-labelledby="kop-normaal">
      <h2 id="kop-normaal" className={styles.blokTitel}>{ts.t('lichaam.normaal.titel')}</h2>
      {normaal ? (
        <>
          <p className={styles.blokWaarde}>{formatMetWaarde(sleutel, normaal.mediaan, ts)}</p>
          <p className={styles.kleineTekst}>
            {ts.t('lichaam.normaal.bereik', {
              laag: cfg.formatteer(normaal.laag, ts),
              hoog: formatMetWaarde(sleutel, normaal.hoog, ts),
              aantal: normaal.aantal,
              vanaf: datumKort(normaal.vanaf, ts),
              tot: datumKort(normaal.tot, ts),
            })}
          </p>
          {samenvatting?.actueel && (
            <p className={`${styles.kleineTekst} ${styles.hint}`}>
              {ts.t(`lichaam.normaal.ligging.${liggingTovNormaal(samenvatting.laatste.waarde, normaal)}`, {
                moment: meetmomentLabel(sleutel, samenvatting.laatste.datum, vandaag, ts).toLowerCase(),
              })}
            </p>
          )}
        </>
      ) : (
        <GeenNormaal sleutel={sleutel} metingenInVenster={metingenInVenster} />
      )}
    </section>
  )
}
