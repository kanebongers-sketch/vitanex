import { Check, LoaderCircle, Minus, Plus, X } from 'lucide-react'
import { slugVoorstel } from '@/lib/club/kern/subdomein'
import { MAX_NAAM, type AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import { useAdresCheck, type AdresStatus } from './useAdresCheck'
import { Veld } from './Veld'
import type { Invoer, Wijzig } from './types'

// Stap 2: de sportschool. Het adres volgt de naam tot de bezoeker het zelf
// aanpast; de beschikbaarheid controleren we terwijl je typt.

interface StapSportschoolProps {
  invoer: Invoer
  maxVestigingen: number
  onbeperkt: boolean
  fouten: Partial<Record<AanmeldVeld, string>>
  wijzig: Wijzig
  adresActief: boolean
}

const ICOON: Partial<Record<AdresStatus, typeof Check>> = { controleren: LoaderCircle, vrij: Check, bezet: X, ongeldig: X }

export function StapSportschool({ invoer, maxVestigingen, onbeperkt, fouten, wijzig, adresActief }: StapSportschoolProps) {
  const adres = useAdresCheck(invoer.slug)
  const Icoon = ICOON[adres.status]

  function naamGewijzigd(naam: string) {
    wijzig('sportschoolNaam', naam)
    if (!invoer.slugZelf) wijzig('slug', naam.trim() ? slugVoorstel(naam) : '')
  }

  function adresGewijzigd(ruw: string) {
    wijzig('slugZelf', true)
    wijzig('slug', ruw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40))
  }

  const aantal = invoer.aantalVestigingen
  return (
    <fieldset className="aan-fieldset">
      <legend className="aan-legend">Je sportschool</legend>
      <Veld id="sportschoolNaam" label="Naam van je sportschool" autoComplete="organization" maxLength={MAX_NAAM} value={invoer.sportschoolNaam}
        onChange={(e) => naamGewijzigd(e.target.value)} fout={fouten.sportschoolNaam} required />

      <div className="aan-veld" data-fout={fouten.aantalVestigingen ? 'ja' : undefined}>
        <span className="aan-label" id="vestigingen-label">Aantal vestigingen</span>
        <div className="aan-teller" role="group" aria-labelledby="vestigingen-label">
          <button type="button" className="aan-teller-knop" onClick={() => wijzig('aantalVestigingen', Math.max(1, aantal - 1))} disabled={aantal <= 1} aria-label="Een vestiging minder">
            <Minus size={18} aria-hidden="true" />
          </button>
          <output className="aan-teller-getal" aria-live="polite">{aantal}</output>
          <button type="button" className="aan-teller-knop" onClick={() => wijzig('aantalVestigingen', Math.min(maxVestigingen, aantal + 1))} disabled={aantal >= maxVestigingen} aria-label="Een vestiging meer">
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="aan-hint">{maxVestigingen === 1 ? 'Dit pakket is voor een vestiging.' : onbeperkt ? 'Met hoeveel vestigingen start je? Je betaalt per vestiging.' : `In dit pakket tot ${maxVestigingen}. Je betaalt per vestiging.`}</p>
        {fouten.aantalVestigingen && <p className="aan-fout" role="alert">{fouten.aantalVestigingen}</p>}
      </div>

      <Veld id="slug" label="Je eigen adres" achter=".aiyourgym.com" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={40}
        value={invoer.slug} onChange={(e) => adresGewijzigd(e.target.value)} fout={fouten.slug}
        hint={`${adresActief ? 'Hier vinden je leden en je team Club.' : 'We leggen dit adres voor je vast; tot het live gaat werk je via aiyourgym.com.'} Kleine letters, cijfers en koppeltekens.`}
        status={
          adres.melding && !fouten.slug ? (
            <p className="aan-adres" data-status={adres.status} aria-live="polite">
              {Icoon && <Icoon size={15} strokeWidth={2.4} aria-hidden="true" className={adres.status === 'controleren' ? 'aan-draai' : undefined} />}
              {adres.melding}
            </p>
          ) : null
        } />
    </fieldset>
  )
}
