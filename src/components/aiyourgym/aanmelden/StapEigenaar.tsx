import { MAX_EMAIL, MAX_NAAM, type AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import { MAX_LENGTE, MIN_LENGTE } from '@/lib/club/kern/wachtwoord-regels'
import { Veld } from './Veld'
import type { Invoer, Wijzig } from './types'

// Stap 3: de eigenaar. Die logt straks in met dit e-mailadres en het wachtwoord dat hij hier kiest.

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
          onChange={(e) => wijzig('eigenaarTelefoon', e.target.value)} fout={fouten.eigenaarTelefoon} required
          hint="Voor als er iets is met je aanmelding of bij het inrichten." />
      </div>
      <div className="aan-rij">
        <Veld id="wachtwoord" label="Kies een wachtwoord" type="password" autoComplete="new-password" minLength={MIN_LENGTE} maxLength={MAX_LENGTE}
          value={invoer.wachtwoord} onChange={(e) => wijzig('wachtwoord', e.target.value)} fout={fouten.wachtwoord} required
          hint={`Hiermee log je in op AI Your Gym. Minstens ${MIN_LENGTE} tekens; een zin van 16 tekens of meer is het sterkst.`} />
        <Veld id="wachtwoordHerhaal" label="Herhaal je wachtwoord" type="password" autoComplete="new-password" maxLength={MAX_LENGTE}
          value={invoer.wachtwoordHerhaal} onChange={(e) => wijzig('wachtwoordHerhaal', e.target.value)} fout={fouten.wachtwoordHerhaal} required />
      </div>
    </fieldset>
  )
}
