'use client'

import { useCallback, useState } from 'react'
import { CalendarPlus, Check, ListPlus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import type { HaalUitkomst } from '@/lib/lifeos/api/http'
import type { ActieSuggestie } from './suggestie-actie'

// ─── FUNCTIE 2 — de knop die een mail-suggestie omzet in een taak/afspraak ───
// Presentationeel op één na: de enige state is de eigen fase van deze knop (net
// als `Regel` z'n hover en `Knop` z'n indruk-staat). De aanmaak-call zelf komt
// als `onMaak` van boven, zodat dit zonder netwerk te bekijken is en de
// container de enige plek met een fetch blijft.
//
// De klik ís de bevestiging. Niets gebeurt vanzelf — de mail-classificatie kan
// ernaast zitten, dus pas een bewuste tik maakt de taak of afspraak echt aan.
// Daarna: een korte, rustige bevestiging. Mislukt het, dan zeggen we dat
// zichtbaar en blijft de knop staan om opnieuw te proberen. Nooit stil falen.

interface SuggestieActieProps {
  actie: ActieSuggestie
  onMaak: (actie: ActieSuggestie) => Promise<HaalUitkomst<true>>
}

type Fase =
  | { naam: 'gereed' }
  | { naam: 'bezig' }
  | { naam: 'gedaan' }
  | { naam: 'mislukt'; bericht: string }

interface Woordenschat {
  Icoon: typeof ListPlus
  knop: string
  bezig: string
  gedaan: string
  /** Toegankelijke naam: bevat het zichtbare woord én de titel als context. */
  aria: (titel: string) => string
}

const WOORDEN: Record<ActieSuggestie['soort'], Woordenschat> = {
  taak: {
    Icoon: ListPlus,
    knop: 'Taak',
    bezig: 'Taak maken…',
    gedaan: 'Taak gemaakt',
    aria: (titel) => `Taak maken van deze e-mail: ${titel}`,
  },
  agenda: {
    Icoon: CalendarPlus,
    knop: 'Agenda',
    bezig: 'Afspraak maken…',
    gedaan: 'Afspraak gemaakt',
    aria: (titel) => `Agenda-afspraak maken van deze e-mail: ${titel}`,
  },
}

export function SuggestieActie({ actie, onMaak }: SuggestieActieProps) {
  const [fase, setFase] = useState<Fase>({ naam: 'gereed' })
  const woorden = WOORDEN[actie.soort]

  const maak = useCallback(async () => {
    setFase({ naam: 'bezig' })
    const uitkomst = await onMaak(actie)
    setFase(
      uitkomst.ok
        ? { naam: 'gedaan' }
        : { naam: 'mislukt', bericht: uitkomst.fout },
    )
  }, [actie, onMaak])

  if (fase.naam === 'gedaan') {
    return (
      <p
        role="status"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--status-goed)',
        }}
      >
        <Check size={13} strokeWidth={2.6} aria-hidden="true" />
        {woorden.gedaan}
      </p>
    )
  }

  const { Icoon } = woorden
  const bezig = fase.naam === 'bezig'

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <Knop onClick={() => void maak()} disabled={bezig} aria-label={woorden.aria(actie.titel)}>
        <Icoon size={13} strokeWidth={2.2} aria-hidden="true" />
        <span aria-hidden="true">→ </span>
        {bezig ? woorden.bezig : woorden.knop}
      </Knop>

      {fase.naam === 'mislukt' ? (
        <span role="alert" style={{ fontSize: 11.5, color: 'var(--status-laag)', lineHeight: 1.4 }}>
          {fase.bericht} Niet aangemaakt — probeer opnieuw.
        </span>
      ) : null}
    </div>
  )
}
