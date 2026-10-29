import { Check } from 'lucide-react'
import { fractie, type Stand } from '@/lib/club/challenges/voortgang'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'

// De stand van een challenge voor de beheerder: plek, naam, voortgang. Toont
// wie al iets deed; wie nog op nul staat, telt onderaan mee als aantal.

interface Props {
  stand: readonly Stand[]
  doel: number
  /** Staat de ranglijst in de app aan? Dan tonen we ook de naam zoals leden die zien. */
  ranglijstAan: boolean
}

const MAX_RIJEN = 100

export async function StandTabel({ stand, doel, ranglijstAan }: Props) {
  const t = CHALLENGES[await getTaal()].stand
  const metScore = stand.filter((s) => s.score > 0)
  const zichtbaar = metScore.slice(0, MAX_RIJEN)
  const opNul = stand.length - metScore.length

  if (zichtbaar.length === 0) {
    return <p className="club-challenges-leeg">{stand.length === 0 ? t.geenDeelnemers : t.niemandBegonnen(stand.length)}</p>
  }

  return (
    <>
      <ol className="club-challenges-stand" aria-label={t.label}>
        {zichtbaar.map((s) => (
          <li key={s.lidId} className={s.gehaald ? 'is-gehaald' : undefined}>
            <span className="club-challenges-plek" aria-label={t.plek(s.positie)}>
              {s.positie}
            </span>
            <span className="club-challenges-wie">
              <strong>{s.volledigeNaam}</strong>
              {ranglijstAan && <small>{t.inApp(s.naam)}</small>}
            </span>
            <span className="club-challenges-score">
              <span className="club-challenges-balk" role="progressbar" aria-label={t.voortgang(s.volledigeNaam)} aria-valuemin={0} aria-valuemax={doel} aria-valuenow={Math.min(s.score, doel)}>
                <span style={{ transform: `scaleX(${fractie(s.score, doel)})` }} />
              </span>
              <span className="club-challenges-getal">
                {s.score}
                <small>/{doel}</small>
              </span>
              {s.gehaald ? <Check size={16} aria-label={t.gehaald} className="club-challenges-vink" /> : <span className="club-challenges-vink" aria-hidden />}
            </span>
          </li>
        ))}
      </ol>
      <p className="club-hint">
        {metScore.length > MAX_RIJEN && t.eersten(MAX_RIJEN, metScore.length)}
        {opNul > 0 && t.opNul(opNul)}
      </p>
    </>
  )
}
