'use client'

import { Leaf } from 'lucide-react'
import { BOODSCHAPPEN, VOEDING_TIPS } from '@/lib/lifeos/programma/programma-data'

// Boodschappen-weergave: de weeklijst uit het schema, plus Kane's eigen notities.

function hoeveelheidTekst(hoeveelheid: string | null, eenheid: string | null): string {
  // Zonder hoeveelheid is een losse eenheid ("gram") betekenisloos — dan niets
  // tonen i.p.v. een verzonnen aantal. De bron liet die cellen bewust leeg.
  if (!hoeveelheid) return ''
  return eenheid ? `${hoeveelheid} ${eenheid}` : hoeveelheid
}

export function BoodschappenWeergave() {
  return (
    <div>
      <div className="prog-sectie">
        <div className="prog-sectie-kop">
          <h2 className="prog-sectie-titel">Weekboodschappen</h2>
          <span className="prog-sectie-tag">{BOODSCHAPPEN.length} items</span>
        </div>
        <ul className="prog-boodschap">
          {BOODSCHAPPEN.map((b) => (
            <li key={b.voedingsmiddel}>
              <span className="prog-boodschap-naam">{b.voedingsmiddel}</span>
              <span className="prog-boodschap-hoev">{hoeveelheidTekst(b.hoeveelheid, b.eenheid)}</span>
            </li>
          ))}
        </ul>
      </div>

      {VOEDING_TIPS.length > 0 && (
        <ul className="prog-tips" aria-label="Tips bij het schema">
          {VOEDING_TIPS.map((tip) => (
            <li key={tip} className="prog-tip">
              <span className="prog-tip-ico">
                <Leaf size={15} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
