'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { BetaalAccount } from '@/lib/club/betalen/opslag'

// De stappen naar betalen in de ledenapp: Stripe koppelen (onboarding van
// Stripe, op naam van de sportschool), gegevens compleet, betalingen open,
// en dan zelf aanzetten. Na terugkomen van Stripe wordt de stand ververst.

const API = '/api/club/betalen/connect'

interface Props {
  account: BetaalAccount
  /** Is CLUB_STRIPE_SECRET_KEY gezet? Zonder kan er niets gekoppeld worden. */
  sleutelGezet: boolean
  /** Net terug van de onboarding: meteen de stand ophalen. */
  verversen: boolean
}

export function StripeKaart({ account, sleutelGezet, verversen }: Props) {
  const router = useRouter()
  const [bezig, start] = useTransition()
  const [fout, setFout] = useState<string | null>(null)

  function ververs() {
    start(async () => {
      setFout(null)
      const res = await fetch(API, { cache: 'no-store' }).catch(() => null)
      if (!res?.ok) setFout('De stand bij Stripe kon niet worden opgehaald. Probeer het zo opnieuw.')
      router.refresh()
    })
  }

  useEffect(() => {
    if (verversen) ververs()
    // Alleen bij het laden na terugkomen van Stripe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verversen])

  function naarStripe(actie: 'onboarding' | 'dashboard') {
    start(async () => {
      setFout(null)
      const uit = await stuur(API, 'POST', { actie })
      const url = uit.ok ? (uit.data as { url?: unknown } | null)?.url : null
      if (typeof url !== 'string') return setFout(uit.ok ? 'Stripe gaf geen link terug.' : uit.fout)
      if (actie === 'dashboard') window.open(url, '_blank', 'noopener,noreferrer')
      else window.location.assign(url)
    })
  }

  function schakel(aan: boolean) {
    start(async () => {
      setFout(null)
      const uit = await stuur(API, 'PATCH', { betalenAan: aan })
      if (!uit.ok) return setFout(uit.fout)
      router.refresh()
    })
  }

  const gekoppeld = account.stripeAccountId !== null
  return (
    <section aria-labelledby="betalen-stripe-kop">
      <h2 id="betalen-stripe-kop" className="club-betalen-kop">Stripe</h2>
      <div className="club-betalen-stripe">
        <ol className="club-betalen-stappen">
          <li className="club-betalen-stap" data-klaar={gekoppeld}>
            <div><strong>Stripe koppelen</strong><span>Je sportschool krijgt een eigen Stripe-account. Het geld van leden komt rechtstreeks op jouw rekening.</span></div>
          </li>
          <li className="club-betalen-stap" data-klaar={account.gegevensCompleet}>
            <div><strong>Gegevens invullen bij Stripe</strong><span>Bedrijf, KvK, rekeningnummer en identiteit. Dat doe je op de pagina van Stripe, niet bij ons.</span></div>
          </li>
          <li className="club-betalen-stap" data-klaar={account.chargesAan}>
            <div><strong>Betalingen open</strong><span>Stripe zet betalingen open zodra je gegevens zijn gecontroleerd.{account.chargesAan && !account.uitbetalenAan ? ' Uitbetalen staat nog dicht.' : ''}</span></div>
          </li>
          <li className="club-betalen-stap" data-klaar={account.betalenAan}>
            <div><strong>Kopen in de ledenapp aan</strong><span>Leden zien je producten onder Kopen en betalen met iDEAL of kaart.</span></div>
          </li>
        </ol>
        <div className="club-betalen-knoppen">
          {!sleutelGezet ? (
            <p className="club-hint">Betalen is nog niet ingesteld door AI Your Gym.</p>
          ) : (
            <>
              {!account.chargesAan && (
                <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => naarStripe('onboarding')}>
                  {gekoppeld ? 'Verder bij Stripe' : 'Stripe koppelen'} <ExternalLink size={15} aria-hidden />
                </button>
              )}
              {gekoppeld && (
                <button type="button" className="club-knop" disabled={bezig} onClick={ververs}>
                  <RefreshCw size={15} aria-hidden /> Stand verversen
                </button>
              )}
              {account.gegevensCompleet && (
                <button type="button" className="club-knop" disabled={bezig} onClick={() => naarStripe('dashboard')}>
                  Uitbetalingen bij Stripe <ExternalLink size={15} aria-hidden />
                </button>
              )}
              {account.chargesAan && (
                <button type="button" className={`club-knop ${account.betalenAan ? '' : 'club-knop--primair'}`} disabled={bezig} onClick={() => schakel(!account.betalenAan)} aria-pressed={account.betalenAan}>
                  {account.betalenAan ? 'Kopen in de app uitzetten' : 'Kopen in de app aanzetten'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div aria-live="assertive">{fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}</div>
    </section>
  )
}
