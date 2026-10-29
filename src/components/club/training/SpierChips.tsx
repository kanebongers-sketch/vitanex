import type { Spier } from '@/lib/club/training/spieren'
import type { Spiergroep } from '@/lib/club/training/typen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { TRAINING_LABELS, spierUitlegIn } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { Spierkaart } from './Spierkaart'
import './spierkaart.css'

interface SpierChipsProps {
  primair: readonly Spier[]
  /** Terugval als er nog geen spieren zijn ingevuld. */
  spiergroep: Spiergroep
  /** Hooguit zoveel chips; de rest als "+2". */
  max?: number
}

/** Kort de spieren waar een oefening vooral op werkt, als chips. Alleen spans: hij staat ook binnen knoppen. */
export function SpierChips({ primair, spiergroep, max = 3 }: SpierChipsProps) {
  const t = useTekst(CLUB_TRAINING).spieren
  const l = useTekst(TRAINING_LABELS)
  if (primair.length === 0) {
    return (
      <span className="club-training-spierchips">
        <span className="club-training-spierchip club-training-spierchip--grof">{l.spiergroep[spiergroep]}</span>
      </span>
    )
  }
  const zichtbaar = primair.slice(0, max)
  const rest = primair.length - zichtbaar.length
  return (
    <span className="club-training-spierchips">
      <span className="club-sr">{t.vooralOp}</span>
      {zichtbaar.map((s, i) => (
        <span key={s} className="club-training-spierchip">
          {l.spier[s]}
          {i < zichtbaar.length - 1 || rest > 0 ? <span className="club-sr">, </span> : null}
        </span>
      ))}
      {rest > 0 && (
        <span className="club-training-spierchip" title={primair.slice(max).map((s) => l.spier[s]).join(', ')}>
          +{rest}
          <span className="club-sr">{t.meer}</span>
        </span>
      )}
    </span>
  )
}

interface SpierBlokProps {
  naam: string
  primair: readonly Spier[]
  secundair: readonly Spier[]
}

/** De grote spierkaart met de zin eronder. Voor de detailweergave en het blad in de ledenapp. */
export function SpierBlok({ naam, primair, secundair }: SpierBlokProps) {
  const taal = useTaal()
  const t = useTekst(CLUB_TRAINING).spieren
  const zin = spierUitlegIn(primair, secundair, taal)
  return (
    <div className="club-training-spierblok">
      <Spierkaart naam={naam} primair={primair} secundair={secundair} formaat="groot" />
      <p className="club-training-spieruitleg">{zin || t.geenSpieren}</p>
    </div>
  )
}
