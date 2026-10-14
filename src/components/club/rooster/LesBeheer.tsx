'use client'

import { useState, type FormEvent } from 'react'
import { Ban, Save } from 'lucide-react'
import type { LesOverzicht } from '@/lib/club/rooster/raster'
import { stuur, useClubActie } from './vraag'

// Alleen deze ene les aanpassen (capaciteit, instructeur, zaal) of laten
// vervallen met een reden. Het weekrooster zelf verandert hier niet.

interface Optie {
  id: string
  naam: string
}

interface Props {
  les: LesOverzicht
  zalen: Optie[]
  instructeurs: Optie[]
}

/** De huidige keuze hoort er altijd bij, ook als die inmiddels inactief is. */
function metHuidige(opties: Optie[], huidig: Optie | null): Optie[] {
  return huidig && !opties.some((o) => o.id === huidig.id) ? [...opties, huidig] : opties
}

function Wijzigen({ les, zalen: alleZalen, instructeurs: alleInstructeurs }: Props) {
  const zalen = metHuidige(alleZalen, les.zaal)
  const instructeurs = metHuidige(alleInstructeurs, les.instructeur)
  const [capaciteit, setCapaciteit] = useState(String(les.capaciteit))
  const [zaalId, setZaalId] = useState(les.zaal?.id ?? '')
  const [instructeurId, setInstructeurId] = useState(les.instructeur?.id ?? '')
  const [klaar, setKlaar] = useState<string | null>(null)
  const { bezig, fout, voerUit } = useClubActie()

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setKlaar(null)
    const uit = await voerUit(() =>
      stuur(`/api/club/rooster/lessen/${les.id}`, 'PATCH', { capaciteit: Number(capaciteit), zaalId: zaalId || null, instructeurId: instructeurId || null }),
    )
    if (!uit.ok) return
    const door = typeof uit.data === 'object' && uit.data !== null && 'doorgeschoven' in uit.data && typeof uit.data.doorgeschoven === 'number' ? uit.data.doorgeschoven : 0
    setKlaar(door > 0 ? `Opgeslagen. ${door} van de wachtlijst doorgeschoven.` : 'Opgeslagen.')
  }

  return (
    <form className="club-rooster-beheer" onSubmit={bewaar}>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Capaciteit</span>
          <input className="club-invoer" type="number" min={1} max={500} required value={capaciteit} onChange={(e) => setCapaciteit(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>Zaal</span>
          <select className="club-invoer" value={zaalId} onChange={(e) => setZaalId(e.target.value)}>
            <option value="">Geen zaal</option>
            {zalen.map((z) => (
              <option key={z.id} value={z.id}>
                {z.naam}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Instructeur</span>
          <select className="club-invoer" value={instructeurId} onChange={(e) => setInstructeurId(e.target.value)}>
            <option value="">Nog niet bekend</option>
            {instructeurs.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naam}
              </option>
            ))}
          </select>
        </label>
      </div>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      {klaar && <p className="club-melding club-melding--ok" role="status">{klaar}</p>}
      <button type="submit" className="club-knop club-knop--klein" disabled={bezig}>
        <Save aria-hidden size={14} />
        Opslaan voor deze les
      </button>
    </form>
  )
}

function Annuleren({ les }: { les: LesOverzicht }) {
  const [reden, setReden] = useState('')
  const { bezig, fout, voerUit } = useClubActie()
  const bezet = les.geboekt + les.wachtlijst

  return (
    <form
      className="club-rooster-beheer"
      onSubmit={(e) => {
        e.preventDefault()
        void voerUit(() => stuur(`/api/club/rooster/lessen/${les.id}/annuleren`, 'POST', { reden }))
      }}
    >
      <label className="club-veld">
        <span>Les annuleren</span>
        <input className="club-invoer" maxLength={200} required minLength={2} placeholder="Reden, bijvoorbeeld: instructeur ziek" value={reden} onChange={(e) => setReden(e.target.value)} />
      </label>
      <p className="club-hint">
        {bezet > 0 ? `${bezet} reserveringen vervallen. De reden blijft bij de les staan.` : 'Er zijn nog geen reserveringen.'}
      </p>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      <button type="submit" className="club-knop club-knop--gevaar club-knop--klein" disabled={bezig || reden.trim().length < 2}>
        <Ban aria-hidden size={14} />
        Les annuleren
      </button>
    </form>
  )
}

export function LesBeheer(props: Props) {
  return (
    <details className="club-rooster-uitklap">
      <summary>Deze les aanpassen</summary>
      <Wijzigen {...props} />
      <Annuleren les={props.les} />
    </details>
  )
}
