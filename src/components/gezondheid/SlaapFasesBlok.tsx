// Slaapfases van de afgelopen week: één gestapelde balk (tinten van het accent,
// niet meerkleurig) met de minuten per fase als tekst — kleur is nooit de enige drager.

import { formatDuur } from '@/lib/health/gezondheid-metrics'
import { FASE_LABELS, FASE_VOLGORDE, gemiddeldeFases, type Fase } from '@/lib/gezondheid/slaap'
import type { GezondheidsDag } from '@/lib/gezondheid/types'
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
  const gemiddeld = gemiddeldeFases(dagen, vandaag)

  return (
    <section aria-labelledby="kop-fases">
      <h2 id="kop-fases" className={styles.blokTitel}>Slaapfases</h2>
      {!gemiddeld ? (
        <p className={styles.kleineTekst}>
          Je bron gaf de afgelopen week geen slaapfases door. Veel horloges meten diep, licht en REM; een
          telefoon alleen meestal niet.
        </p>
      ) : (
        <FasesWeergave fases={gemiddeld.fases} nachten={gemiddeld.nachten} />
      )}
    </section>
  )
}

function FasesWeergave({ fases, nachten }: { fases: Record<Fase, number | null>; nachten: number }) {
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
            {FASE_LABELS[f]}
            <span className={styles.faseMinuten}>{fases[f] === null ? 'niet gemeten' : formatDuur(fases[f] ?? 0)}</span>
          </li>
        ))}
      </ul>
      <p className={`${styles.kleineTekst} ${styles.hint}`}>
        Gemiddeld per nacht over {nachten} {nachten === 1 ? 'nacht' : 'nachten'} met fases, de afgelopen 7 dagen.
      </p>
    </>
  )
}
