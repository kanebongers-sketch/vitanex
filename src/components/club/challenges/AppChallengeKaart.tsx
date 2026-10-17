import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { SOORT_INFO } from '@/lib/club/challenges/model'
import type { AppChallenge } from '@/lib/club/challenges/app'
import { datumKort, statusTekst } from './weergave'

// Een challenge in de ledenapp: status, titel, eigen voortgang en (als de
// sportschool dat aanzet) de ranglijst met alleen voornaam en eerste letter.

interface Props {
  c: AppChallenge
  /** De knop om in of uit te schrijven, alleen bij challenges met inschrijven. */
  knop: ReactNode
}

function Ranglijst({ c }: { c: AppChallenge }) {
  if (!c.ranglijst || c.ranglijst.length === 0) return null
  return (
    <ol className="club-challenges-app-ranglijst" aria-label={`Ranglijst ${c.titel}`}>
      {c.ranglijst.map((s, i) => (
        <li key={`${i}-${s.naam}`} className={s.isIk ? 'is-ik' : undefined} aria-current={s.isIk ? 'true' : undefined}>
          <span className="club-challenges-app-plek">{s.positie}</span>
          <span className="club-challenges-app-naam">{s.isIk ? `${s.naam} (jij)` : s.naam}</span>
          <span className="club-challenges-app-punten">{s.score}</span>
        </li>
      ))}
    </ol>
  )
}

export function AppChallengeKaart({ c, knop }: Props) {
  const info = SOORT_INFO[c.soort]
  const toonVoortgang = c.doetMee && c.status !== 'gepland'
  return (
    <li className={`club-challenges-app-kaart is-${c.status}${c.gehaaldOp ? ' is-gehaald' : ''}`}>
      <span className="club-challenges-app-status">{statusTekst(c.status, c.start, c.eind, c.dagenTeGaan)}</span>
      <h4>{c.titel}</h4>
      {c.uitleg && <p className="club-challenges-app-uitleg">{c.uitleg}</p>}

      {toonVoortgang ? (
        <>
          <p className="club-challenges-app-stand">
            <strong>{c.score}</strong>
            <span>
              van {c.doel} {c.doel === 1 ? info.enkel : info.meer}
            </span>
          </p>
          <span className="club-challenges-app-balk" role="progressbar" aria-label={`Voortgang ${c.titel}`} aria-valuemin={0} aria-valuemax={c.doel} aria-valuenow={Math.min(c.score, c.doel)}>
            <span style={{ transform: `scaleX(${c.fractie})` }} />
          </span>
          {c.gehaaldOp ? (
            <p className="club-challenges-app-gehaald">
              <Check size={15} aria-hidden /> Gehaald op {datumKort(c.gehaaldOp)}. Sterk volgehouden.
            </p>
          ) : (
            c.status === 'afgelopen' && <p className="club-challenges-app-uitleg">Afgelopen. Elke keer dat je kwam, telde mee.</p>
          )}
        </>
      ) : (
        <p className="club-challenges-app-uitleg">
          Doel: {c.doel} {c.doel === 1 ? info.enkel : info.meer}.{' '}
          {c.doetMee ? 'Je doet mee; je voortgang staat hier zodra hij begint.' : c.deelname === 'inschrijven' && c.status !== 'afgelopen' ? 'Schrijf je in om mee te doen.' : ''}
        </p>
      )}

      {knop}
      {c.status !== 'gepland' && <Ranglijst c={c} />}
    </li>
  )
}
