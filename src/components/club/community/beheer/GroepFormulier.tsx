'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_NAAM, MAX_UITLEG, TOEGANG_LABEL, TOEGANG_SOORTEN, type Groep, type Toegang } from '@/lib/club/community/model'

// Een communitygroep maken of wijzigen. Na opslaan opent de groep.

export interface Keuze {
  id: string
  naam: string
}

interface Props {
  begin?: Groep
  vestigingen: { sleutel: string; naam: string }[]
  challenges: Keuze[]
  lestypen: Keuze[]
  /** De pagina zonder formulier; altijd met ?v=..., dus &g=<id> kan erachter. */
  terugHref: string
}

export function GroepFormulier({ begin, vestigingen, challenges, lestypen, terugHref }: Props) {
  const router = useRouter()
  const id = useId()
  const [naam, setNaam] = useState(begin?.naam ?? '')
  const [uitleg, setUitleg] = useState(begin?.uitleg ?? '')
  const [toegang, setToegang] = useState<Toegang>(begin?.toegang ?? 'open')
  const [vestiging, setVestiging] = useState(begin?.vestiging ?? '')
  const [challengeId, setChallengeId] = useState(begin?.challengeId ?? '')
  const [lestypeId, setLestypeId] = useState(begin?.lestypeId ?? '')
  const [ranglijst, setRanglijst] = useState(begin?.ranglijst ?? true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = { naam, uitleg, toegang, vestiging: vestiging || null, challengeId: challengeId || null, lestypeId: lestypeId || null, ranglijst }
    const uit = begin ? await stuur(`/api/club/community/groepen/${encodeURIComponent(begin.id)}`, 'PATCH', body) : await stuur('/api/club/community/groepen', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    const nieuwId = typeof uit.data === 'object' && uit.data !== null && 'id' in uit.data ? String((uit.data as { id: unknown }).id) : begin?.id
    router.push(nieuwId ? `${terugHref}&g=${encodeURIComponent(nieuwId)}` : terugHref, { scroll: false })
    router.refresh()
  }

  return (
    <form className="club-cmb-kaart club-cmb-formulier" onSubmit={(e) => void bewaar(e)} aria-labelledby={`${id}-kop`} aria-describedby={fout ? `${id}-fout` : undefined}>
      <h2 id={`${id}-kop`}>{begin ? 'Groep wijzigen' : 'Nieuwe groep'}</h2>
      <label className="club-veld">
        <span>Naam</span>
        <input className="club-invoer" required minLength={2} maxLength={MAX_NAAM} value={naam} placeholder="Bijvoorbeeld: Ochtendploeg" onChange={(e) => setNaam(e.target.value)} />
      </label>
      <label className="club-veld">
        <span>Uitleg voor leden (mag leeg)</span>
        <textarea className="club-invoer" rows={3} maxLength={MAX_UITLEG} value={uitleg} onChange={(e) => setUitleg(e.target.value)} />
      </label>
      <fieldset className="club-veld">
        <legend>Wie mag erin</legend>
        {TOEGANG_SOORTEN.map((t) => (
          <label key={t} className="club-cm-keus">
            <input type="radio" name={`${id}-toegang`} checked={toegang === t} onChange={() => setToegang(t)} />
            <span>
              <strong>{TOEGANG_LABEL[t].label}</strong>: {TOEGANG_LABEL[t].uitleg}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="club-cmb-rij">
        <label className="club-veld">
          <span>Vestiging</span>
          <select className="club-invoer" value={vestiging} onChange={(e) => setVestiging(e.target.value)}>
            <option value="">Alle vestigingen</option>
            {vestigingen.map((v) => (
              <option key={v.sleutel} value={v.sleutel}>
                {v.naam}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Hoort bij een les (mag leeg)</span>
          <select className="club-invoer" value={lestypeId} onChange={(e) => setLestypeId(e.target.value)}>
            <option value="">Geen les</option>
            {lestypen.map((l) => (
              <option key={l.id} value={l.id}>
                {l.naam}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="club-veld">
        <span>Hoort bij een challenge (de ranglijst volgt dan de challenge)</span>
        <select className="club-invoer" value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>
          <option value="">Geen challenge: ranglijst op bezoekdagen deze maand</option>
          {challenges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.naam}
            </option>
          ))}
        </select>
      </label>
      <label className="club-cm-keus">
        <input type="checkbox" checked={ranglijst} onChange={(e) => setRanglijst(e.target.checked)} />
        <span>Ranglijst tonen. Alleen leden die er zelf voor kiezen staan erop, met voornaam en initiaal.</span>
      </label>
      <div className="club-cmb-knoppen">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? 'Opslaan...' : begin ? 'Wijzigingen opslaan' : 'Groep maken'}
        </button>
        <Link href={begin ? `${terugHref}&g=${encodeURIComponent(begin.id)}` : terugHref} scroll={false} className="club-knop club-knop--stil">
          Annuleren
        </Link>
      </div>
      {fout && (
        <p id={`${id}-fout`} className="club-melding club-melding--fout" role="alert">
          {fout}
        </p>
      )}
    </form>
  )
}
