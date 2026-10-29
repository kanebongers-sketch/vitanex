'use client'

import { useId, useState, type FormEvent } from 'react'
import { KLEUREN, type AfspraakType } from '@/lib/club/afspraken/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import { stuur } from '@/components/club/leden/stuur'
import type { Persoon } from './AfspraakFormulier'

// Een soort afspraak maken of wijzigen: naam, duur, buffer, kleur, wie het
// geeft en de regels voor de ledenapp.

interface Props {
  type: AfspraakType | null
  medewerkers: readonly Persoon[]
  onKlaar: (melding: string) => void
  onSluit: () => void
}

type Concept = Omit<AfspraakType, 'id' | 'volgorde'>

const LEEG: Concept = { naam: '', duurMin: 30, bufferMin: 0, kleur: 'amber', medewerkerIds: [], appBoekbaar: true, boekenUrenVooraf: 12, annulerenUrenVooraf: 24, actief: true }

export function TypeFormulier({ type, medewerkers, onKlaar, onSluit }: Props) {
  const id = useId()
  const [c, setC] = useState<Concept>(type ?? LEEG)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const w = useTekst(AFSPRAKEN)
  const t = w.typeFormulier
  const zet = <K extends keyof Concept>(k: K, w: Concept[K]) => setC((oud) => ({ ...oud, [k]: w }))
  const wissel = (mid: string) => zet('medewerkerIds', c.medewerkerIds.includes(mid) ? c.medewerkerIds.filter((x) => x !== mid) : [...c.medewerkerIds, mid])

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = type ? await stuur(`/api/club/afspraken/typen/${type.id}`, 'PATCH', c) : await stuur('/api/club/afspraken/typen', 'POST', c)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar(type ? t.opgeslagen(c.naam) : t.toegevoegd(c.naam))
  }

  const getal = (v: string) => (v === '' ? 0 : Number(v))

  return (
    <form className="club-afspraken-form" onSubmit={opslaan} aria-labelledby={`${id}-kop`}>
      <h2 id={`${id}-kop`} className="club-afspraken-paneelkop">{type ? t.wijzigTitel : t.nieuwTitel}</h2>
      <label className="club-veld"><span>{t.naam}</span>
        <input className="club-invoer" value={c.naam} maxLength={80} required onChange={(e) => zet('naam', e.target.value)} placeholder={t.naamPlaats} />
      </label>
      <div className="club-formrij">
        <label className="club-veld"><span>{t.duur}</span>
          <input type="number" className="club-invoer" min={5} max={480} step={5} required value={c.duurMin} onChange={(e) => zet('duurMin', getal(e.target.value))} />
        </label>
        <label className="club-veld"><span>{t.buffer}</span>
          <input type="number" className="club-invoer" min={0} max={120} step={5} value={c.bufferMin} onChange={(e) => zet('bufferMin', getal(e.target.value))} />
        </label>
      </div>
      <fieldset className="club-afspraken-kleuren">
        <legend>{t.kleur}</legend>
        {KLEUREN.map((k) => (
          <label key={k} data-kleur={k} title={w.kleur[k]}>
            <input type="radio" name={`${id}-kleur`} value={k} checked={c.kleur === k} onChange={() => zet('kleur', k)} />
            <span className="club-afspraken-stip" aria-hidden />
            <span className="club-sr">{w.kleur[k]}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="club-afspraken-wie">
        <legend>{t.wie}</legend>
        <p className="club-hint">{t.wieHint}</p>
        {medewerkers.map((m) => (
          <label key={m.id} className="club-afspraken-vink">
            <input type="checkbox" checked={c.medewerkerIds.includes(m.id)} onChange={() => wissel(m.id)} /> {m.naam}
          </label>
        ))}
      </fieldset>
      <fieldset className="club-afspraken-wie">
        <legend>{t.ledenapp}</legend>
        <label className="club-afspraken-vink">
          <input type="checkbox" checked={c.appBoekbaar} onChange={(e) => zet('appBoekbaar', e.target.checked)} /> {t.zelfBoeken}
        </label>
        <div className="club-formrij">
          <label className="club-veld"><span>{t.boekenTot}</span>
            <input type="number" className="club-invoer" min={0} max={336} value={c.boekenUrenVooraf} onChange={(e) => zet('boekenUrenVooraf', getal(e.target.value))} />
          </label>
          <label className="club-veld"><span>{t.annulerenTot}</span>
            <input type="number" className="club-invoer" min={0} max={336} value={c.annulerenUrenVooraf} onChange={(e) => zet('annulerenUrenVooraf', getal(e.target.value))} />
          </label>
        </div>
      </fieldset>
      <label className="club-afspraken-vink">
        <input type="checkbox" checked={c.actief} onChange={(e) => zet('actief', e.target.checked)} /> {t.actief}
      </label>
      <div aria-live="assertive">{fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}</div>
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? t.opslaanBezig : t.opslaan}</button>
        <button type="button" className="club-knop" onClick={onSluit} disabled={bezig}>{t.annuleren}</button>
      </div>
    </form>
  )
}
