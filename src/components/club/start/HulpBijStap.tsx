'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { LifeBuoy, Send } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { GRENZEN } from '@/lib/club/hulp/melding'
import { hulpVerzoek, hulpVoorStap } from '@/lib/club/start/hulp-stap'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// "Ik kom er niet uit" onder elke stap: een korte vraag die als melding in het
// helpcentrum komt, met de stap al ingevuld. Geen chat van buiten en geen mail:
// het antwoord staat bij Hulp, onder Mijn meldingen.

interface HulpBijStapProps {
  stap: number
}

export function HulpBijStap({ stap }: HulpBijStapProps) {
  const id = useId()
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState(false)
  const taal = useTaal()
  const t = useTekst(START).hulp
  const { onderwerp } = hulpVoorStap(stap, taal)
  const teKort = tekst.trim().length < GRENZEN.beschrijving.min

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (teKort) return setFout(t.teKort(GRENZEN.beschrijving.min))
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/hulp', 'POST', hulpVerzoek(stap, tekst, taal))
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setKlaar(true)
    setTekst('')
  }

  return (
    <details className="club-start-hulp">
      <summary>
        <LifeBuoy aria-hidden size={15} /> {t.open}
      </summary>
      {klaar ? (
        <p className="club-melding club-melding--ok" role="status">
          {t.klaarVoor} <Link href="/club/hulp">{t.klaarLink}</Link>{t.klaarNa}
        </p>
      ) : (
        <form className="club-start-hulp-form" onSubmit={(e) => void verstuur(e)} noValidate>
          <p className="club-hint">
            {t.onderwerp} <strong>{onderwerp}</strong>
          </p>
          <label className="club-label" htmlFor={`${id}-tekst`}>
            {t.vraag}
          </label>
          <textarea
            id={`${id}-tekst`}
            className="club-invoer"
            rows={3}
            maxLength={GRENZEN.beschrijving.max}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            aria-describedby={`${id}-tip${fout ? ` ${id}-fout` : ''}`}
            aria-invalid={Boolean(fout) || undefined}
            placeholder={t.voorbeeld}
          />
          <p id={`${id}-tip`} className="club-hint">
            {t.tip}
          </p>
          {fout && (
            <p id={`${id}-fout`} className="club-fout" role="alert">
              {fout}
            </p>
          )}
          <button type="submit" className="club-knop club-knop--klein" disabled={bezig} aria-busy={bezig}>
            <Send aria-hidden size={14} /> {bezig ? t.bezig : t.versturen}
          </button>
        </form>
      )}
    </details>
  )
}
