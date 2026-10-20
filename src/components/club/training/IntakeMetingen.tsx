'use client'

import { berekenBmi, bmiDuiding } from '@/lib/club/training/intake'
import { leesGetal, type IntakeStaat } from './intake-staat'

interface IntakeMetingenProps {
  s: IntakeStaat
  zet: (deel: Partial<IntakeStaat>) => void
}

type Veld = 'gewicht' | 'lengte' | 'vet' | 'buik' | 'hartslag'

const VELDEN: { veld: Veld; label: string; eenheid: string; stap: string }[] = [
  { veld: 'gewicht', label: 'Gewicht', eenheid: 'kg', stap: '0.1' },
  { veld: 'lengte', label: 'Lengte', eenheid: 'cm', stap: '1' },
  { veld: 'vet', label: 'Vetpercentage', eenheid: '%', stap: '0.1' },
  { veld: 'buik', label: 'Buikomtrek', eenheid: 'cm', stap: '0.5' },
  { veld: 'hartslag', label: 'Rusthartslag', eenheid: 'per min', stap: '1' },
]

/** Metingen met een live BMI. Alle metingen zijn gezondheidsgegevens: alleen met toestemming. */
export function IntakeMetingen({ s, zet }: IntakeMetingenProps) {
  const bmi = berekenBmi(leesGetal(s.gewicht), leesGetal(s.lengte))
  if (!s.toestemming) {
    return <p className="club-hint">Metingen zijn gezondheidsgegevens. Vink eerst de toestemming van het lid aan; zonder toestemming slaat Club geen metingen op.</p>
  }
  function zetVeld(veld: Veld, waarde: string) {
    const deel: Partial<IntakeStaat> = {}
    deel[veld] = waarde
    zet(deel)
  }
  return (
    <div className="club-training-metingen">
      {VELDEN.map((v) => (
        <label key={v.veld} className="club-veld club-training-meetveld">
          <span>{v.label}</span>
          <span className="club-training-eenheid">
            <input
              className="club-invoer"
              inputMode="decimal"
              value={s[v.veld]}
              onChange={(e) => zetVeld(v.veld, e.target.value)}
              aria-describedby={`eenheid-${v.veld}`}
            />
            <small id={`eenheid-${v.veld}`}>{v.eenheid}</small>
          </span>
        </label>
      ))}
      <label className="club-veld club-training-meetveld">
        <span>Bloeddruk</span>
        <input className="club-invoer" value={s.bloeddruk} onChange={(e) => zet({ bloeddruk: e.target.value })} placeholder="120/80" inputMode="numeric" />
      </label>
      <div className="club-training-bmi" aria-live="polite">
        <span className="club-tegel-label">BMI</span>
        <span className="club-tegel-getal">{bmi ? bmi.toLocaleString('nl-NL') : '...'}</span>
        <span className="club-tegel-sub">{bmi ? bmiDuiding(bmi) : 'vul gewicht en lengte in'}</span>
      </div>
    </div>
  )
}
