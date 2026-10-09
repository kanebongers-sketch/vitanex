'use client'

import { useMemo, useState } from 'react'
import { Plus, Scale, Trash2 } from 'lucide-react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import {
  CHECK_SOORTEN, MAAT_VELDEN, METING_SOORT_LABEL, getalNl, sorteer, verschilSindsStart, verschilTekst, type Meting,
} from '@/lib/lifeos/pt-dashboard/metingen'
import { trajectWeek, verwachteMetingen, type MetingSoort } from '@/lib/lifeos/pt-dashboard/traject'
import { leesLeeg, ptApi } from '../api'
import { GewichtLijn } from './GewichtLijn'
import { MetingFormulier } from './MetingFormulier'
import { WegingFormulier } from './WegingFormulier'

// Container: de metingen van één klant. Wat er volgens de standaardopbouw
// gemeten had moeten zijn, het verschil sinds de start, gewicht als lijn,
// en de lijst (nieuwste eerst) met toevoegen/verwijderen. 'Snel wegen' legt
// alleen gewicht (en vet%) vast als losse weging, buiten de meetmomenten om.

interface Props {
  code: string
  klantId: string
  startdatum: string
  vandaag: string
  metingen: Meting[]
  onWijzig: (m: Meting[]) => void
  /** Meekijken (eigenaar): geen toevoegen of verwijderen. */
  alleenLezen?: boolean
}

function samenvatting(m: Meting): string {
  const maten = MAAT_VELDEN.filter((v) => m[v.sleutel] !== null).map((v) => `${v.label} ${getalNl(m[v.sleutel] as number)} ${v.eenheid}`)
  const krachtNaam = [m.krachtOefening, m.krachtRm ? `${m.krachtRm}RM` : null].filter(Boolean).join(' ')
  const kracht = m.krachtKg !== null ? [`Kracht${krachtNaam ? ` ${krachtNaam}` : ''} ${getalNl(m.krachtKg)} kg`] : []
  const cardio = m.cardiotest ? [`Cardio ${m.cardiotest}`] : []
  const fotos = m.fotosGemaakt ? ['foto’s gemaakt'] : []
  return [...maten, ...kracht, ...cardio, ...fotos].join(' · ')
}

function standaardSoort(metingen: readonly Meting[], week: number): MetingSoort {
  if (!metingen.some((m) => m.soort === 'start')) return 'start'
  return week >= 13 ? 'eind' : 'tussen'
}

export function MetingenPaneel({ code, klantId, startdatum, vandaag, metingen, onWijzig, alleenLezen = false }: Props) {
  const [nieuw, setNieuw] = useState<'meting' | 'weging' | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const week = trajectWeek(startdatum, vandaag)
  const verwacht = verwachteMetingen(week)
  const verschillen = useMemo(() => verschilSindsStart(metingen), [metingen])
  const nieuwsteEerst = useMemo(() => sorteer(metingen).reverse(), [metingen])
  const telling = (s: MetingSoort) => metingen.filter((m) => m.soort === s).length

  async function verwijder(m: Meting) {
    if (!window.confirm(`Meting van ${dagKort(m.datum)} verwijderen?`)) return
    setFout(null)
    const uit = await ptApi(code, `klanten/${klantId}/metingen/${m.id}`, 'DELETE', undefined, leesLeeg)
    if (!uit.ok) return setFout(uit.fout)
    onWijzig(metingen.filter((x) => x.id !== m.id))
  }

  return (
    <section className="ptd-sectie" aria-labelledby="ffdos-metingen-kop">
      <div className="ptd-sectiekop">
        <h2 id="ffdos-metingen-kop">Metingen</h2>
        <span>{metingen.length} {metingen.length === 1 ? 'meting' : 'metingen'}</span>
      </div>

      <ul className="ffdos-verwacht" aria-label="Metingen volgens de standaardopbouw">
        {CHECK_SOORTEN.map((s) => (
          <li key={s} className={verwacht[s] > telling(s) ? 'ffdos-verwacht--open' : undefined}>
            {METING_SOORT_LABEL[s]}: {telling(s)}
            {verwacht[s] > 0 ? ` van ${verwacht[s]} verwacht tot nu` : ''}
          </li>
        ))}
      </ul>

      {alleenLezen ? null : nieuw === 'meting' ? (
        <MetingFormulier
          code={code}
          klantId={klantId}
          vandaag={vandaag}
          standaardSoort={standaardSoort(metingen, week)}
          onOpgeslagen={(m) => {
            onWijzig([...metingen, m])
            setNieuw(null)
          }}
          onAnnuleer={() => setNieuw(null)}
        />
      ) : nieuw === 'weging' ? (
        <WegingFormulier
          code={code}
          klantId={klantId}
          vandaag={vandaag}
          onOpgeslagen={(m) => {
            onWijzig([...metingen, m])
            setNieuw(null)
          }}
          onAnnuleer={() => setNieuw(null)}
        />
      ) : (
        <div className="ptd-acties">
          <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => setNieuw('weging')}>
            <Scale size={18} aria-hidden /> Snel wegen
          </button>
          <button type="button" className="ptd-knop" onClick={() => setNieuw('meting')}>
            <Plus size={18} aria-hidden /> Volledige meting
          </button>
        </div>
      )}

      {verschillen.length > 0 ? (
        <div className="ptd-scroll">
          <table className="ptd-tabel">
            <caption className="sr-only">Verschil sinds de start</caption>
            <thead>
              <tr>
                <th scope="col">Sinds start</th>
                <th scope="col">Start</th>
                <th scope="col">Laatst</th>
                <th scope="col">Verschil</th>
              </tr>
            </thead>
            <tbody>
              {verschillen.map((v) => (
                <tr key={v.label}>
                  <th scope="row">{v.label}</th>
                  <td>{getalNl(v.van.waarde)} <small>{dagKort(v.van.datum)}</small></td>
                  <td>{getalNl(v.naar.waarde)} <small>{dagKort(v.naar.datum)}</small></td>
                  <td className="ffdos-verschil">{verschilTekst(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <GewichtLijn metingen={metingen} />

      {fout ? <Foutmelding bericht={fout} /> : null}
      {nieuwsteEerst.length === 0 ? (
        <p className="ptd-leeg">Nog geen metingen. Begin met de nulmeting: gewicht, omtrekmaten en foto’s, onder vaste omstandigheden.</p>
      ) : (
        <ul className="ptd-lijst">
          {nieuwsteEerst.map((m) => (
            <li key={m.id} className="ptd-rij">
              <div className="ptd-rij-kop">
                <span className="ptd-naam">{dagKort(m.datum)}</span>
                <span className={m.soort === 'weging' ? 'ptd-badge ptd-badge--stil' : 'ptd-badge'}>{METING_SOORT_LABEL[m.soort]}</span>
              </div>
              <p className="ptd-tekst">{samenvatting(m)}</p>
              {m.notitie ? <p className="ptd-hint">{m.notitie}</p> : null}
              {alleenLezen ? null : (
                <div className="ptd-acties">
                  <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--gevaar" onClick={() => void verwijder(m)} aria-label={`Meting van ${dagKort(m.datum)} verwijderen`}>
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
