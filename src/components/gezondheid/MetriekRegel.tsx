// Eén regel in de samenvatting: label, laatste meting, minitrend en normaal.
// De eerste vastgezette metriek krijgt de grote (hero) variant.
// Geen aria-label op de link: de zichtbare inhoud (incl. normaal) is de naam,
// aangevuld met sr-only tekst over de ligging t.o.v. je normaal en "Bekijk details".

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { METRIEKEN, formatMetWaarde, metriekLabel } from '@/lib/health/gezondheid-metrics'
import {
  liggingTovNormaal, meetmomentLabel, type MetriekSamenvatting,
} from '@/lib/gezondheid/samenvatting'
import type { Taalset } from '@/lib/i18n/taalset'
import { METRIEK_ICONEN } from './metriek-iconen'
import { MetriekWaarde } from './MetriekWaarde'
import { MiniTrend } from './MiniTrend'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

/** Alleen bij een actuele, afgeronde meting: een lopende optel-dag is nog niet af. */
function liggingTekst({ sleutel, laatste, actueel, normaal }: MetriekSamenvatting, vandaag: string, ts: Taalset): string | null {
  if (!normaal || !actueel) return null
  if (METRIEKEN[sleutel].cumulatief && laatste.datum === vandaag) return null
  return ts.t(`lichaam.regel.ligging.${liggingTovNormaal(laatste.waarde, normaal)}`)
}

interface MetriekRegelProps {
  samenvatting: MetriekSamenvatting
  vandaag: string
  hero?: boolean
}

export function MetriekRegel({ samenvatting, vandaag, hero = false }: MetriekRegelProps) {
  const ts = useTaalset()
  const { sleutel, laatste, actueel, mini, normaal } = samenvatting
  const cfg = METRIEKEN[sleutel]
  const Icoon = METRIEK_ICONEN[sleutel]
  const moment = meetmomentLabel(sleutel, laatste.datum, vandaag, ts)
  const ligging = liggingTekst(samenvatting, vandaag, ts)

  return (
    <Link href={`/gezondheid/${sleutel}`} className={styles.regel}>
      <span className={styles.regelKop}>
        <Icoon size={16} aria-hidden="true" />
        {metriekLabel(sleutel, ts)}
        <span className={styles.regelDatum}>
          {actueel ? moment : <em className={styles.oud}>{ts.t('lichaam.regel.laatstGemeten', { moment: moment.toLowerCase() })}</em>}
        </span>
        <ChevronRight size={16} className={styles.pijl} aria-hidden="true" />
      </span>
      <MetriekWaarde sleutel={sleutel} waarde={laatste.waarde} groot={hero} />
      <MiniTrend waarden={mini} vorm={cfg.grafiek} groot={hero} />
      <span className={styles.regelVoet}>
        {normaal
          ? <span>{ts.t('lichaam.regel.normaal', { laag: cfg.formatteer(normaal.laag, ts), hoog: formatMetWaarde(sleutel, normaal.hoog, ts) })}</span>
          : cfg.heeftNormaal && <span>{ts.t('lichaam.regel.geenNormaal')}</span>}
        <span>{ts.t('lichaam.regel.zevenDagen')}</span>
      </span>
      <span className={styles.srOnly}>
        {ligging && `${ligging} `}{ts.t('lichaam.regel.details')}
      </span>
    </Link>
  )
}
