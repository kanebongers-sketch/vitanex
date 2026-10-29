import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { AppChallenge } from '@/lib/club/challenges/app'
import { datumKort, statusTekst } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'

// Een challenge in de ledenapp: status, titel, eigen voortgang en (als de
// sportschool dat aanzet) de ranglijst met alleen voornaam en eerste letter.

interface Props {
  c: AppChallenge
  /** De knop om in of uit te schrijven, alleen bij challenges met inschrijven. */
  knop: ReactNode
}

function Ranglijst({ c }: { c: AppChallenge }) {
  const t = useTekst(CHALLENGES).app
  if (!c.ranglijst || c.ranglijst.length === 0) return null
  return (
    <ol className="club-challenges-app-ranglijst" aria-label={t.ranglijst(c.titel)}>
      {c.ranglijst.map((s, i) => (
        <li key={`${i}-${s.naam}`} className={s.isIk ? 'is-ik' : undefined} aria-current={s.isIk ? 'true' : undefined}>
          <span className="club-challenges-app-plek">{s.positie}</span>
          <span className="club-challenges-app-naam">{s.isIk ? t.jij(s.naam) : s.naam}</span>
          <span className="club-challenges-app-punten">{s.score}</span>
        </li>
      ))}
    </ol>
  )
}

export function AppChallengeKaart({ c, knop }: Props) {
  const taal = useTaal()
  const tc = useTekst(CHALLENGES)
  const t = tc.app
  const info = tc.soort[c.soort]
  const toonVoortgang = c.doetMee && c.status !== 'gepland'
  return (
    <li className={`club-challenges-app-kaart is-${c.status}${c.gehaaldOp ? ' is-gehaald' : ''}`}>
      <span className="club-challenges-app-status">{statusTekst(c.status, c.start, c.eind, c.dagenTeGaan, taal)}</span>
      <h4>{c.titel}</h4>
      {c.uitleg && <p className="club-challenges-app-uitleg">{c.uitleg}</p>}

      {toonVoortgang ? (
        <>
          <p className="club-challenges-app-stand">
            <strong>{c.score}</strong>
            <span>{t.van(c.doel, c.doel === 1 ? info.enkel : info.meer)}</span>
          </p>
          <span className="club-challenges-app-balk" role="progressbar" aria-label={t.voortgang(c.titel)} aria-valuemin={0} aria-valuemax={c.doel} aria-valuenow={Math.min(c.score, c.doel)}>
            <span style={{ transform: `scaleX(${c.fractie})` }} />
          </span>
          {c.gehaaldOp ? (
            <p className="club-challenges-app-gehaald">
              <Check size={15} aria-hidden /> {t.gehaald(datumKort(c.gehaaldOp, taal))}
            </p>
          ) : (
            c.status === 'afgelopen' && <p className="club-challenges-app-uitleg">{t.afgelopen}</p>
          )}
        </>
      ) : (
        <p className="club-challenges-app-uitleg">
          {t.doel(c.doel, c.doel === 1 ? info.enkel : info.meer)}{' '}
          {c.doetMee ? t.doetMee : c.deelname === 'inschrijven' && c.status !== 'afgelopen' ? t.inschrijven : ''}
        </p>
      )}

      {knop}
      {c.status !== 'gepland' && <Ranglijst c={c} />}
    </li>
  )
}
