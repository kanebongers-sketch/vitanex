'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import type { Zaal } from '@/lib/club/rooster/typen'
import { useClubActie } from '@/components/club/rooster/vraag'
import { bewaarItem } from './opslaan'

// Zalen van de vestiging. De capaciteit van de zaal is het voorstel voor nieuwe
// vaste lessen; per les kun je hem in het rooster nog aanpassen.

function ZaalRij({ zaal, vestiging }: { zaal: Zaal; vestiging: string }) {
  const [naam, setNaam] = useState(zaal.naam)
  const [capaciteit, setCapaciteit] = useState(String(zaal.capaciteit))
  const { bezig, fout, voerUit } = useClubActie()
  const gewijzigd = naam !== zaal.naam || capaciteit !== String(zaal.capaciteit)

  return (
    <tr data-uit={!zaal.actief || undefined}>
      <td>
        <input className="club-invoer" aria-label="Naam van de zaal" value={naam} maxLength={60} onChange={(e) => setNaam(e.target.value)} />
        {fout && <span className="club-fout" role="alert">{fout}</span>}
      </td>
      <td className="club-instellingen-smal">
        <input className="club-invoer club-instellingen-getal" type="number" min={1} max={500} aria-label="Capaciteit" value={capaciteit} onChange={(e) => setCapaciteit(e.target.value)} />
      </td>
      <td>
        <label className="club-instellingen-check">
          <input type="checkbox" checked={zaal.actief} disabled={bezig} onChange={(e) => voerUit(() => bewaarItem('zalen', vestiging, zaal.id, { actief: e.target.checked }))} />
          <span>{zaal.actief ? 'In gebruik' : 'Uit'}</span>
        </label>
      </td>
      <td className="club-instellingen-actie">
        {gewijzigd && (
          <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => voerUit(() => bewaarItem('zalen', vestiging, zaal.id, { naam, capaciteit: Number(capaciteit) }))}>
            <Save aria-hidden size={14} />
            Opslaan
          </button>
        )}
      </td>
    </tr>
  )
}

function NieuweZaal({ vestiging }: { vestiging: string }) {
  const [naam, setNaam] = useState('')
  const [capaciteit, setCapaciteit] = useState('20')
  const { bezig, fout, voerUit } = useClubActie()

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    const uit = await voerUit(() => bewaarItem('zalen', vestiging, null, { naam, capaciteit: Number(capaciteit) }))
    if (uit.ok) setNaam('')
  }

  return (
    <form className="club-instellingen-nieuw" onSubmit={voegToe}>
      <label className="club-veld">
        <span>Nieuwe zaal</span>
        <input className="club-invoer" required maxLength={60} placeholder="Bijvoorbeeld: Spinningzaal" value={naam} onChange={(e) => setNaam(e.target.value)} />
      </label>
      <label className="club-veld club-instellingen-smal">
        <span>Capaciteit</span>
        <input className="club-invoer club-instellingen-getal" type="number" min={1} max={500} required value={capaciteit} onChange={(e) => setCapaciteit(e.target.value)} />
      </label>
      <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
        <Plus aria-hidden size={16} />
        Toevoegen
      </button>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </form>
  )
}

export function ZalenBeheer({ zalen, vestiging }: { zalen: Zaal[]; vestiging: string }) {
  return (
    <section className="club-instellingen-sectie">
      {zalen.length === 0 ? (
        <p className="club-leeg">Nog geen zalen voor deze vestiging.</p>
      ) : (
        <div className="club-tabel-wrap">
          <table className="club-tabel">
            <thead>
              <tr>
                <th scope="col">Zaal</th>
                <th scope="col">Capaciteit</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="club-sr">Actie</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {zalen.map((z) => (
                <ZaalRij key={`${z.id}-${z.naam}-${z.capaciteit}`} zaal={z} vestiging={vestiging} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NieuweZaal vestiging={vestiging} />
    </section>
  )
}
