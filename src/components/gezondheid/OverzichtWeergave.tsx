// Presentational: het gezondheidsoverzicht bij geladen data.
// Volgorde: highlights (wat valt op) → samenvatting (vastgezet) → al het andere.

import Link from 'next/link'
import { beoordeelbareMetrieken, berekenHighlights } from '@/lib/gezondheid/highlights'
import { vatAllesSamen } from '@/lib/gezondheid/samenvatting'
import { verdeelSamenvatting } from '@/lib/gezondheid/vastgezet'
import { METRIEK_SLEUTELS, type GezondheidAntwoord, type MetriekSleutel } from '@/lib/gezondheid/types'
import { AlleMetrieken } from './AlleMetrieken'
import { HighlightLijst } from './HighlightLijst'
import { LegeGezondheid } from './LegeGezondheid'
import { MetriekRegel } from './MetriekRegel'
import { KOPPEL_ROUTE } from './routes'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface OverzichtWeergaveProps {
  data: GezondheidAntwoord
  vastgezet: readonly MetriekSleutel[]
}

export function OverzichtWeergave({ data, vastgezet }: OverzichtWeergaveProps) {
  const ts = useTaalset()
  const samenvattingen = vatAllesSamen(data.dagen, data.vandaag)
  if (samenvattingen.length === 0) return <LegeGezondheid koppelRoute={KOPPEL_ROUTE} />

  const highlights = berekenHighlights(data.dagen, data.vandaag, undefined, ts)
  const { boven, overig } = verdeelSamenvatting(vastgezet, samenvattingen.map((s) => s.sleutel))
  const perSleutel = new Map(samenvattingen.map((s) => [s.sleutel, s]))

  return (
    <>
      <section className={styles.sectie} aria-labelledby="kop-highlights">
        <h2 id="kop-highlights" className={styles.sectieKop}>{ts.t('lichaam.overzicht.opvalt')}</h2>
        {highlights.length > 0 ? (
          <HighlightLijst highlights={highlights} />
        ) : (
          <p className={`${styles.kleineTekst} ${styles.smal}`}>
            {beoordeelbareMetrieken(data.dagen, data.vandaag).length > 0
              ? ts.t('lichaam.overzicht.geenAfwijking')
              : ts.t('lichaam.overzicht.teWeinig')}
            {' '}{ts.t('lichaam.overzicht.highlightUitleg')}
          </p>
        )}
      </section>

      <section className={styles.sectie} aria-labelledby="kop-samenvatting" style={{ animationDelay: '60ms' }}>
        <h2 id="kop-samenvatting" className={styles.sectieKop}>{ts.t('lichaam.overzicht.samenvatting')}</h2>
        <ul className={styles.regels}>
          {boven.map((sleutel, i) => {
            const s = perSleutel.get(sleutel)
            return s ? <li key={sleutel}><MetriekRegel samenvatting={s} vandaag={data.vandaag} hero={i === 0} /></li> : null
          })}
        </ul>
        <p className={`${styles.kleineTekst} ${styles.hint}`}>
          {ts.t('lichaam.overzicht.kiesZelf')}
        </p>
      </section>

      {(overig.length > 0 || samenvattingen.length < METRIEK_SLEUTELS.length) && (
        <section className={styles.sectie} aria-labelledby="kop-alle" style={{ animationDelay: '120ms' }}>
          <h2 id="kop-alle" className={styles.sectieKop}>{ts.t('lichaam.overzicht.alle')}</h2>
          <AlleMetrieken
            samenvattingen={overig.map((s) => perSleutel.get(s)).filter((s) => s !== undefined)}
            gemeten={samenvattingen.map((s) => s.sleutel)}
            vandaag={data.vandaag}
            koppelRoute={KOPPEL_ROUTE}
          />
        </section>
      )}

      <p className={`${styles.kleineTekst} ${styles.smal} ${styles.voetnoot}`}>
        {ts.t('lichaam.overzicht.voetnoot')}{' '}
        <Link href={KOPPEL_ROUTE} className={styles.link}>{ts.t('lichaam.overzicht.koppelingen')}</Link>
      </p>
    </>
  )
}
