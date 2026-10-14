'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Oefening } from '@/lib/club/training/rijen'
import { leesSpierKeuze, type Spier } from '@/lib/club/training/spieren'
import {
  MATERIAAL_LABEL, MATERIALEN, NIVEAU_LABEL, NIVEAUS, PATROON_LABEL, PATRONEN, SPIERGROEP_LABEL, SPIERGROEPEN, ZONE_LABEL, ZONES,
  type Zone,
} from '@/lib/club/training/typen'
import { stuur } from './api'
import { SpierKeuze } from './SpierKeuze'

interface OefeningFormulierProps {
  oefening: Oefening | null
  onKlaar: () => void
}

/** Een oefening toevoegen of bewerken. Verwijderen kan niet (schema's verwijzen ernaar): zet hem op inactief. */
export function OefeningFormulier({ oefening, onKlaar }: OefeningFormulierProps) {
  const router = useRouter()
  const [belast, setBelast] = useState<Zone[]>(oefening?.belast ?? [])
  const [spieren, setSpieren] = useState<{ primair: Spier[]; secundair: Spier[] }>({
    primair: oefening?.spierenPrimair ?? [],
    secundair: oefening?.spierenSecundair ?? [],
  })
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  async function bewaar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const keuze = leesSpierKeuze(spieren.primair, spieren.secundair)
    if (!keuze.ok) return setFout(keuze.fout)
    const body = {
      naam: f.get('naam'), spiergroep: f.get('spiergroep'), materiaal: f.get('materiaal'), niveau: f.get('niveau'),
      patroon: f.get('patroon'), belast, uitleg: f.get('uitleg'), aandachtspunten: f.get('aandachtspunten'), actief: f.get('actief') === 'on',
      spierenPrimair: keuze.primair, spierenSecundair: keuze.secundair,
    }
    setBezig(true)
    setFout(null)
    const u = oefening ? await stuur(`/oefeningen/${oefening.id}`, 'PATCH', body) : await stuur('/oefeningen', 'POST', body)
    setBezig(false)
    if (!u.ok) return setFout(u.fout)
    router.refresh()
    onKlaar()
  }

  const wissel = (z: Zone) => setBelast((b) => (b.includes(z) ? b.filter((x) => x !== z) : [...b, z]))

  return (
    <form className="club-training-form" onSubmit={bewaar}>
      <label className="club-veld">
        <span>Naam</span>
        <input name="naam" className="club-invoer" defaultValue={oefening?.naam} required maxLength={80} autoFocus />
      </label>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Spiergroep (grof)</span>
          <select name="spiergroep" className="club-invoer" defaultValue={oefening?.spiergroep ?? 'borst'}>
            {SPIERGROEPEN.map((s) => <option key={s} value={s}>{SPIERGROEP_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>Materiaal</span>
          <select name="materiaal" className="club-invoer" defaultValue={oefening?.materiaal ?? 'geen'}>
            {MATERIALEN.map((m) => <option key={m} value={m}>{MATERIAAL_LABEL[m]}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>Niveau</span>
          <select name="niveau" className="club-invoer" defaultValue={oefening?.niveau ?? 1}>
            {NIVEAUS.map((n) => <option key={n} value={n}>{NIVEAU_LABEL[n]}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>Bewegingspatroon</span>
          <select name="patroon" className="club-invoer" defaultValue={oefening?.patroon ?? ''}>
            <option value="">Geen</option>
            {PATRONEN.map((p) => <option key={p} value={p}>{PATROON_LABEL[p]}</option>)}
          </select>
        </label>
      </div>
      <SpierKeuze naam={oefening?.naam ?? ''} primair={spieren.primair} secundair={spieren.secundair} onWijzig={setSpieren} />
      <fieldset className="club-training-fieldset">
        <legend className="club-label">Belast (het voorstel slaat hem over bij een blessure hier)</legend>
        <div className="club-training-chips">
          {ZONES.map((z) => (
            <button key={z} type="button" className="club-training-keuze" aria-pressed={belast.includes(z)} onClick={() => wissel(z)}>
              {ZONE_LABEL[z]}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="club-veld">
        <span>Uitvoering</span>
        <textarea name="uitleg" className="club-invoer" defaultValue={oefening?.uitleg ?? ''} maxLength={1200} rows={4} />
      </label>
      <label className="club-veld">
        <span>Aandachtspunten en veiligheid</span>
        <textarea name="aandachtspunten" className="club-invoer" defaultValue={oefening?.aandachtspunten ?? ''} maxLength={600} rows={3} />
      </label>
      <label className="club-training-vink">
        <input type="checkbox" name="actief" defaultChecked={oefening?.actief ?? true} />
        <span>Actief (zichtbaar in de kiezer en het voorstel)</span>
      </label>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? 'Opslaan...' : 'Opslaan'}</button>
        <button type="button" className="club-knop club-knop--stil" onClick={onKlaar}>Annuleren</button>
      </div>
    </form>
  )
}
