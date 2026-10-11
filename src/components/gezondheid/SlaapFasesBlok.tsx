// Slaapfases van de afgelopen week: één gestapelde balk (tinten van het accent,
// niet meerkleurig) met de minuten per fase als tekst — kleur is nooit de enige drager.

import { formatDuur } from '@/lib/health/gezondheid-metrics'
import { FASE_VOLGORDE, faseLabel, gemiddeldeFases, type Fase } from '@/lib/gezondheid/slaap'
import type { GezondheidsDag } from '@/lib/gezondheid/types'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface SlaapFasesBlokProps {
  dagen: readonly GezondheidsDag[]
  vandaag: string
}

const FASE_KLASSE: Record<Fase, string> = {
  diep: styles.faseDiep,
  rem: styles.faseRem,
  licht: styles.faseLicht,
  wakker: styles.faseWakker,
}

export function SlaapFasesBlok({ dagen, vandaag }: SlaapFasesBlokProps) {
  const ts = useTaalset()
  const gemiddeld = gemiddeldeFases(dagen, vandaag)

  return (
    <section aria-labelledby="kop-fases">
      <h2 id="kop-fases" className={styles.blokTitel}>{ts.t('lichaam.fases.titel')}</h2>
      {!gemiddeld ? (
        <p className={styles.kleineTekst}>{ts.t('lichaam.fases.geen')}</p>
      ) : (
        <FasesWeergave fases={gemiddeld.fases} nachten={gemiddeld.nachten} />
      )}
    </section>
  )
}

function FasesWeergave({ fases, nachten }: { fases: Record<Fase, number | null>; nachten: number }) {
  const ts = useTaalset()
  const gemeten = FASE_VOLGORDE.filter((f) => fases[f] !== null)
  const totaal = gemeten.reduce((som, f) => som + (fases[f] ?? 0), 0) || 1
  return (
    <>
      <div className={styles.fasesBalk} aria-hidden="true">
        {gemeten.map((f) => (
          <span key={f} className={`${styles.fase} ${FASE_KLASSE[f]}`} style={{ width: `${((fases[f] ?? 0) / totaal) * 100}%` }} />
        ))}
      </div>
      <ul className={styles.fasesLijst}>
        {FASE_VOLGORDE.map((f) => (
          <li key={f} className={styles.faseItem}>
            <span className={`${styles.faseStip} ${FASE_KLASSE[f]}`} aria-hidden="true" />
            {faseLabel(f, ts)}
            <span className={styles.faseMinuten}>{fases[f] === null ? ts.t('lichaam.fases.nietGemeten') : formatDuur(fases[f] ?? 0, ts)}</span>
          </li>
        ))}
      </ul>
      <p className={`${styles.kleineTekst} ${styles.hint}`}>
        {ts.t(nachten === 1 ? 'lichaam.fases.gemiddeldEen' : 'lichaam.fases.gemiddeldMeer', { nachten })}
      </p>
    </>
  )
}
