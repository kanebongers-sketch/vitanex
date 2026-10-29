'use client'

import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { PARQ_PREFIX } from '@/lib/club/intakevragen/kern'
import { isEigen, type IntakeVraag } from '@/lib/club/intakevragen/soorten'
import type { EigenWaarde } from '@/lib/club/intakevragen/eigen'
import { IntakeToestemming } from '@/components/club/training/IntakeGezondheid'
import type { IntakeStaat } from '@/components/club/training/intake-staat'
import { EigenVeld } from './EigenVeld'
import { KernVeld } from './KernVeld'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { INTAKE, sectieInTaal, vraagInTaal } from '@/lib/aiyourgym/taal/woorden/club/intake'

export function Stap({ nr, titel, children }: { nr: number; titel: string; children: ReactNode }) {
  return (
    <section className="club-training-stap" aria-labelledby={`stap-${nr}`}>
      <h2 id={`stap-${nr}`}><span className="club-training-stapnr">{nr}</span>{titel}</h2>
      {children}
    </section>
  )
}

interface IntakeSectieProps {
  nr: number
  naam: string
  /** De actieve vragen van deze sectie, in volgorde. */
  vragen: readonly IntakeVraag[]
  s: IntakeStaat
  zet: (deel: Partial<IntakeStaat>) => void
  /** Hier staat het vinkje voor toestemming (de eerste sectie met een gezondheidsvraag). */
  metToestemming: boolean
}

function Vraag({ vraag: bron, s, zet }: { vraag: IntakeVraag; s: IntakeStaat; zet: IntakeSectieProps['zet'] }) {
  const taal = useTaal()
  const t = useTekst(INTAKE).sectie
  const vraag = vraagInTaal(bron, taal)
  const zetEigen = (w: EigenWaarde) => zet({ eigen: { ...s.eigen, [vraag.id]: w } })
  return (
    <div className="club-intakevragen-vraag" data-verplicht={vraag.verplicht || undefined}>
      {isEigen(vraag) ? <EigenVeld vraag={vraag} waarde={s.eigen[vraag.id]} onWaarde={zetEigen} /> : <KernVeld vraag={vraag} s={s} zet={zet} />}
      {(vraag.uitleg || vraag.verplicht) && (
        <p className="club-hint club-intakevragen-uitleg">
          {vraag.verplicht && <span className="club-intakevragen-verplicht">{t.verplicht}</span>}
          {vraag.uitleg}
        </p>
      )}
    </div>
  )
}

/**
 * Een sectie van het intakeformulier. Gezondheidsvragen (AVG) verschijnen pas
 * na het vinkje voor toestemming; zonder vinkje staat er alleen een slotje.
 */
export function IntakeSectie({ nr, naam, vragen, s, zet, metToestemming }: IntakeSectieProps) {
  const taal = useTaal()
  const t = useTekst(INTAKE).sectie
  const verborgen = vragen.filter((v) => v.gezondheid).length
  const zichtbaar = vragen.filter((v) => !v.gezondheid || s.toestemming)
  const parqJa = s.parqJa.length > 0 && zichtbaar.some((v) => v.sleutel?.startsWith(PARQ_PREFIX))
  return (
    <Stap nr={nr} titel={sectieInTaal(naam, taal)}>
      {metToestemming && <IntakeToestemming aan={s.toestemming} onZet={(aan) => zet({ toestemming: aan })} />}
      {zichtbaar.map((v) => <Vraag key={v.id} vraag={v} s={s} zet={zet} />)}
      {!s.toestemming && verborgen > 0 && (
        <p className="club-hint club-intakevragen-slot">
          <Lock aria-hidden size={14} /> {t.slot(verborgen)}
        </p>
      )}
      {parqJa && (
        <p className="club-melding club-melding--fout" role="status">
          {t.parqJa}
        </p>
      )}
    </Stap>
  )
}
