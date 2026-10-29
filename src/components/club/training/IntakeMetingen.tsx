'use client'

import { berekenBmi, bmiDuiding } from '@/lib/club/training/intake'
import { leesGetal, type IntakeStaat } from './intake-staat'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'

interface IntakeMetingenProps {
  s: IntakeStaat
  zet: (deel: Partial<IntakeStaat>) => void
}

type Veld = 'gewicht' | 'lengte' | 'vet' | 'buik' | 'hartslag'

const VELDEN: { veld: Veld; eenheid: string | null; stap: string }[] = [
  { veld: 'gewicht', eenheid: 'kg', stap: '0.1' },
  { veld: 'lengte', eenheid: 'cm', stap: '1' },
  { veld: 'vet', eenheid: '%', stap: '0.1' },
  { veld: 'buik', eenheid: 'cm', stap: '0.5' },
  { veld: 'hartslag', eenheid: null, stap: '1' },
]

/** Metingen met een live BMI. Alle metingen zijn gezondheidsgegevens: alleen met toestemming. */
export function IntakeMetingen({ s, zet }: IntakeMetingenProps) {
  const bmi = berekenBmi(leesGetal(s.gewicht), leesGetal(s.lengte))
  const taal = useTaal()
  const t = useTekst(INTAKE).metingen
  if (!s.toestemming) {
    return <p className="club-hint">{t.zonder}</p>
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
          <span>{t[v.veld]}</span>
          <span className="club-training-eenheid">
            <input
              className="club-invoer"
              inputMode="decimal"
              value={s[v.veld]}
              onChange={(e) => zetVeld(v.veld, e.target.value)}
              aria-describedby={`eenheid-${v.veld}`}
            />
            <small id={`eenheid-${v.veld}`}>{v.eenheid ?? t.perMinuut}</small>
          </span>
        </label>
      ))}
      <label className="club-veld club-training-meetveld">
        <span>{t.bloeddruk}</span>
        <input className="club-invoer" value={s.bloeddruk} onChange={(e) => zet({ bloeddruk: e.target.value })} placeholder="120/80" inputMode="numeric" />
      </label>
      <div className="club-training-bmi" aria-live="polite">
        <span className="club-tegel-label">BMI</span>
        <span className="club-tegel-getal">{bmi ? formatGetal(bmi, taal) : '...'}</span>
        <span className="club-tegel-sub">{bmi ? bmiDuiding(bmi, taal) : t.bmiLeeg}</span>
      </div>
    </div>
  )
}
