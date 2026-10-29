'use client'

import { useId, useState, type FormEvent } from 'react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_REDEN, type Sluiting, type SluitingSoort } from '@/lib/club/sluiting/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SLUITING } from '@/lib/aiyourgym/taal/woorden/club/sluiting'

// Een sluitingsdag toevoegen of wijzigen: datum, voor welke vestiging(en),
// dicht of open met andere tijden, en de reden.

export interface SluitingFormulierProps {
  /** Bij wijzigen: de bestaande regel. */
  begin?: Sluiting
  /** Bij een nieuwe regel: de datum waarmee het formulier opent. */
  standaardDatum: string
  onKlaar: (tekst: string) => void
  onAnnuleer?: () => void
}

interface Staat {
  datum: string
  vestiging: string
  soort: SluitingSoort
  van: string
  tot: string
  reden: string
}

function beginStaat(begin: Sluiting | undefined, datum: string): Staat {
  return {
    datum: begin?.datum ?? datum,
    vestiging: begin?.vestiging ?? '',
    soort: begin?.soort ?? 'gesloten',
    van: begin?.van ?? '09:00',
    tot: begin?.tot ?? '14:00',
    reden: begin?.reden ?? '',
  }
}

export function SluitingFormulier({ begin, standaardDatum, onKlaar, onAnnuleer }: SluitingFormulierProps) {
  const vestigingen = useVestigingen()
  const t = useTekst(SLUITING).formulier
  const id = useId()
  const [s, setS] = useState<Staat>(() => beginStaat(begin, standaardDatum))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = <K extends keyof Staat>(k: K, v: Staat[K]) => setS((oud) => ({ ...oud, [k]: v }))

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = { ...s, vestiging: s.vestiging || null }
    const uit = begin ? await stuur(`/api/club/sluiting/${begin.id}`, 'PATCH', body) : await stuur('/api/club/sluiting', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    if (!begin) setS(beginStaat(undefined, s.datum))
    onKlaar(begin ? t.aangepast : t.toegevoegd)
  }

  return (
    <form className="club-sluiting-form" onSubmit={(e) => void bewaar(e)} aria-describedby={fout ? `${id}-fout` : undefined}>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{t.datum}</span>
          <input className="club-invoer" type="date" required value={s.datum} onChange={(e) => zet('datum', e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{t.vestiging}</span>
          <select className="club-invoer" value={s.vestiging} onChange={(e) => zet('vestiging', e.target.value)}>
            <option value="">{t.alleVestigingen}</option>
            {vestigingen.map((v) => (
              <option key={v.sleutel} value={v.sleutel}>
                {v.naam}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="club-sluiting-soort">
        <legend className="club-label">{t.dieDag}</legend>
        <div className="club-segment" role="group" aria-label={t.soort}>
          <button type="button" aria-pressed={s.soort === 'gesloten'} onClick={() => zet('soort', 'gesloten')}>
            {t.gesloten}
          </button>
          <button type="button" aria-pressed={s.soort === 'afwijkend'} onClick={() => zet('soort', 'afwijkend')}>
            {t.andereTijden}
          </button>
        </div>
      </fieldset>

      {s.soort === 'afwijkend' && (
        <div className="club-formrij">
          <label className="club-veld">
            <span>{t.openVan}</span>
            <input className="club-invoer" type="time" required value={s.van} onChange={(e) => zet('van', e.target.value)} />
          </label>
          <label className="club-veld">
            <span>{t.tot}</span>
            <input className="club-invoer" type="time" required value={s.tot} onChange={(e) => zet('tot', e.target.value)} />
          </label>
        </div>
      )}

      <label className="club-veld">
        <span>{t.reden}</span>
        <input className="club-invoer" required maxLength={MAX_REDEN} value={s.reden} placeholder={t.redenVoorbeeld} onChange={(e) => zet('reden', e.target.value)} />
      </label>

      <div className="club-sluiting-formacties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? t.opslaanBezig : begin ? t.opslaan : t.toevoegen}
        </button>
        {onAnnuleer && (
          <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>
            {t.annuleren}
          </button>
        )}
      </div>
      <div role="alert" aria-live="assertive">
        {fout && (
          <p id={`${id}-fout`} className="club-melding club-melding--fout">
            {fout}
          </p>
        )}
      </div>
    </form>
  )
}
