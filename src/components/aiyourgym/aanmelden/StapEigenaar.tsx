import { MAX_EMAIL, MAX_NAAM, type AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import { Veld } from './Veld'
import type { Invoer, Wijzig } from './types'

// Stap 3: de eigenaar. Die krijgt de persoonlijke inloglink naar het portaal.

interface StapEigenaarProps {
  invoer: Invoer
  fouten: Partial<Record<AanmeldVeld, string>>
  wijzig: Wijzig
}

export function StapEigenaar({ invoer, fouten, wijzig }: StapEigenaarProps) {
  return (
    <fieldset className="aan-fieldset">
      <legend className="aan-legend">Over jou</legend>
      <p className="aan-uitleg">Als eigenaar stel je alles in: huisstijl, vestigingen, medewerkers en rechten.</p>
      <Veld id="eigenaarNaam" label="Je naam" autoComplete="name" maxLength={MAX_NAAM} value={invoer.eigenaarNaam}
        onChange={(e) => wijzig('eigenaarNaam', e.target.value)} fout={fouten.eigenaarNaam} required />
      <div className="aan-rij">
        <Veld id="eigenaarEmail" label="E-mailadres" type="email" autoComplete="email" inputMode="email" maxLength={MAX_EMAIL} value={invoer.eigenaarEmail}
          onChange={(e) => wijzig('eigenaarEmail', e.target.value)} fout={fouten.eigenaarEmail} required />
        <Veld id="eigenaarTelefoon" label="Telefoonnummer" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} value={invoer.eigenaarTelefoon}
          onChange={(e) => wijzig('eigenaarTelefoon', e.target.value)} fout={fouten.eigenaarTelefoon} required />
      </div>
    </fieldset>
  )
}
