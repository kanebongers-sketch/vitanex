'use client'

import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Beschikbaarheid } from '@/lib/club/personeel/typen'
import { API, stuur, useActie } from './vraag'
import { dagMaand, weekdagKort } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

// Losse datums: verlof, vrij of ziek (een dag of een reeks), of juist extra
// beschikbaar op een dag waarop iemand normaal niet kan.

type Soort = 'verlof' | 'vrij' | 'ziek' | 'extra'

export function LosseDatums({ medewerkerId, regels, vandaag }: { medewerkerId: string; regels: Beschikbaarheid[]; vandaag: string }) {
  const [soort, setSoort] = useState<Soort>('verlof')
  const [van, setVan] = useState(vandaag)
  const [tot, setTot] = useState('')
  const [notitie, setNotitie] = useState('')
  const { bezig, fout, voerUit } = useActie()
  const taal = useTaal()
  const alles = useTekst(PERSONEEL)
  const tk = alles.los
  const komend = regels.filter((r) => (r.datumTot ?? r.datum ?? '') >= vandaag)
  const voorbij = regels.length - komend.length

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    const extra = soort === 'extra'
    await voerUit(
      () => stuur(`${API}/beschikbaarheid`, 'POST', { medewerkerId, datum: van, datumTot: tot || null, beschikbaar: extra, reden: extra ? null : soort, notitie }),
      () => {
        setTot('')
        setNotitie('')
      },
    )
  }

  return (
    <section className="club-kaart" aria-labelledby="club-personeel-los">
      <h2 id="club-personeel-los">{tk.titel}</h2>
      {komend.length === 0 ? (
        <p className="club-hint">{tk.niets}{voorbij > 0 ? tk.eerder(voorbij) : ''}</p>
      ) : (
        <ul className="club-lijst">
          {komend.map((r) => (
            <li key={r.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">
                  {weekdagKort(r.datum ?? vandaag, taal)} {dagMaand(r.datum ?? vandaag, taal)}
                  {r.datumTot && r.datumTot !== r.datum ? alles.team.totDag(`${weekdagKort(r.datumTot, taal)} ${dagMaand(r.datumTot, taal)}`) : ''}
                </span>
                {r.notitie && <span className="club-rij-sub">{r.notitie}</span>}
              </span>
              <span className={r.beschikbaar ? 'club-chip club-chip--ok' : r.reden === 'ziek' ? 'club-chip club-chip--let-op' : 'club-chip club-chip--info'}>
                {r.beschikbaar ? tk.extra : r.reden ? alles.labels.reden[r.reden] : tk.nietBeschikbaar}
              </span>
              <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={tk.verwijderen} disabled={bezig} onClick={() => voerUit(() => stuur(`${API}/beschikbaarheid/${r.id}`, 'DELETE'))}>
                <Trash2 aria-hidden size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="club-personeel-sectie" onSubmit={voegToe}>
        <div className="club-segment" role="group" aria-label={tk.soort}>
          {(['verlof', 'vrij', 'ziek', 'extra'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={soort === s} onClick={() => setSoort(s)}>
              {s === 'extra' ? tk.extra : alles.labels.reden[s]}
            </button>
          ))}
        </div>
        <div className="club-formrij">
          <label className="club-veld">
            <span>{tk.van}</span>
            <input className="club-invoer" type="date" required value={van} onChange={(e) => setVan(e.target.value)} />
          </label>
          <label className="club-veld">
            <span>{tk.totEnMet}</span>
            <input className="club-invoer" type="date" min={van} value={tot} onChange={(e) => setTot(e.target.value)} />
          </label>
        </div>
        <label className="club-veld">
          <span>{tk.notitie}</span>
          <input className="club-invoer" maxLength={200} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder={tk.notitiePlaats} />
        </label>
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {tk.toevoegen}
        </button>
      </form>
    </section>
  )
}
