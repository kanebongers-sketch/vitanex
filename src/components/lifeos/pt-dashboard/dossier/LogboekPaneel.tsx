'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import {
  MAX_NOTITIE_TEKST, NOTITIE_SOORTEN, NOTITIE_SOORT_HINT, NOTITIE_SOORT_LABEL, leesKlantNotitie, sorteerNotities, telNotities,
  type KlantNotitie, type NotitieSoort,
} from '@/lib/lifeos/pt-dashboard/klantnotities'
import { leesLeeg, ptApi } from '../api'
import { Keuzes, Veld } from '../velden'

// Container: het logboek van één klant — gedateerde notities, nieuwste eerst,
// met toevoegen en verwijderen. Sessies (training + no-show) worden geteld.

interface Props {
  code: string
  klantId: string
  vandaag: string
  notities: KlantNotitie[]
  onWijzig: (n: KlantNotitie[]) => void
  /** Meekijken (eigenaar): geen toevoegen of verwijderen. */
  alleenLezen?: boolean
}

const SOORT_OPTIES = NOTITIE_SOORTEN.map((s) => ({ waarde: s, label: NOTITIE_SOORT_LABEL[s] }))

function NotitieFormulier({ code, klantId, vandaag, onOpgeslagen, onAnnuleer }: { code: string; klantId: string; vandaag: string; onOpgeslagen: (n: KlantNotitie) => void; onAnnuleer: () => void }) {
  const [datum, setDatum] = useState(vandaag)
  const [soort, setSoort] = useState<NotitieSoort>('training')
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, `klanten/${klantId}/notities`, 'POST', { datum, soort, tekst }, leesKlantNotitie)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onOpgeslagen(uit.waarde)
  }

  return (
    <form className="ptd-kaart ffdos-logboek-form" onSubmit={(e) => void opslaan(e)} aria-label="Nieuwe notitie">
      <div className="ffdos-velden">
        <Veld label="Datum" id="ffdos-notitie-datum">
          <input id="ffdos-notitie-datum" type="date" className="ptd-invoer" value={datum} max={vandaag} onChange={(e) => setDatum(e.target.value)} required />
        </Veld>
        <Keuzes label="Soort" opties={SOORT_OPTIES} waarde={soort} onKies={(s) => s && setSoort(s)} />
        <Veld label="Notitie" id="ffdos-notitie-tekst" hint={NOTITIE_SOORT_HINT[soort]}>
          <textarea id="ffdos-notitie-tekst" className="ptd-invoer" rows={4} maxLength={MAX_NOTITIE_TEKST} value={tekst} onChange={(e) => setTekst(e.target.value)} required autoFocus />
        </Veld>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || tekst.trim().length === 0}>{bezig ? 'Opslaan…' : 'Notitie opslaan'}</button>
        <button type="button" className="ptd-knop" onClick={onAnnuleer} disabled={bezig}>Annuleer</button>
      </div>
    </form>
  )
}

export function LogboekPaneel({ code, klantId, vandaag, notities, onWijzig, alleenLezen = false }: Props) {
  const [nieuw, setNieuw] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const lijst = useMemo(() => sorteerNotities(notities), [notities])
  const t = telNotities(notities)

  async function verwijder(n: KlantNotitie) {
    if (!window.confirm(`Notitie van ${dagKort(n.datum)} verwijderen?`)) return
    setFout(null)
    const uit = await ptApi(code, `klanten/${klantId}/notities/${n.id}`, 'DELETE', undefined, leesLeeg)
    if (!uit.ok) return setFout(uit.fout)
    onWijzig(notities.filter((x) => x.id !== n.id))
  }

  return (
    <section className="ptd-sectie" aria-labelledby="ffdos-logboek-kop">
      <div className="ptd-sectiekop">
        <h2 id="ffdos-logboek-kop">Logboek</h2>
        <span>{t.trainingen} {t.trainingen === 1 ? 'training' : 'trainingen'}{t.noShows > 0 ? ` · ${t.noShows} no-show${t.noShows === 1 ? '' : 's'}` : ''}</span>
      </div>
      <p className="ptd-hint">Wat er per training, gesprek of over voeding is gebeurd en afgesproken. Gezondheidsinformatie hoort in de intake.</p>

      {alleenLezen ? null : nieuw ? (
        <NotitieFormulier
          code={code}
          klantId={klantId}
          vandaag={vandaag}
          onOpgeslagen={(n) => {
            onWijzig([n, ...notities])
            setNieuw(false)
          }}
          onAnnuleer={() => setNieuw(false)}
        />
      ) : (
        <button type="button" className="ptd-knop ptd-knop--primair ffdos-start" onClick={() => setNieuw(true)}>
          <Plus size={18} aria-hidden /> Notitie toevoegen
        </button>
      )}

      {fout ? <Foutmelding bericht={fout} /> : null}
      {lijst.length === 0 ? (
        <p className="ptd-leeg">Nog geen notities. Schrijf na elke training kort op wat je deed en wat de volgende keer anders moet.</p>
      ) : (
        <ul className="ptd-lijst">
          {lijst.map((n) => (
            <li key={n.id} className="ptd-rij">
              <div className="ptd-rij-kop">
                <span className="ptd-naam">{dagKort(n.datum)}</span>
                <span className={n.soort === 'no_show' ? 'ptd-badge ptd-badge--let-op' : 'ptd-badge'}>{NOTITIE_SOORT_LABEL[n.soort]}</span>
              </div>
              <p className="ptd-tekst">{n.tekst}</p>
              {alleenLezen ? null : (
                <div className="ptd-acties">
                  <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--gevaar" onClick={() => void verwijder(n)} aria-label={`Notitie van ${dagKort(n.datum)} verwijderen`}>
                    <Trash2 size={14} aria-hidden /> Verwijder
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
