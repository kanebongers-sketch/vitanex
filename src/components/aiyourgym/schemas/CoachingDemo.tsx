'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Pause, Play, Timer, Wind, X } from 'lucide-react'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { OefTegel } from '@/components/aiyourgym/mockups/OefTegel'
import { Oefenbeeld } from '@/components/aiyourgym/mockups/Oefenbeeld'
import type { Stand3d } from '@/components/club/training/drie/Oefening3d'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/schemas'
import { SchemaToestel } from './SchemaToestel'

// Het hart van de voorpagina: een echte oefening uit de bibliotheek van Club,
// zoals trainer en lid hem zien. Kies een oefening, speel de beweging van ons
// eigen 3D-figuur af of zet hem stil op begin of eind, lees de genummerde
// kernpunten en de fouten met correctie, en zie ernaast hoe het schema in de
// ledenapp staat. Een 3D-doek dat van oefening wisselt.
// De coaching zelf komt uit de oefenbibliotheek van Club, in de taal van de
// pagina (woorden/website/coaching.ts).
type Paneel = 'fouten' | 'uitvoering' | 'adem'
type Teksten = (typeof SCHEMA_SCHERMEN)['nl']

const PANELEN: readonly Paneel[] = ['fouten', 'uitvoering', 'adem']

interface CoachingDemoProps {
  oefeningen: readonly VoorbeeldOefening[]
}

export function CoachingDemo({ oefeningen }: CoachingDemoProps) {
  const [index, setIndex] = useState(0)
  const [stand, setStand] = useState<Stand3d>('speelt')
  const [paneel, setPaneel] = useState<Paneel>('fouten')
  const t = useTekst(SCHEMA_SCHERMEN)
  const d = t.demo
  const o = oefeningen[index]
  if (!o) return null

  function kies(i: number) {
    setIndex(i)
    setStand('speelt')
  }

  return (
    <div className="ayg-cd">
      <div className="ayg-cd-keuze" role="group" aria-label={d.kiesOefening}>
        {oefeningen.map((x, i) => (
          <button key={x.naam} type="button" aria-pressed={i === index} onClick={() => kies(i)}>
            <OefTegel naam={x.naam} maat={48} />
            <span>{x.kort}</span>
          </button>
        ))}
      </div>
      <div className="ayg-cd-raster">
        <article className="ayg-cd-kaart" aria-labelledby="ayg-cd-naam">
          <Speler o={o} stand={stand} zet={setStand} t={t} />
          <div className="ayg-cd-coaching">
            <div>
              <p className="ayg-cd-boven">
                {d.oefeningVan(index + 1, oefeningen.length)} · {t.voorschrift(o.voorschrift)}
              </p>
              <h3 className="ayg-cd-naam" id="ayg-cd-naam">
                {o.naam}
              </h3>
            </div>
            <ol className="ayg-cd-kern" aria-label={d.kernpunten}>
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
            <div className="ayg-cd-tabs" role="group" aria-label={d.meerCoaching}>
              {PANELEN.map((p) => (
                <button key={p} type="button" aria-pressed={paneel === p} onClick={() => setPaneel(p)}>
                  {d.panelen[p]}
                </button>
              ))}
            </div>
            <div className="ayg-cd-paneel" aria-live="polite">
              <PaneelInhoud o={o} paneel={paneel} t={t} />
            </div>
          </div>
        </article>
        <SchemaToestel oefeningen={oefeningen} gekozen={index} onKies={kies} />
      </div>
    </div>
  )
}

interface SpelerProps {
  o: VoorbeeldOefening
  stand: Stand3d
  zet: (s: Stand3d) => void
  t: Teksten
}

function Speler({ o, stand, zet, t }: SpelerProps) {
  const speelt = stand === 'speelt'
  const d = t.demo
  return (
    <figure className="ayg-cd-speler">
      <div className="ayg-cd-beeld">
        <Oefenbeeld naam={o.naam} stand={stand} label={d.als3d(o.naam)} className="ayg-3d--vul" />
      </div>
      <figcaption className="ayg-cd-bediening">
        <button type="button" className="ayg-cd-speel" onClick={() => zet(speelt ? 'begin' : 'speelt')}>
          {speelt ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
          {speelt ? d.pauze : d.afspelen}
        </button>
        <span className="ayg-cd-standen">
          <button type="button" aria-pressed={stand === 'begin'} onClick={() => zet('begin')}>
            {d.begin}
          </button>
          <button type="button" aria-pressed={stand === 'eind'} onClick={() => zet('eind')}>
            {d.eind}
          </button>
        </span>
      </figcaption>
    </figure>
  )
}

function PaneelInhoud({ o, paneel, t }: { o: VoorbeeldOefening; paneel: Paneel; t: Teksten }) {
  const c = o.coaching
  const d = t.demo
  if (paneel === 'fouten') {
    return (
      <ul className="ayg-cd-fouten">
        {c.fouten.map((f) => (
          <li key={f.fout}>
            <span className="ayg-cd-fout">
              <X size={15} aria-hidden />
              <span>
                <span className="ayg-sr">{d.fout}</span>
                {f.fout}
              </span>
            </span>
            <span className="ayg-cd-beter">
              <Check size={15} aria-hidden />
              <span>
                <span className="ayg-sr">{d.beter}</span>
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
          <Wind size={14} aria-hidden /> {d.ademhaling}
        </dt>
        <dd>{c.ademhaling}</dd>
      </div>
      <div>
        <dt>
          <Timer size={14} aria-hidden /> {d.tempo}
        </dt>
        <dd>{c.tempo}</dd>
      </div>
      {c.makkelijker && (
        <div>
          <dt>
            <ChevronDown size={14} aria-hidden /> {d.makkelijker}
          </dt>
          <dd>{c.makkelijker}</dd>
        </div>
      )}
      {c.zwaarder && (
        <div>
          <dt>
            <ChevronUp size={14} aria-hidden /> {d.zwaarder}
          </dt>
          <dd>{c.zwaarder}</dd>
        </div>
      )}
    </dl>
  )
}
