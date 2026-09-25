import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { Strategie, TitelTekst } from '@/lib/lifeos/sportmerk/types'
import { FasenPlan } from './FasenPlan'
import { MargeTabel } from './MargeTabel'

// ─── Sportmerk — de strategie, gelezen ──────────────────────────────────────
// Presentational: props in, UI uit. Volgorde volgt de beslisvolgorde — eerst de
// keuze en waarom, dan de cijfers, dan wat we laten liggen, wat nog open staat
// en wat de volgende stap is.

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function formatDatum(sleutel: string): string {
  const [j, m, d] = sleutel.split('-').map(Number)
  return DATUM.format(new Date(Date.UTC(j, m - 1, d)))
}

export function SportmerkInhoud({ strategie }: { strategie: Strategie }) {
  const s = strategie
  return (
    <div className="spm">
      <section className="spm__hero" aria-labelledby="spm-richting">
        <p className="spm__boven">
          {s.fase} · keuze gemaakt op {formatDatum(s.richting.genomenOp)}
        </p>
        <h3 id="spm-richting" className="spm__richting">
          {s.richting.naam}
        </h3>
        <p className="spm__samenvatting">{s.richting.samenvatting}</p>
      </section>

      <Sectie titel="Waarom deze richting">
        <ul className="spm__lijst">
          {s.waarom.map((a) => (
            <li key={a.tekst}>
              {a.tekst}{' '}
              {a.bron ? (
                <a className="spm__bron" href={a.bron.url} target="_blank" rel="noopener noreferrer">
                  {a.bron.label}
                  <ArrowUpRight size={12} strokeWidth={2.2} aria-hidden="true" />
                  <span className="spm__sr"> (opent in nieuw tabblad)</span>
                </a>
              ) : (
                <span className="spm__eigen">eigen analyse</span>
              )}
            </li>
          ))}
        </ul>
      </Sectie>

      <Sectie titel="Doelgroep">
        <ul className="spm__lijst">
          {s.doelgroep.map((regel) => (
            <li key={regel}>{regel}</li>
          ))}
        </ul>
      </Sectie>

      <Sectie titel="Plan" intro="Elke fase heeft vooraf vastgelegde beslisregels. De drempels zijn startaannames, geen benchmarks.">
        <FasenPlan fasen={s.fasen} />
      </Sectie>

      <Sectie titel="Marge per order" intro="Schattingen tot er leveranciersprijzen zijn. De maatstaf is wat er na één betaalde klant overblijft.">
        <MargeTabel producten={s.producten} aannames={s.aannames} />
      </Sectie>

      <div className="spm__duo">
        <Sectie titel="Bewust geschrapt">
          <TitelTekstLijst items={s.geschrapt} />
        </Sectie>
        <Sectie titel="Risico's">
          <TitelTekstLijst items={s.risicos} />
        </Sectie>
      </div>

      <div className="spm__duo">
        <Sectie titel="Open beslissingen">
          <ul className="spm__lijst spm__lijst--open">
            {s.openBeslissingen.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Sectie>
        <Sectie titel="Volgende stappen">
          <ol className="spm__lijst spm__lijst--stappen">
            {s.volgendeStappen.map((stap) => (
              <li key={stap}>{stap}</li>
            ))}
          </ol>
        </Sectie>
      </div>

      <p className="spm__voet">Laatst herzien op {formatDatum(s.bijgewerkt)}.</p>
    </div>
  )
}

function Sectie({ titel, intro, children }: { titel: string; intro?: string; children: ReactNode }) {
  return (
    <section className="spm__sectie">
      <h3 className="spm__kop">{titel}</h3>
      {intro ? <p className="spm__intro">{intro}</p> : null}
      {children}
    </section>
  )
}

function TitelTekstLijst({ items }: { items: TitelTekst[] }) {
  return (
    <dl className="spm__tt">
      {items.map((i) => (
        <div key={i.titel}>
          <dt>{i.titel}</dt>
          <dd>{i.tekst}</dd>
        </div>
      ))}
    </dl>
  )
}
