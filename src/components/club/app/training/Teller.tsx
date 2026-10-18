'use client'

import { Minus, Plus } from 'lucide-react'
import { stapGrootte, stapWaarde } from '@/lib/club/app/training-modus'

interface TellerProps {
  soort: 'kg' | 'herh' | 'tijd'
  /** Zichtbaar label boven het veld: "Kg", "Herhalingen", "Seconden". */
  label: string
  /** Voor de screenreader: "Set 2 Back squat". */
  context: string
  waarde: string
  /** Grijs in het veld als het leeg is (de vorige keer of het doel). */
  voorstel: string
  onWaarde: (waarde: string) => void
}

const MAX = { kg: 1000, herh: 300, tijd: 3600 } as const
const EENHEID = { kg: 'kilo', herh: 'herhalingen', tijd: 'seconden' } as const

/** Een getal met grote min- en plusknoppen voor natte handen; typen kan ook. */
export function Teller({ soort, label, context, waarde, voorstel, onWaarde }: TellerProps) {
  const stap = stapGrootte(soort, waarde || voorstel)
  const id = `teller-${soort}-${context.replace(/\W+/g, '-')}`
  const toonStap = String(stap).replace('.', ',')
  return (
    <div className="club-tm-teller">
      <label htmlFor={id}>{label}</label>
      <div className="club-tm-teller-rij">
        <button
          type="button" className="club-tm-teller-knop" onClick={() => onWaarde(stapWaarde(waarde, voorstel, -stap, MAX[soort]))}
          aria-label={`${toonStap} ${EENHEID[soort]} minder, ${context}`}
        >
          <Minus aria-hidden size={22} strokeWidth={2.6} />
        </button>
        <input
          id={id} className="club-tm-teller-veld" inputMode={soort === 'kg' ? 'decimal' : 'numeric'} enterKeyHint="done" autoComplete="off"
          value={waarde} placeholder={voorstel || '0'} onChange={(e) => onWaarde(e.target.value.replace(/[^\d.,]/g, '').slice(0, 7))}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button" className="club-tm-teller-knop" onClick={() => onWaarde(stapWaarde(waarde, voorstel, stap, MAX[soort]))}
          aria-label={`${toonStap} ${EENHEID[soort]} meer, ${context}`}
        >
          <Plus aria-hidden size={22} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}
