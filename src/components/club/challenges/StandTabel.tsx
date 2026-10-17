import { Check } from 'lucide-react'
import { fractie, type Stand } from '@/lib/club/challenges/voortgang'

// De stand van een challenge voor de beheerder: plek, naam, voortgang. Toont
// wie al iets deed; wie nog op nul staat, telt onderaan mee als aantal.

interface Props {
  stand: readonly Stand[]
  doel: number
  /** Staat de ranglijst in de app aan? Dan tonen we ook de naam zoals leden die zien. */
  ranglijstAan: boolean
}

const MAX_RIJEN = 100

export function StandTabel({ stand, doel, ranglijstAan }: Props) {
  const metScore = stand.filter((s) => s.score > 0)
  const zichtbaar = metScore.slice(0, MAX_RIJEN)
  const opNul = stand.length - metScore.length

  if (zichtbaar.length === 0) {
    return <p className="club-challenges-leeg">{stand.length === 0 ? 'Nog geen deelnemers.' : `Nog niemand is begonnen. ${stand.length} ${stand.length === 1 ? 'deelnemer staat' : 'deelnemers staan'} op nul.`}</p>
  }

  return (
    <>
      <ol className="club-challenges-stand" aria-label="Stand van de deelnemers">
        {zichtbaar.map((s) => (
          <li key={s.lidId} className={s.gehaald ? 'is-gehaald' : undefined}>
            <span className="club-challenges-plek" aria-label={`Plek ${s.positie}`}>
              {s.positie}
            </span>
            <span className="club-challenges-wie">
              <strong>{s.volledigeNaam}</strong>
              {ranglijstAan && <small>In de app: {s.naam}</small>}
            </span>
            <span className="club-challenges-score">
              <span className="club-challenges-balk" role="progressbar" aria-label={`Voortgang ${s.volledigeNaam}`} aria-valuemin={0} aria-valuemax={doel} aria-valuenow={Math.min(s.score, doel)}>
                <span style={{ transform: `scaleX(${fractie(s.score, doel)})` }} />
              </span>
              <span className="club-challenges-getal">
                {s.score}
                <small>/{doel}</small>
              </span>
              {s.gehaald ? <Check size={16} aria-label="Gehaald" className="club-challenges-vink" /> : <span className="club-challenges-vink" aria-hidden />}
            </span>
          </li>
        ))}
      </ol>
      <p className="club-hint">
        {metScore.length > MAX_RIJEN && `De eerste ${MAX_RIJEN} van ${metScore.length} staan hierboven. `}
        {opNul > 0 && `Nog op nul, dus niet in de lijst: ${opNul} ${opNul === 1 ? 'deelnemer' : 'deelnemers'}.`}
      </p>
    </>
  )
}
