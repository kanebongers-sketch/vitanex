import { MAX_EMAIL, MAX_NAAM, type AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import { MAX_LENGTE, MIN_LENGTE } from '@/lib/club/kern/wachtwoord-regels'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import { Veld } from './Veld'
import type { Invoer, Wijzig } from './types'

// Stap 3: de eigenaar. Die logt straks in met dit e-mailadres en het wachtwoord dat hij hier kiest.

interface StapEigenaarProps {
  invoer: Invoer
  fouten: Partial<Record<AanmeldVeld, string>>
  wijzig: Wijzig
}

export function StapEigenaar({ invoer, fouten, wijzig }: StapEigenaarProps) {
  const t = useTekst(AANMELD_FORMULIER)
  return (
    <fieldset className="aan-fieldset">
      <legend className="aan-legend">{t.overJou}</legend>
      <p className="aan-uitleg">{t.eigenaarUitleg}</p>
      <Veld id="eigenaarNaam" label={t.jeNaam} autoComplete="name" maxLength={MAX_NAAM} value={invoer.eigenaarNaam}
        onChange={(e) => wijzig('eigenaarNaam', e.target.value)} fout={fouten.eigenaarNaam} required />
      <div className="aan-rij">
        <Veld id="eigenaarEmail" label={t.email} type="email" autoComplete="email" inputMode="email" maxLength={MAX_EMAIL} value={invoer.eigenaarEmail}
          onChange={(e) => wijzig('eigenaarEmail', e.target.value)} fout={fouten.eigenaarEmail} required />
        <Veld id="eigenaarTelefoon" label={t.telefoon} type="tel" autoComplete="tel" inputMode="tel" maxLength={20} value={invoer.eigenaarTelefoon}
          onChange={(e) => wijzig('eigenaarTelefoon', e.target.value)} fout={fouten.eigenaarTelefoon} required
          hint={t.telefoonHint} />
      </div>
      <div className="aan-rij">
        <Veld id="wachtwoord" label={t.wachtwoord} type="password" autoComplete="new-password" minLength={MIN_LENGTE} maxLength={MAX_LENGTE}
          value={invoer.wachtwoord} onChange={(e) => wijzig('wachtwoord', e.target.value)} fout={fouten.wachtwoord} required
          hint={t.wachtwoordHint(MIN_LENGTE)} />
        <Veld id="wachtwoordHerhaal" label={t.herhaal} type="password" autoComplete="new-password" maxLength={MAX_LENGTE}
          value={invoer.wachtwoordHerhaal} onChange={(e) => wijzig('wachtwoordHerhaal', e.target.value)} fout={fouten.wachtwoordHerhaal} required />
      </div>
    </fieldset>
  )
}
