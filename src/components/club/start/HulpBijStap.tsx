'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { LifeBuoy, Send } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { GRENZEN } from '@/lib/club/hulp/melding'
import { hulpVerzoek, hulpVoorStap } from '@/lib/club/start/hulp-stap'

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
  const { onderwerp } = hulpVoorStap(stap)
  const teKort = tekst.trim().length < GRENZEN.beschrijving.min

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (teKort) return setFout(`Schrijf in een paar woorden waar je vastloopt (minstens ${GRENZEN.beschrijving.min} tekens).`)
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/hulp', 'POST', hulpVerzoek(stap, tekst))
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setKlaar(true)
    setTekst('')
  }

  return (
    <details className="club-start-hulp">
      <summary>
        <LifeBuoy aria-hidden size={15} /> Ik kom er niet uit
      </summary>
      {klaar ? (
        <p className="club-melding club-melding--ok" role="status">
          Je vraag staat in het helpcentrum. Het antwoord lees je bij <Link href="/club/hulp">Hulp</Link>, onder Mijn meldingen. Je kunt intussen gewoon verder.
        </p>
      ) : (
        <form className="club-start-hulp-form" onSubmit={(e) => void verstuur(e)} noValidate>
          <p className="club-hint">
            Onderwerp: <strong>{onderwerp}</strong>
          </p>
          <label className="club-label" htmlFor={`${id}-tekst`}>
            Waar loop je vast?
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
            placeholder="Bijvoorbeeld: ik weet niet welke openingstijden ik moet kiezen voor de feestdagen."
          />
          <p id={`${id}-tip`} className="club-hint">
            Zet er geen wachtwoorden of gegevens van leden in.
          </p>
          {fout && (
            <p id={`${id}-fout`} className="club-fout" role="alert">
              {fout}
            </p>
          )}
          <button type="submit" className="club-knop club-knop--klein" disabled={bezig} aria-busy={bezig}>
            <Send aria-hidden size={14} /> {bezig ? 'Versturen...' : 'Vraag versturen'}
          </button>
        </form>
      )}
    </details>
  )
}
