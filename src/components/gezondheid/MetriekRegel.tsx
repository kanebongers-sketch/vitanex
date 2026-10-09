// Eén regel in de samenvatting: label, laatste meting, minitrend en normaal.
// De eerste vastgezette metriek krijgt de grote (hero) variant.
// Geen aria-label op de link: de zichtbare inhoud (incl. normaal) is de naam,
// aangevuld met sr-only tekst over de ligging t.o.v. je normaal en "Bekijk details".

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { METRIEKEN, formatMetWaarde } from '@/lib/health/gezondheid-metrics'
import {
  liggingTovNormaal, meetmomentLabel, type Ligging, type MetriekSamenvatting,
} from '@/lib/gezondheid/samenvatting'
import { METRIEK_ICONEN } from './metriek-iconen'
import { MetriekWaarde } from './MetriekWaarde'
import { MiniTrend } from './MiniTrend'
import styles from './gezondheid.module.css'

const LIGGING_TEKST: Record<Ligging, string> = {
  binnen: 'Laatste meting ligt binnen je normaal.',
  boven: 'Laatste meting ligt boven je normaal.',
  onder: 'Laatste meting ligt onder je normaal.',
}

/** Alleen bij een actuele, afgeronde meting: een lopende optel-dag is nog niet af. */
function liggingTekst({ sleutel, laatste, actueel, normaal }: MetriekSamenvatting, vandaag: string): string | null {
  if (!normaal || !actueel) return null
  if (METRIEKEN[sleutel].cumulatief && laatste.datum === vandaag) return null
  return LIGGING_TEKST[liggingTovNormaal(laatste.waarde, normaal)]
}

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
  const ligging = liggingTekst(samenvatting, vandaag)

  return (
    <Link href={`/gezondheid/${sleutel}`} className={styles.regel}>
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
      <span className={styles.srOnly}>
        {ligging && `${ligging} `}Bekijk details.
      </span>
    </Link>
  )
}
