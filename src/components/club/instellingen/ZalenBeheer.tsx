'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import type { Zaal } from '@/lib/club/rooster/typen'
import { useClubActie } from '@/components/club/rooster/vraag'
import { bewaarItem } from './opslaan'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { INSTELLINGEN } from '@/lib/aiyourgym/taal/woorden/club/instellingen'

// Zalen van de vestiging. De capaciteit van de zaal is het voorstel voor nieuwe
// vaste lessen; per les kun je hem in het rooster nog aanpassen.

function ZaalRij({ zaal, vestiging }: { zaal: Zaal; vestiging: string }) {
  const [naam, setNaam] = useState(zaal.naam)
  const [capaciteit, setCapaciteit] = useState(String(zaal.capaciteit))
  const { bezig, fout, voerUit } = useClubActie()
  const gewijzigd = naam !== zaal.naam || capaciteit !== String(zaal.capaciteit)
  const tekst = useTekst(INSTELLINGEN)
  const t = tekst.zalen

  return (
    <tr data-uit={!zaal.actief || undefined}>
      <td data-label={t.zaal}>
        <input className="club-invoer" aria-label={t.naamZaal} value={naam} maxLength={60} onChange={(e) => setNaam(e.target.value)} />
        {fout && <span className="club-fout" role="alert">{fout}</span>}
      </td>
      <td className="club-instellingen-smal" data-label={t.capaciteit}>
        <input className="club-invoer club-instellingen-getal" type="number" min={1} max={500} aria-label={t.capaciteit} value={capaciteit} onChange={(e) => setCapaciteit(e.target.value)} />
      </td>
      <td data-label={t.status}>
        <label className="club-instellingen-check">
          <input type="checkbox" checked={zaal.actief} disabled={bezig} onChange={(e) => voerUit(() => bewaarItem('zalen', vestiging, zaal.id, { actief: e.target.checked }))} />
          <span>{zaal.actief ? t.inGebruik : tekst.algemeen.uit}</span>
        </label>
      </td>
      <td className="club-instellingen-actie">
        {gewijzigd && (
          <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => voerUit(() => bewaarItem('zalen', vestiging, zaal.id, { naam, capaciteit: Number(capaciteit) }))}>
            <Save aria-hidden size={14} />
            {tekst.algemeen.opslaan}
          </button>
        )}
      </td>
    </tr>
  )
}

function NieuweZaal({ vestiging }: { vestiging: string }) {
  const [naam, setNaam] = useState('')
  const [capaciteit, setCapaciteit] = useState('20')
  const tekst = useTekst(INSTELLINGEN)
  const t = tekst.zalen
  const { bezig, fout, voerUit } = useClubActie()

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    const uit = await voerUit(() => bewaarItem('zalen', vestiging, null, { naam, capaciteit: Number(capaciteit) }))
    if (uit.ok) setNaam('')
  }

  return (
    <form className="club-instellingen-nieuw" onSubmit={voegToe}>
      <label className="club-veld">
        <span>{t.nieuw}</span>
        <input className="club-invoer" required maxLength={60} placeholder={t.voorbeeld} value={naam} onChange={(e) => setNaam(e.target.value)} />
      </label>
      <label className="club-veld club-instellingen-smal">
        <span>{t.capaciteit}</span>
        <input className="club-invoer club-instellingen-getal" type="number" min={1} max={500} required value={capaciteit} onChange={(e) => setCapaciteit(e.target.value)} />
      </label>
      <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
        <Plus aria-hidden size={16} />
        {tekst.algemeen.toevoegen}
      </button>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </form>
  )
}

export function ZalenBeheer({ zalen, vestiging }: { zalen: Zaal[]; vestiging: string }) {
  const t = useTekst(INSTELLINGEN).zalen
  return (
    <section className="club-instellingen-sectie">
      {zalen.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <div className="club-tabel-wrap">
          <table className="club-tabel club-instellingen-tabel">
            <thead>
              <tr>
                <th scope="col">{t.zaal}</th>
                <th scope="col">{t.capaciteit}</th>
                <th scope="col">{t.status}</th>
                <th scope="col">
                  <span className="club-sr">{t.actie}</span>
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
