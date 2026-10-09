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
import styles from './gezondheid.module.css'

interface OverzichtWeergaveProps {
  data: GezondheidAntwoord
  vastgezet: readonly MetriekSleutel[]
}

export function OverzichtWeergave({ data, vastgezet }: OverzichtWeergaveProps) {
  const samenvattingen = vatAllesSamen(data.dagen, data.vandaag)
  if (samenvattingen.length === 0) return <LegeGezondheid koppelRoute={KOPPEL_ROUTE} />

  const highlights = berekenHighlights(data.dagen, data.vandaag)
  const { boven, overig } = verdeelSamenvatting(vastgezet, samenvattingen.map((s) => s.sleutel))
  const perSleutel = new Map(samenvattingen.map((s) => [s.sleutel, s]))

  return (
    <>
      <section className={styles.sectie} aria-labelledby="kop-highlights">
        <h2 id="kop-highlights" className={styles.sectieKop}>Wat opvalt</h2>
        {highlights.length > 0 ? (
          <HighlightLijst highlights={highlights} />
        ) : (
          <p className={`${styles.kleineTekst} ${styles.smal}`}>
            {beoordeelbareMetrieken(data.dagen, data.vandaag).length > 0
              ? 'Waar genoeg metingen zijn, wijkt je afgelopen week niet duidelijk af van de vier weken ervoor.'
              : 'Nog te weinig metingen om iets te laten opvallen.'}
            {' '}Een highlight verschijnt pas als je afgelopen week echt anders was dan de vier weken
            ervoor, met minstens 3 recente metingen en 5 metingen voor je normaal.
          </p>
        )}
      </section>

      <section className={styles.sectie} aria-labelledby="kop-samenvatting" style={{ animationDelay: '60ms' }}>
        <h2 id="kop-samenvatting" className={styles.sectieKop}>Samenvatting</h2>
        <ul className={styles.regels}>
          {boven.map((sleutel, i) => {
            const s = perSleutel.get(sleutel)
            return s ? <li key={sleutel}><MetriekRegel samenvatting={s} vandaag={data.vandaag} hero={i === 0} /></li> : null
          })}
        </ul>
        <p className={`${styles.kleineTekst} ${styles.hint}`}>
          Kies zelf wat hier staat: open een meting en zet hem vast.
        </p>
      </section>

      {(overig.length > 0 || samenvattingen.length < METRIEK_SLEUTELS.length) && (
        <section className={styles.sectie} aria-labelledby="kop-alle" style={{ animationDelay: '120ms' }}>
          <h2 id="kop-alle" className={styles.sectieKop}>Alle metingen</h2>
          <AlleMetrieken
            samenvattingen={overig.map((s) => perSleutel.get(s)).filter((s) => s !== undefined)}
            vandaag={data.vandaag}
            koppelRoute={KOPPEL_ROUTE}
          />
        </section>
      )}

      <p className={`${styles.kleineTekst} ${styles.smal} ${styles.voetnoot}`}>
        Je normaal is de middelste waarde (mediaan) van je eigen metingen over de afgelopen 28 dagen; het
        bereik is de middelste helft daarvan. Dit is leefstijlinformatie, geen medisch advies.{' '}
        <Link href={KOPPEL_ROUTE} className={styles.link}>Koppelingen beheren</Link>
      </p>
    </>
  )
}
