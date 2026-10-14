'use client'

import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { REGEL_DEFINITIES, REGEL_SLEUTELS, type RegelSleutel, type RoosterRegels } from '@/lib/club/rooster/regels'
import { WEEKDAG_LABEL, type Openingstijd, type Openingstijden } from '@/lib/club/rooster/openingstijden'
import { stuur, useClubActie } from '@/components/club/rooster/vraag'

// Regels voor reserveren en de openingstijden van een vestiging. De leden
// krijgen dezelfde regels straks in de app te zien, dus de uitleg is kort en
// in gewone taal.

interface Props {
  vestiging: string
  regels: RoosterRegels
  openingstijden: Openingstijden
}

type Dag = { open: boolean; van: string; tot: string }

function naarDagen(o: Openingstijden): Dag[] {
  return o.map((d: Openingstijd | null) => (d ? { open: true, van: d.van, tot: d.tot } : { open: false, van: '08:00', tot: '22:00' }))
}

export function RegelsFormulier({ vestiging, regels, openingstijden }: Props) {
  const [waarden, setWaarden] = useState<Record<RegelSleutel, string>>(() => ({
    annuleerUren: String(regels.annuleerUren),
    noShowDrempel: String(regels.noShowDrempel),
    noShowBlokkadeDagen: String(regels.noShowBlokkadeDagen),
    reserveerDagenVooruit: String(regels.reserveerDagenVooruit),
    maxOpenReserveringen: String(regels.maxOpenReserveringen),
    checkinVensterMin: String(regels.checkinVensterMin),
  }))
  const [dagen, setDagen] = useState<Dag[]>(() => naarDagen(openingstijden))
  const [klaar, setKlaar] = useState(false)
  const { bezig, fout, voerUit } = useClubActie()

  function zetDag(i: number, wijziging: Partial<Dag>) {
    setKlaar(false)
    setDagen((oud) => oud.map((d, j) => (j === i ? { ...d, ...wijziging } : d)))
  }

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setKlaar(false)
    const body = {
      vestiging,
      regels: Object.fromEntries(REGEL_SLEUTELS.map((s) => [s, Number(waarden[s])])),
      openingstijden: dagen.map((d) => (d.open ? { van: d.van, tot: d.tot } : null)),
    }
    const uit = await voerUit(() => stuur('/api/club/instellingen/regels', 'PUT', body))
    if (uit.ok) setKlaar(true)
  }

  return (
    <form className="club-instellingen-regels" onSubmit={bewaar}>
      <section className="club-kaart club-instellingen-blok">
        <h2>Reserveren</h2>
        <div className="club-instellingen-regelraster">
          {REGEL_SLEUTELS.map((s) => {
            const def = REGEL_DEFINITIES[s]
            return (
              <label key={s} className="club-veld club-instellingen-regel">
                <span>{def.label}</span>
                <input
                  className="club-invoer club-instellingen-getal"
                  type="number"
                  inputMode="numeric"
                  min={def.min}
                  max={def.max}
                  required
                  value={waarden[s]}
                  onChange={(e) => {
                    setKlaar(false)
                    setWaarden((oud) => ({ ...oud, [s]: e.target.value }))
                  }}
                />
                <small className="club-hint">{def.uitleg}</small>
              </label>
            )
          })}
        </div>
      </section>

      <section className="club-kaart club-instellingen-blok">
        <h2>Openingstijden</h2>
        <ul className="club-instellingen-dagen">
          {dagen.map((d, i) => (
            <li key={WEEKDAG_LABEL[i]} className="club-instellingen-dag" data-dicht={!d.open || undefined}>
              <label className="club-instellingen-check">
                <input type="checkbox" checked={d.open} onChange={(e) => zetDag(i, { open: e.target.checked })} />
                <span>{WEEKDAG_LABEL[i]}</span>
              </label>
              {d.open ? (
                <span className="club-instellingen-tijden">
                  <input className="club-invoer" type="time" aria-label={`${WEEKDAG_LABEL[i]} open vanaf`} value={d.van} onChange={(e) => zetDag(i, { van: e.target.value })} required />
                  <span aria-hidden>tot</span>
                  <input className="club-invoer" type="time" aria-label={`${WEEKDAG_LABEL[i]} open tot`} value={d.tot} onChange={(e) => zetDag(i, { tot: e.target.value })} required />
                </span>
              ) : (
                <span className="club-zacht">Gesloten</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="club-instellingen-opslaan">
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {klaar && <p className="club-melding club-melding--ok" role="status">Opgeslagen. Nieuwe boekingen volgen deze regels.</p>}
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          <Save aria-hidden size={16} />
          Regels opslaan
        </button>
      </div>
    </form>
  )
}
