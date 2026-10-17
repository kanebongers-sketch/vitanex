'use client'

import { Plus, X } from 'lucide-react'
import { MAX_ADVIES, MAX_ADVIEZEN } from '@/lib/club/voeding/model'

// Vrije adviezen als losse regels, met een paar snelle voorbeelden.

const VOORBEELDEN = [
  'Elke maaltijd een eiwitbron',
  'De helft van je bord groente',
  'Drink water bij elke maaltijd',
  'Kies vaker volkoren',
  'Plan je tussendoortjes',
  'Eet rustig en zonder scherm',
]

interface AdviezenVeldProps {
  adviezen: string[]
  onWijzig: (adviezen: string[]) => void
}

export function AdviezenVeld({ adviezen, onWijzig }: AdviezenVeldProps) {
  const vol = adviezen.length >= MAX_ADVIEZEN
  const zet = (i: number, tekst: string) => onWijzig(adviezen.map((a, j) => (j === i ? tekst : a)))
  const weg = (i: number) => onWijzig(adviezen.filter((_, j) => j !== i))
  const magNieuw = adviezen.length === 0 || adviezen[adviezen.length - 1].trim() !== ''
  const snel = VOORBEELDEN.filter((v) => !adviezen.includes(v))

  return (
    <div className="club-voeding-blok">
      {adviezen.length > 0 && (
        <ol className="club-voeding-regels">
          {adviezen.map((a, i) => (
            <li key={i}>
              <input className="club-invoer" value={a} maxLength={MAX_ADVIES} aria-label={`Advies ${i + 1}`} onChange={(e) => zet(i, e.target.value)} />
              <button type="button" className="club-voeding-weg" onClick={() => weg(i)} aria-label={`Advies ${i + 1} weghalen`}>
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="club-voeding-acties">
        <button type="button" className="club-knop club-knop--klein" disabled={vol || !magNieuw} onClick={() => onWijzig([...adviezen, ''])}>
          <Plus size={14} aria-hidden /> Advies
        </button>
        {vol && <span className="club-voeding-hint">Hoogstens {MAX_ADVIEZEN} adviezen.</span>}
      </div>
      {!vol && snel.length > 0 && (
        <div className="club-voeding-snel" role="group" aria-label="Snel een advies toevoegen">
          {snel.map((v) => (
            <button key={v} type="button" onClick={() => onWijzig([...adviezen.filter((a) => a.trim()), v])}>
              + {v}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
