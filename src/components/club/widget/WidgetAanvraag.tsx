'use client'

import { useId, useState, type FormEvent } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { dagLabel, type WidgetLes } from '@/lib/club/widget/rooster'

// Stap 2 van de widget: een proefles (de gekozen les) of een kennismaking
// aanvragen. Wordt een lead in Club; de sportschool neemt contact op en plant
// de proefles in. Het veld "website" is een honeypot: onzichtbaar voor mensen.

interface WidgetAanvraagProps {
  les: WidgetLes | null
  organisatie: string
  apiPad: string
  privacyUrl: string | null
  voorbeeld: boolean
  onTerug: () => void
}

type Stand = { soort: 'invullen' } | { soort: 'bezig' } | { soort: 'fout'; tekst: string } | { soort: 'klaar' }

async function verstuur(apiPad: string, body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(apiPad, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) return null
    const data: unknown = await res.json().catch(() => null)
    const fout = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
    return fout ?? 'Er ging iets mis. Probeer het opnieuw.'
  } catch {
    return 'Geen verbinding. Controleer je internet en probeer het opnieuw.'
  }
}

function tekstVan(form: FormData, naam: string): string {
  const v = form.get(naam)
  return typeof v === 'string' ? v : ''
}

export function WidgetAanvraag({ les, organisatie, apiPad, privacyUrl, voorbeeld, onTerug }: WidgetAanvraagProps) {
  const id = useId()
  const [stand, setStand] = useState<Stand>({ soort: 'invullen' })

  async function verzend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (voorbeeld) return setStand({ soort: 'fout', tekst: 'Dit is een voorvertoning: er wordt niets verstuurd.' })
    const form = new FormData(e.currentTarget)
    setStand({ soort: 'bezig' })
    const fout = await verstuur(apiPad, {
      soort: les ? 'proefles' : 'kennismaking',
      lesId: les?.id ?? null,
      naam: tekstVan(form, 'naam'),
      email: tekstVan(form, 'email'),
      telefoon: tekstVan(form, 'telefoon'),
      akkoord: form.get('akkoord') === 'ja',
      website: tekstVan(form, 'website'),
    })
    setStand(fout ? { soort: 'fout', tekst: fout } : { soort: 'klaar' })
  }

  if (stand.soort === 'klaar') {
    return (
      <section className="ayg-w-klaar" aria-live="polite">
        <span className="ayg-w-klaar-vink" aria-hidden><Check size={22} strokeWidth={2.5} /></span>
        <h2>Aanvraag ontvangen</h2>
        <p>Bedankt! {organisatie} neemt zo snel mogelijk contact met je op om {les ? 'je proefles' : 'een kennismaking'} in te plannen.</p>
        <button type="button" className="ayg-w-knop ayg-w-knop--rustig" onClick={onTerug}>Terug naar het rooster</button>
      </section>
    )
  }

  const bezig = stand.soort === 'bezig'
  return (
    <section className="ayg-w-aanvraag" aria-labelledby={`${id}-kop`}>
      <button type="button" className="ayg-w-terug" onClick={onTerug}>
        <ArrowLeft size={16} aria-hidden /> Rooster
      </button>
      <div className="ayg-w-keuze">
        <p className="ayg-w-boven">{les ? 'Proefles aanvragen' : 'Kennismaken'}</p>
        <h2 id={`${id}-kop`}>{les ? les.naam : 'Kom langs voor een kennismaking'}</h2>
        <p>{les ? `${dagLabel(les.dag)} om ${les.tijd}, ${les.duurMin} minuten` : 'Een rondleiding en een gesprek over wat je wilt bereiken.'}</p>
      </div>

      <form className="ayg-w-form" onSubmit={(e) => void verzend(e)}>
        <label className="ayg-w-veld">
          <span>Naam</span>
          <input name="naam" autoComplete="name" required minLength={2} maxLength={120} disabled={bezig} />
        </label>
        <div className="ayg-w-rij">
          <label className="ayg-w-veld">
            <span>E-mail</span>
            <input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={160} disabled={bezig} />
          </label>
          <label className="ayg-w-veld">
            <span>Telefoon</span>
            <input name="telefoon" type="tel" autoComplete="tel" inputMode="tel" required maxLength={40} disabled={bezig} />
          </label>
        </div>
        <div className="ayg-w-honing" aria-hidden>
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="ayg-w-akkoord">
          <input name="akkoord" type="checkbox" value="ja" required disabled={bezig} />
          <span>
            Ik geef {organisatie} toestemming om contact met mij op te nemen over deze aanvraag en mijn gegevens daarvoor te bewaren.
            {privacyUrl && (
              <>
                {' '}Lees de <a href={privacyUrl} target="_blank" rel="noopener noreferrer">privacyverklaring</a>.
              </>
            )}
          </span>
        </label>
        <div className="ayg-w-verstuur">
          <button type="submit" className="ayg-w-knop" disabled={bezig}>
            {bezig ? 'Versturen...' : 'Aanvraag versturen'}
          </button>
          <div role="status" aria-live="polite">
            {stand.soort === 'fout' && <p className="ayg-w-fout">{stand.tekst}</p>}
          </div>
        </div>
      </form>
    </section>
  )
}
