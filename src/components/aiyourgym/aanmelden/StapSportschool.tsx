import { Check, LoaderCircle, Minus, Plus, X } from 'lucide-react'
import { adresVeld, slugVoorstel } from '@/lib/club/kern/subdomein'
import { MAX_NAAM, type AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
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
  /** Staan de subdomeinen aan? Dan naam.aiyourgym.com, anders aiyourgym.com/naam. */
  subdomeinen: boolean
  wijzig: Wijzig
}

const ICOON: Partial<Record<AdresStatus, typeof Check>> = { controleren: LoaderCircle, vrij: Check, bezet: X, ongeldig: X }

export function StapSportschool({ invoer, maxVestigingen, onbeperkt, fouten, wijzig, subdomeinen }: StapSportschoolProps) {
  const t = useTekst(AANMELD_FORMULIER)
  const veld = adresVeld(subdomeinen)
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
      <legend className="aan-legend">{t.jeSportschool}</legend>
      <Veld id="sportschoolNaam" label={t.naamSportschool} autoComplete="organization" maxLength={MAX_NAAM} value={invoer.sportschoolNaam}
        onChange={(e) => naamGewijzigd(e.target.value)} fout={fouten.sportschoolNaam} required />

      <div className="aan-veld" data-fout={fouten.aantalVestigingen ? 'ja' : undefined}>
        <span className="aan-label" id="vestigingen-label">{t.aantalVestigingen}</span>
        <div className="aan-teller" role="group" aria-labelledby="vestigingen-label">
          <button type="button" className="aan-teller-knop" onClick={() => wijzig('aantalVestigingen', Math.max(1, aantal - 1))} disabled={aantal <= 1} aria-label={t.minder}>
            <Minus size={18} aria-hidden="true" />
          </button>
          <output className="aan-teller-getal" aria-live="polite">{aantal}</output>
          <button type="button" className="aan-teller-knop" onClick={() => wijzig('aantalVestigingen', Math.min(maxVestigingen, aantal + 1))} disabled={aantal >= maxVestigingen} aria-label={t.meer}>
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="aan-hint">{maxVestigingen === 1 ? t.hintEen : onbeperkt ? t.hintOnbeperkt : t.hintTot(maxVestigingen)}</p>
        {fouten.aantalVestigingen && <p className="aan-fout" role="alert">{fouten.aantalVestigingen}</p>}
      </div>

      <Veld id="slug" label={t.eigenAdres} voor={veld.voor ?? undefined} achter={veld.achter ?? undefined} inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={40}
        value={invoer.slug} onChange={(e) => adresGewijzigd(e.target.value)} fout={fouten.slug}
        hint={t.adresHint}
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
