'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Pause, Play, Timer, Wind, X } from 'lucide-react'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { SchemaToestel } from './SchemaToestel'

// Het hart van de voorpagina: een echte oefening uit de bibliotheek van Club,
// zoals trainer en lid hem zien. Kies een oefening, speel de beweging af of
// zet hem stil op begin of eind, lees de genummerde kernpunten en de fouten
// met correctie, en zie ernaast hoe het schema in de ledenapp staat.

type Stand = 'loop' | 'start' | 'eind'
type Paneel = 'fouten' | 'uitvoering' | 'adem'

const PANELEN: { sleutel: Paneel; label: string }[] = [
  { sleutel: 'fouten', label: 'Fouten en correctie' },
  { sleutel: 'uitvoering', label: 'Opstelling en stappen' },
  { sleutel: 'adem', label: 'Ademhaling en tempo' },
]

interface CoachingDemoProps {
  oefeningen: readonly VoorbeeldOefening[]
}

export function CoachingDemo({ oefeningen }: CoachingDemoProps) {
  const [index, setIndex] = useState(0)
  const [stand, setStand] = useState<Stand>('loop')
  const [paneel, setPaneel] = useState<Paneel>('fouten')
  const o = oefeningen[index]
  if (!o) return null

  function kies(i: number) {
    setIndex(i)
    setStand('loop')
  }

  return (
    <div className="ayg-cd">
      <div className="ayg-cd-keuze" role="group" aria-label="Kies een oefening">
        {oefeningen.map((x, i) => (
          <button key={x.naam} type="button" aria-pressed={i === index} onClick={() => kies(i)}>
            <img src={x.beeldStart} alt="" width={48} height={48} loading="lazy" decoding="async" />
            <span>{x.kort}</span>
          </button>
        ))}
      </div>
      <div className="ayg-cd-raster">
        <article className="ayg-cd-kaart" aria-labelledby="ayg-cd-naam">
          <Speler o={o} stand={stand} zet={setStand} />
          <div className="ayg-cd-coaching">
            <div>
              <p className="ayg-cd-boven">
                Oefening {index + 1} van {oefeningen.length} · {o.voorschrift}
              </p>
              <h3 className="ayg-cd-naam" id="ayg-cd-naam">
                {o.naam}
              </h3>
            </div>
            <ol className="ayg-cd-kern" aria-label="Kernpunten">
              {o.coaching.kernpunten.map((k, i) => (
                <li key={k.punt}>
                  <span className="ayg-cd-nr" aria-hidden>
                    {i + 1}
                  </span>
                  <span>
                    <strong>{k.punt}</strong>
                    <span>{k.uitleg}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="ayg-cd-tabs" role="group" aria-label="Meer coaching">
              {PANELEN.map((p) => (
                <button key={p.sleutel} type="button" aria-pressed={paneel === p.sleutel} onClick={() => setPaneel(p.sleutel)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="ayg-cd-paneel" aria-live="polite">
              <PaneelInhoud o={o} paneel={paneel} />
            </div>
          </div>
        </article>
        <SchemaToestel oefeningen={oefeningen} gekozen={index} onKies={kies} />
      </div>
    </div>
  )
}

function Speler({ o, stand, zet }: { o: VoorbeeldOefening; stand: Stand; zet: (s: Stand) => void }) {
  const speelt = stand === 'loop'
  return (
    <figure className="ayg-cd-speler" data-stand={stand}>
      <div className="ayg-cd-beeld" key={o.naam}>
        <img src={o.beeldStart} alt={`${o.naam}, beginhouding`} width={512} height={512} decoding="async" />
        <img className="ayg-cd-eind" src={o.beeldEind} alt={`${o.naam}, eindhouding`} width={512} height={512} decoding="async" />
      </div>
      <figcaption className="ayg-cd-bediening">
        <button type="button" className="ayg-cd-speel" onClick={() => zet(speelt ? 'start' : 'loop')}>
          {speelt ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
          {speelt ? 'Pauze' : 'Afspelen'}
        </button>
        <span className="ayg-cd-standen">
          <button type="button" aria-pressed={stand === 'start'} onClick={() => zet('start')}>
            Begin
          </button>
          <button type="button" aria-pressed={stand === 'eind'} onClick={() => zet('eind')}>
            Eind
          </button>
        </span>
      </figcaption>
    </figure>
  )
}

function PaneelInhoud({ o, paneel }: { o: VoorbeeldOefening; paneel: Paneel }) {
  const c = o.coaching
  if (paneel === 'fouten') {
    return (
      <ul className="ayg-cd-fouten">
        {c.fouten.map((f) => (
          <li key={f.fout}>
            <span className="ayg-cd-fout">
              <X size={15} aria-hidden />
              <span>
                <span className="ayg-sr">Fout: </span>
                {f.fout}
              </span>
            </span>
            <span className="ayg-cd-beter">
              <Check size={15} aria-hidden />
              <span>
                <span className="ayg-sr">Beter: </span>
                {f.beter}
              </span>
            </span>
          </li>
        ))}
      </ul>
    )
  }
  if (paneel === 'uitvoering') {
    return (
      <div className="ayg-cd-uitvoering">
        {c.opstelling.map((z) => (
          <p key={z}>{z}</p>
        ))}
        <ol>
          {c.stappen.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    )
  }
  return (
    <dl className="ayg-cd-feiten">
      <div>
        <dt>
          <Wind size={14} aria-hidden /> Ademhaling
        </dt>
        <dd>{c.ademhaling}</dd>
      </div>
      <div>
        <dt>
          <Timer size={14} aria-hidden /> Tempo
        </dt>
        <dd>{c.tempo}</dd>
      </div>
      {c.makkelijker && (
        <div>
          <dt>
            <ChevronDown size={14} aria-hidden /> Makkelijker
          </dt>
          <dd>{c.makkelijker}</dd>
        </div>
      )}
      {c.zwaarder && (
        <div>
          <dt>
            <ChevronUp size={14} aria-hidden /> Zwaarder
          </dt>
          <dd>{c.zwaarder}</dd>
        </div>
      )}
    </dl>
  )
}
