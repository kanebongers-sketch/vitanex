'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { BetaalAccount } from '@/lib/club/betalen/opslag'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

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
  const t = useTekst(BETALEN).stripe

  function ververs() {
    start(async () => {
      setFout(null)
      const res = await fetch(API, { cache: 'no-store' }).catch(() => null)
      if (!res?.ok) setFout(t.ophalenFout)
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
      if (typeof url !== 'string') return setFout(uit.ok ? t.geenLink : uit.fout)
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
            <div><strong>{t.koppelen}</strong><span>{t.koppelenUitleg}</span></div>
          </li>
          <li className="club-betalen-stap" data-klaar={account.gegevensCompleet}>
            <div><strong>{t.gegevens}</strong><span>{t.gegevensUitleg}</span></div>
          </li>
          <li className="club-betalen-stap" data-klaar={account.chargesAan}>
            <div><strong>{t.open}</strong><span>{t.openUitleg}{account.chargesAan && !account.uitbetalenAan ? t.uitbetalenDicht : ''}</span></div>
          </li>
          <li className="club-betalen-stap" data-klaar={account.betalenAan}>
            <div><strong>{t.kopenAan}</strong><span>{t.kopenAanUitleg}</span></div>
          </li>
        </ol>
        <div className="club-betalen-knoppen">
          {!sleutelGezet ? (
            <p className="club-hint">{t.nietIngesteld}</p>
          ) : (
            <>
              {!account.chargesAan && (
                <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => naarStripe('onboarding')}>
                  {gekoppeld ? t.verder : t.koppelen} <ExternalLink size={15} aria-hidden />
                </button>
              )}
              {gekoppeld && (
                <button type="button" className="club-knop" disabled={bezig} onClick={ververs}>
                  <RefreshCw size={15} aria-hidden /> {t.verversen}
                </button>
              )}
              {account.gegevensCompleet && (
                <button type="button" className="club-knop" disabled={bezig} onClick={() => naarStripe('dashboard')}>
                  {t.uitbetalingen} <ExternalLink size={15} aria-hidden />
                </button>
              )}
              {account.chargesAan && (
                <button type="button" className={`club-knop ${account.betalenAan ? '' : 'club-knop--primair'}`} disabled={bezig} onClick={() => schakel(!account.betalenAan)} aria-pressed={account.betalenAan}>
                  {account.betalenAan ? t.uitzetten : t.aanzetten}
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
