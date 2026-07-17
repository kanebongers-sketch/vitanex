'use client'

import { useState } from 'react'
import { Archive, Check, PenLine } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import type { TriageMailJson } from '@/lib/lifeos/inbox/inbox'
import type { HaalUitkomst } from '@/lib/lifeos/api/http'
import type { MailActieSoort } from './mail-acties'

// De drie dingen die je met een mail kunt doen zonder Gmail te openen. Elke knop
// is één klik van Kane — daar zit geen model tussen, en dat is het hele ontwerp:
// het brein stelt vóór (de suggestie-knop hierboven), Kane beslist.
//
// Presentationeel op één ding na: de bezig/klaar/fout-staat is lokaal aan déze
// mail. Er staan er meerdere op het scherm en een fout bij de aanmaning hoort
// niet naast de nieuwsbrief te verschijnen. De fetches doet de container.
//
// Let op wat er NIET staat: geen "verstuur". Vita schrijft een concept, jij
// verstuurt het. Zie de kop van `lib/lifeos/inbox/gmail.ts`.

interface MailActiesProps {
  mail: TriageMailJson
  onActie: (soort: MailActieSoort, mail: TriageMailJson) => Promise<HaalUitkomst<true>>
  onConcept: (mail: TriageMailJson) => Promise<HaalUitkomst<true>>
}

type Staat =
  | { fase: 'rust' }
  | { fase: 'bezig'; wat: string }
  | { fase: 'klaar'; bericht: string }
  | { fase: 'fout'; bericht: string }

export function MailActies({ mail, onActie, onConcept }: MailActiesProps) {
  const [staat, setStaat] = useState<Staat>({ fase: 'rust' })

  const bezig = staat.fase === 'bezig'

  async function doe(
    wat: string,
    klaarBericht: string,
    roep: () => Promise<HaalUitkomst<true>>,
  ): Promise<void> {
    if (bezig) return
    setStaat({ fase: 'bezig', wat })
    const uitkomst = await roep()
    setStaat(
      uitkomst.ok ? { fase: 'klaar', bericht: klaarBericht } : { fase: 'fout', bericht: uitkomst.fout },
    )
  }

  return (
    <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Knop
          onClick={() =>
            void doe('concept', 'Concept staat klaar in je Gmail-concepten.', () => onConcept(mail))
          }
          disabled={bezig}
        >
          <PenLine size={13} strokeWidth={2.2} aria-hidden="true" />
          {staat.fase === 'bezig' && staat.wat === 'concept' ? 'Schrijft…' : 'Concept-antwoord'}
        </Knop>

        <Knop
          onClick={() =>
            void doe('gelezen', 'Gemarkeerd als gelezen.', () => onActie('markeer_gelezen', mail))
          }
          disabled={bezig}
        >
          <Check size={13} strokeWidth={2.2} aria-hidden="true" />
          Gelezen
        </Knop>

        <Knop
          onClick={() => void doe('archief', 'Gearchiveerd.', () => onActie('archiveer', mail))}
          disabled={bezig}
        >
          <Archive size={13} strokeWidth={2.2} aria-hidden="true" />
          Archiveer
        </Knop>
      </div>

      {/* Het concept is gebaseerd op afzender + onderwerp — wij lezen de inhoud
          van je mail niet. Dat staat er niet als disclaimer maar als gebruiks-
          aanwijzing: het is een opening, geen antwoord. Zie inbox/concept.ts. */}
      {staat.fase === 'klaar' ? (
        <p role="status" style={{ fontSize: 11, color: 'var(--brand)', margin: 0 }}>
          {staat.bericht}
        </p>
      ) : null}

      {staat.fase === 'fout' ? (
        <p role="alert" style={{ fontSize: 11, color: 'var(--status-laag)', margin: 0, lineHeight: 1.5 }}>
          {staat.bericht}
        </p>
      ) : null}
    </div>
  )
}
