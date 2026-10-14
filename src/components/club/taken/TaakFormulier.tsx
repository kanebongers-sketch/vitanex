'use client'

import { useState, type FormEvent } from 'react'
import { FREQUENTIES, FREQUENTIE_LABEL, MOMENTEN, MOMENT_LABEL, isFrequentie, isMoment, type Frequentie, type Moment, type Taak } from '@/lib/club/taken/typen'

// De velden van een taak: naam, kopje, hoe vaak en wanneer. Voor nieuw en wijzigen.

export interface TaakWaarden {
  naam: string
  groep: string
  frequentie: Frequentie
  perWeekMin: number
  moment: Moment
}

interface FormProps {
  id: string
  start?: Taak
  /** Kopjes die al in de lijst staan, als suggestie. */
  groepen: string[]
  knop: string
  bezig: boolean
  onOpslaan: (w: TaakWaarden) => Promise<boolean>
  onAnnuleer?: () => void
}

function beginWaarden(t?: Taak): TaakWaarden {
  return {
    naam: t?.naam ?? '',
    groep: t?.groep ?? '',
    frequentie: t?.frequentie ?? 'dagelijks',
    perWeekMin: t?.perWeekMin ?? 2,
    moment: t?.moment ?? 'vrij',
  }
}

export function TaakFormulier({ id, start, groepen, knop, bezig, onOpslaan, onAnnuleer }: FormProps) {
  const [w, setW] = useState(() => beginWaarden(start))
  const zet = (deel: Partial<TaakWaarden>) => setW((oud) => ({ ...oud, ...deel }))

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!w.naam.trim()) return
    const gelukt = await onOpslaan(w)
    if (gelukt && !start) setW((oud) => ({ ...beginWaarden(), groep: oud.groep, frequentie: oud.frequentie, perWeekMin: oud.perWeekMin, moment: oud.moment }))
  }

  return (
    <form className="club-taken-taakform" onSubmit={verstuur}>
      <label className="club-veld club-taken-taakform-naam">
        <span>Taak</span>
        <input className="club-invoer" value={w.naam} onChange={(e) => zet({ naam: e.target.value })} maxLength={120} required />
      </label>
      <label className="club-veld">
        <span>Kopje</span>
        <input className="club-invoer" value={w.groep} onChange={(e) => zet({ groep: e.target.value })} maxLength={60} list={`${id}-groepen`} placeholder="Geen" />
        <datalist id={`${id}-groepen`}>
          {groepen.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </label>
      <label className="club-veld">
        <span>Hoe vaak</span>
        <select className="club-invoer" value={w.frequentie} onChange={(e) => isFrequentie(e.target.value) && zet({ frequentie: e.target.value })}>
          {FREQUENTIES.map((f) => (
            <option key={f} value={f}>
              {FREQUENTIE_LABEL[f]}
            </option>
          ))}
        </select>
      </label>
      {w.frequentie === 'per_week' && (
        <label className="club-veld club-taken-taakform-min">
          <span>Keer per week</span>
          <input className="club-invoer" type="number" min={1} max={7} value={w.perWeekMin} onChange={(e) => zet({ perWeekMin: Number(e.target.value) })} required />
        </label>
      )}
      <label className="club-veld">
        <span>Moment</span>
        <select className="club-invoer" value={w.moment} onChange={(e) => isMoment(e.target.value) && zet({ moment: e.target.value })}>
          {MOMENTEN.map((m) => (
            <option key={m} value={m}>
              {MOMENT_LABEL[m]}
            </option>
          ))}
        </select>
      </label>
      <div className="club-acties club-taken-taakform-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig || !w.naam.trim()}>
          {bezig ? 'Bezig' : knop}
        </button>
        {onAnnuleer && (
          <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>
            Annuleer
          </button>
        )}
      </div>
    </form>
  )
}

/** De waarden zoals de API ze verwacht. */
export function alsBody(w: TaakWaarden): Record<string, unknown> {
  return { naam: w.naam, groep: w.groep.trim() || null, frequentie: w.frequentie, perWeekMin: w.frequentie === 'per_week' ? w.perWeekMin : null, moment: w.moment }
}
