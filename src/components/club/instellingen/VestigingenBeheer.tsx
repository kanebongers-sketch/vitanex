'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, Plus, Star } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { MAX_VESTIGING_NAAM } from '@/lib/club/instellingen/vestigingen-invoer'
import { stuur, useClubActie } from '@/components/club/rooster/vraag'

// De vestigingen van de sportschool: toevoegen, hernoemen, volgorde en welke
// standaard open gaat. Verwijderen kan niet (leden en lessen verwijzen ernaar).

interface VestigingenBeheerProps {
  vestigingen: readonly VestigingInfo[]
}

export function VestigingenBeheer({ vestigingen }: VestigingenBeheerProps) {
  const { bezig, fout, voerUit } = useClubActie()
  const [nieuw, setNieuw] = useState('')

  const wijzig = (sleutel: string, body: Record<string, unknown>) => voerUit(() => stuur(`/api/club/vestigingen/${encodeURIComponent(sleutel)}`, 'PATCH', body))

  async function voegToe() {
    const naam = nieuw.trim()
    if (!naam) return
    const gelukt = await voerUit(() => stuur('/api/club/vestigingen', 'POST', { naam }))
    if (gelukt.ok) setNieuw('')
  }

  return (
    <section className="club-kaart club-instellingen-vestigingen" aria-label="Vestigingen">
      {vestigingen.length === 0 && <p className="club-melding">Deze sportschool heeft nog geen vestigingen. Voeg hieronder de eerste toe.</p>}
      <ol className="club-instellingen-vestlijst">
        {vestigingen.map((v, i) => (
          <VestigingRij
            key={v.sleutel}
            vestiging={v}
            eerste={i === 0}
            laatste={i === vestigingen.length - 1}
            bezig={bezig}
            onWijzig={(body) => void wijzig(v.sleutel, body)}
          />
        ))}
      </ol>
      <form
        className="club-instellingen-vestnieuw"
        onSubmit={(e) => {
          e.preventDefault()
          void voegToe()
        }}
      >
        <label className="club-veld">
          <span>Nieuwe vestiging</span>
          <input className="club-invoer" value={nieuw} maxLength={MAX_VESTIGING_NAAM} placeholder="Bijvoorbeeld Centrum" onChange={(e) => setNieuw(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig || !nieuw.trim()}>
          <Plus aria-hidden size={16} /> Toevoegen
        </button>
      </form>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}

interface VestigingRijProps {
  vestiging: VestigingInfo
  eerste: boolean
  laatste: boolean
  bezig: boolean
  onWijzig: (body: Record<string, unknown>) => void
}

function VestigingRij({ vestiging: v, eerste, laatste, bezig, onWijzig }: VestigingRijProps) {
  const [naam, setNaam] = useState(v.naam)
  const gewijzigd = naam.trim() !== v.naam && naam.trim() !== ''
  return (
    <li className="club-instellingen-vestrij">
      <span className="club-instellingen-vestvolg">
        <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={`${v.naam} omhoog`} disabled={bezig || eerste} onClick={() => onWijzig({ verplaats: -1 })}>
          <ArrowUp aria-hidden size={15} />
        </button>
        <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={`${v.naam} omlaag`} disabled={bezig || laatste} onClick={() => onWijzig({ verplaats: 1 })}>
          <ArrowDown aria-hidden size={15} />
        </button>
      </span>
      <input className="club-invoer" aria-label={`Naam van ${v.naam}`} value={naam} maxLength={MAX_VESTIGING_NAAM} onChange={(e) => setNaam(e.target.value)} />
      {gewijzigd && (
        <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => onWijzig({ naam })}>
          <Check aria-hidden size={15} /> Bewaar
        </button>
      )}
      {v.standaard ? (
        <span className="club-chip club-chip--merk"><Star aria-hidden size={13} /> Standaard</span>
      ) : (
        <button type="button" className="club-knop club-knop--stil club-knop--klein" disabled={bezig} onClick={() => onWijzig({ standaard: true })}>
          Maak standaard
        </button>
      )}
    </li>
  )
}
