'use client'

import { useEffect, useState } from 'react'
import { haal, slotenUit, type SlotOptie } from './haal'

// Vrije tijden ophalen (balie of ledenapp) en als knoppen tonen. De URL bepaalt
// welke regels gelden; null = nog niet genoeg gekozen.

interface Stand {
  url: string | null
  sloten: SlotOptie[]
  fout: string | null
}

export function useVrijeTijden(url: string | null): { sloten: SlotOptie[]; laden: boolean; fout: string | null } {
  const [stand, setStand] = useState<Stand>({ url: null, sloten: [], fout: null })

  useEffect(() => {
    if (!url) return
    const afbreken = new AbortController()
    void haal(url, afbreken.signal).then((uit) => {
      if (afbreken.signal.aborted) return
      setStand(uit.ok ? { url, sloten: slotenUit(uit.data), fout: null } : { url, sloten: [], fout: uit.fout || null })
    })
    return () => afbreken.abort()
  }, [url])

  const actueel = url !== null && stand.url === url
  return { sloten: actueel ? stand.sloten : [], laden: url !== null && !actueel, fout: actueel ? stand.fout : null }
}

interface Props {
  sloten: readonly SlotOptie[]
  laden: boolean
  fout: string | null
  gekozen: string | null
  onKies: (slot: SlotOptie) => void
  /** Toon de naam van de trainer bij elke tijd ("maakt niet uit"). */
  metTrainer: boolean
  leegTekst: string
  /** Prefix voor de class, zodat de ledenapp eigen stijl kan hebben. */
  klasse?: string
}

export function VrijeTijden({ sloten, laden, fout, gekozen, onKies, metTrainer, leegTekst, klasse = 'club-afspraken' }: Props) {
  if (laden) return <p className={`${klasse}-tijden-stand`} aria-live="polite">Vrije tijden zoeken…</p>
  if (fout) return <p className="club-melding club-melding--fout" role="alert">{fout}</p>
  if (sloten.length === 0) return <p className={`${klasse}-tijden-stand`} aria-live="polite">{leegTekst}</p>
  return (
    <div className={`${klasse}-tijden`} role="radiogroup" aria-label="Vrije tijden">
      {sloten.map((s) => {
        const aan = gekozen === `${s.tijd}|${s.medewerkerId}`
        return (
          <button
            key={`${s.tijd}|${s.medewerkerId}`}
            type="button"
            role="radio"
            aria-checked={aan}
            className={`${klasse}-tijd`}
            onClick={() => onKies(s)}
          >
            <strong>{s.tijd}</strong>
            {metTrainer && s.medewerkerNaam ? <span>{s.medewerkerNaam.split(' ')[0]}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

/** Sleutel van een gekozen slot, voor `gekozen`. */
export function slotSleutel(s: Pick<SlotOptie, 'tijd' | 'medewerkerId'>): string {
  return `${s.tijd}|${s.medewerkerId}`
}
