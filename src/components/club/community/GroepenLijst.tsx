'use client'

import Link from 'next/link'
import { ChevronRight, Lock, Trophy, Users } from 'lucide-react'
import type { GroepKaart } from '@/lib/club/community/lezen'
import { groepHref } from '@/lib/club/community/paden'
import { useActie } from './useActie'
import { Terugkoppeling } from './Terugkoppeling'

// De groepen die een lid ziet: eerst de eigen groepen, dan open groepen om
// lid van te worden. Berichten zie je pas als je lid bent.

interface Props {
  groepen: GroepKaart[]
  /** Basispad van de community (communityBasis). */
  basis: string
  alleenLezen: boolean
}

function ledenTekst(n: number): string {
  return n === 1 ? '1 lid' : `${n} leden`
}

export function GroepenLijst({ groepen, basis, alleenLezen }: Props) {
  const { bezig, melding, doe } = useActie()
  const eigen = groepen.filter((g) => g.isLid)
  const open = groepen.filter((g) => !g.isLid)

  function kaart({ groep, isLid, leden }: GroepKaart) {
    return (
      <li key={groep.id} className={`club-cm-groep${isLid ? ' is-lid' : ''}`}>
        <Link href={groepHref(basis, groep.id)} className="club-cm-groep-link" prefetch={false}>
          <span className="club-cm-groep-icoon" aria-hidden>
            {groep.toegang === 'besloten' ? <Lock size={20} /> : <Users size={20} />}
          </span>
          <span className="club-cm-groep-tekst">
            <strong>{groep.naam}</strong>
            <span className="club-cm-groep-meta">
              {ledenTekst(leden)}
              {groep.challengeId && (
                <>
                  <span aria-hidden> · </span>
                  <Trophy size={13} aria-hidden /> challenge
                </>
              )}
            </span>
          </span>
          <ChevronRight size={20} aria-hidden className="club-cm-groep-pijl" />
        </Link>
        {!isLid && !alleenLezen && (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-cm-groep-mee" disabled={bezig === groep.id} onClick={() => void doe(groep.id, `/api/club/lid/community/groepen/${encodeURIComponent(groep.id)}`, 'POST', undefined, `Je bent lid van ${groep.naam}.`)}>
            {bezig === groep.id ? 'Even geduld...' : 'Word lid'}
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="club-cm-groepen">
      <Terugkoppeling melding={melding} />
      <section aria-labelledby="cm-eigen-kop" className="club-cm-sectie">
        <h3 id="cm-eigen-kop" className="club-lidapp-label">
          Jouw groepen
        </h3>
        {eigen.length > 0 ? <ul className="club-cm-groeplijst">{eigen.map(kaart)}</ul> : <p className="club-cm-leeg">Je zit nog in geen enkele groep. Kies hieronder een groep die bij je past.</p>}
      </section>
      {open.length > 0 && (
        <section aria-labelledby="cm-open-kop" className="club-cm-sectie">
          <h3 id="cm-open-kop" className="club-lidapp-label">
            Groepen om bij te gaan
          </h3>
          <ul className="club-cm-groeplijst">{open.map(kaart)}</ul>
        </section>
      )}
    </div>
  )
}
