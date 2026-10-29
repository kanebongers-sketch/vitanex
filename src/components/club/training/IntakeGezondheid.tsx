'use client'

import { ShieldCheck } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'

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
  const t = useTekst(INTAKE).toestemming
  return (
    <label className={`club-training-toestemming ${aan ? 'is-aan' : ''}`}>
      <input type="checkbox" checked={aan} onChange={(e) => onZet(e.target.checked)} />
      <span>
        <strong><ShieldCheck aria-hidden size={16} /> {t.titel}</strong>
        <span className="club-hint">{t.uitleg}</span>
      </span>
    </label>
  )
}
