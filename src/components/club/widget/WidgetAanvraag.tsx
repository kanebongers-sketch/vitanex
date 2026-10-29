'use client'

import { useId, useState, type FormEvent } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { dagLabel, type WidgetLes } from '@/lib/club/widget/rooster'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { WIDGET } from '@/lib/aiyourgym/taal/woorden/club/widget'

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

type AanvraagTekst = (typeof WIDGET)['nl']['aanvraag']

async function verstuur(apiPad: string, body: Record<string, unknown>, t: AanvraagTekst): Promise<string | null> {
  try {
    const res = await fetch(apiPad, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) return null
    const data: unknown = await res.json().catch(() => null)
    const fout = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
    return fout ?? t.foutAlgemeen
  } catch {
    return t.geenVerbinding
  }
}

function tekstVan(form: FormData, naam: string): string {
  const v = form.get(naam)
  return typeof v === 'string' ? v : ''
}

export function WidgetAanvraag({ les, organisatie, apiPad, privacyUrl, voorbeeld, onTerug }: WidgetAanvraagProps) {
  const id = useId()
  const [stand, setStand] = useState<Stand>({ soort: 'invullen' })
  const taal = useTaal()
  const t = useTekst(WIDGET).aanvraag

  async function verzend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (voorbeeld) return setStand({ soort: 'fout', tekst: t.voorbeeld })
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
    }, t)
    setStand(fout ? { soort: 'fout', tekst: fout } : { soort: 'klaar' })
  }

  if (stand.soort === 'klaar') {
    return (
      <section className="ayg-w-klaar" aria-live="polite">
        <span className="ayg-w-klaar-vink" aria-hidden><Check size={22} strokeWidth={2.5} /></span>
        <h2>{t.ontvangen}</h2>
        <p>{les ? t.bedanktProefles(organisatie) : t.bedanktKennis(organisatie)}</p>
        <button type="button" className="ayg-w-knop ayg-w-knop--rustig" onClick={onTerug}>{t.terugRooster}</button>
      </section>
    )
  }

  const bezig = stand.soort === 'bezig'
  return (
    <section className="ayg-w-aanvraag" aria-labelledby={`${id}-kop`}>
      <button type="button" className="ayg-w-terug" onClick={onTerug}>
        <ArrowLeft size={16} aria-hidden /> {t.rooster}
      </button>
      <div className="ayg-w-keuze">
        <p className="ayg-w-boven">{les ? t.proeflesAanvragen : t.kennismaken}</p>
        <h2 id={`${id}-kop`}>{les ? les.naam : t.kennisKop}</h2>
        <p>{les ? t.lesMoment(dagLabel(les.dag, taal), les.tijd, les.duurMin) : t.kennisTekst}</p>
      </div>

      <form className="ayg-w-form" onSubmit={(e) => void verzend(e)}>
        <label className="ayg-w-veld">
          <span>{t.naam}</span>
          <input name="naam" autoComplete="name" required minLength={2} maxLength={120} disabled={bezig} />
        </label>
        <div className="ayg-w-rij">
          <label className="ayg-w-veld">
            <span>{t.email}</span>
            <input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={160} disabled={bezig} />
          </label>
          <label className="ayg-w-veld">
            <span>{t.telefoon}</span>
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
            {t.toestemming(organisatie)}
            {privacyUrl && (
              <>
                {' '}{t.leesDe} <a href={privacyUrl} target="_blank" rel="noopener noreferrer">{t.privacy}</a>.
              </>
            )}
          </span>
        </label>
        <div className="ayg-w-verstuur">
          <button type="submit" className="ayg-w-knop" disabled={bezig}>
            {bezig ? t.bezig : t.versturen}
          </button>
          <div role="status" aria-live="polite">
            {stand.soort === 'fout' && <p className="ayg-w-fout">{stand.tekst}</p>}
          </div>
        </div>
      </form>
    </section>
  )
}
