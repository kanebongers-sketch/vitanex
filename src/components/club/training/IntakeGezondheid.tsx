'use client'

import { ShieldCheck } from 'lucide-react'

interface IntakeToestemmingProps {
  aan: boolean
  onZet: (aan: boolean) => void
}

/**
 * Gezondheid: bijzondere persoonsgegevens (AVG). De gezondheidsvragen van de
 * sportschool verschijnen pas na een expliciet aangevinkte toestemming. Vinkt
 * de trainer hem weer uit, dan gaat er niets van mee bij opslaan (en de server
 * weigert het ook).
 */
export function IntakeToestemming({ aan, onZet }: IntakeToestemmingProps) {
  return (
    <label className={`club-training-toestemming ${aan ? 'is-aan' : ''}`}>
      <input type="checkbox" checked={aan} onChange={(e) => onZet(e.target.checked)} />
      <span>
        <strong><ShieldCheck aria-hidden size={16} /> Het lid geeft toestemming om gezondheidsgegevens vast te leggen</strong>
        <span className="club-hint">
          Blessures, klachten, medicatie, de gezondheidsvragen, rusthartslag en bloeddruk zijn bijzondere persoonsgegevens.
          Vraag het lid hardop of dat mag. Zonder vinkje wordt hier niets van opgeslagen.
        </span>
      </span>
    </label>
  )
}
