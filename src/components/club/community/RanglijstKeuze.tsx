'use client'

import { useState } from 'react'
import { useActie } from './useActie'
import { Terugkoppeling } from './Terugkoppeling'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// Het lid kiest of het op de ranglijsten van groepen staat. Standaard uit
// (privacy by default): pas na deze keuze zien groepsgenoten je voornaam, de
// eerste letter van je achternaam en je score. Je eigen score zie je altijd.

interface Props {
  aan: boolean
  alleenLezen: boolean
}

export function RanglijstKeuze({ aan: begin, alleenLezen }: Props) {
  const [aan, setAan] = useState(begin)
  const { bezig, melding, doe } = useActie()
  const t = useTekst(COMMUNITY).keuze

  async function wissel() {
    const nieuw = !aan
    setAan(nieuw)
    const ok = await doe('ranglijst', '/api/club/lid/community/voorkeur', 'PATCH', { opRanglijst: nieuw }, nieuw ? t.aan : t.uit)
    if (!ok) setAan(!nieuw)
  }

  return (
    <section className="club-cm-keuze" aria-labelledby="cm-keuze-kop">
      <div className="club-cm-keuze-rij">
        <div>
          <h3 id="cm-keuze-kop" className="club-cm-keuze-kop">
            {t.titel}
          </h3>
          <p id="cm-keuze-uitleg" className="club-cm-keuze-uitleg">
            {t.uitleg}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={aan}
          aria-labelledby="cm-keuze-kop"
          aria-describedby="cm-keuze-uitleg"
          className="club-cm-schakelaar"
          disabled={alleenLezen || bezig === 'ranglijst'}
          onClick={() => void wissel()}
        >
          <span aria-hidden />
        </button>
      </div>
      <Terugkoppeling melding={melding} />
    </section>
  )
}
