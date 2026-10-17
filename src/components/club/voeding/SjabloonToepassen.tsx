'use client'

import { useId, useState } from 'react'
import { Layers } from 'lucide-react'
import type { VoedingSjabloon } from '@/lib/club/voeding/model'
import { DOEL_INFO } from '@/lib/club/voeding/rekenhulp'

// Kies een sjabloon van de sportschool en vul het plan ermee in. Er wordt
// niets opgeslagen: de trainer ziet het resultaat en bewaart zelf.

interface SjabloonToepassenProps {
  sjablonen: readonly VoedingSjabloon[]
  onToepassen: (s: VoedingSjabloon) => void
  beheerHref: string
}

export function SjabloonToepassen({ sjablonen, onToepassen, beheerHref }: SjabloonToepassenProps) {
  const id = useId()
  const [keuze, setKeuze] = useState(sjablonen[0]?.id ?? '')
  const gekozen = sjablonen.find((s) => s.id === keuze)

  if (sjablonen.length === 0) {
    return (
      <p className="club-voeding-hint">
        Nog geen sjablonen. <a href={beheerHref}>Maak er een</a> om plannen sneller in te vullen.
      </p>
    )
  }
  return (
    <div className="club-voeding-blok">
      <label className="club-label" htmlFor={`${id}-sjabloon`}>
        Sjabloon
      </label>
      <div className="club-voeding-acties">
        <select id={`${id}-sjabloon`} className="club-invoer club-voeding-kies" value={keuze} onChange={(e) => setKeuze(e.target.value)}>
          {sjablonen.map((s) => (
            <option key={s.id} value={s.id}>
              {s.naam}
              {s.doel ? ` (${DOEL_INFO[s.doel].label.toLowerCase()})` : ''}
            </option>
          ))}
        </select>
        <button type="button" className="club-knop club-knop--klein" disabled={!gekozen} onClick={() => gekozen && onToepassen(gekozen)}>
          <Layers size={14} aria-hidden /> Toepassen
        </button>
      </div>
      {gekozen?.omschrijving && <p className="club-voeding-hint">{gekozen.omschrijving}</p>}
    </div>
  )
}
