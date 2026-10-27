'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Timer, Wind, X } from 'lucide-react'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { OefNr } from '@/components/aiyourgym/mockups/OefNr'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/schemas'
import { SchemaToestel } from './SchemaToestel'

// Een echte oefening uit de bibliotheek van Club, zoals trainer en lid hem zien:
// kies een oefening, lees de genummerde kernpunten, de fouten met correctie, de
// uitvoering en ademhaling, en zie ernaast hoe het schema in de ledenapp staat.
// Zonder oefenbeeld: die staan alleen achter het inloggen (besluit Kane 27-10-2026).
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
  const [paneel, setPaneel] = useState<Paneel>('fouten')
  const t = useTekst(SCHEMA_SCHERMEN)
  const d = t.demo
  const o = oefeningen[index]
  if (!o) return null

  function kies(i: number) {
    setIndex(i)
  }

  return (
    <div className="ayg-cd">
      <div className="ayg-cd-keuze" role="group" aria-label={d.kiesOefening}>
        {oefeningen.map((x, i) => (
          <button key={x.naam} type="button" aria-pressed={i === index} onClick={() => kies(i)}>
            <OefNr nr={i + 1} maat={40} />
            <span>{x.kort}</span>
          </button>
        ))}
      </div>
      <div className="ayg-cd-raster">
        <article className="ayg-cd-kaart ayg-cd-kaart--tekst" aria-labelledby="ayg-cd-naam">
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
