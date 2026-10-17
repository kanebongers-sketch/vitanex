import { Check, ChevronDown, ChevronUp, Timer, Wind, X } from 'lucide-react'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import './coaching.css'

// De coaching van een oefening, zoals een trainer die op de vloer geeft:
// eerst de genummerde kernpunten groot (die onthoud je), dan opstelling,
// stappen, fouten met de correctie, ademhaling, tempo en varianten.
// Puur: alleen props in, markup uit. Werkt in de bibliotheek en in de ledenapp.

interface CoachingBlokProps {
  coaching: Coaching
  /** Kopniveau van de secties: h3 in de bibliotheek, h4 in de ledenapp. */
  kop?: 'h3' | 'h4'
}

export function Kernpunten({ coaching }: { coaching: Coaching }) {
  return (
    <ol className="club-coach-kern" aria-label="Kernpunten">
      {coaching.kernpunten.map((k, i) => (
        <li key={i} className="club-coach-kernpunt">
          <span className="club-coach-nummer" aria-hidden>{i + 1}</span>
          <span className="club-coach-kerntekst">
            <strong>{k.punt}</strong>
            <span>{k.uitleg}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function CoachingBlok({ coaching: c, kop: Kop = 'h3' }: CoachingBlokProps) {
  return (
    <div className="club-coach">
      <section>
        <Kop className="club-coach-kop">Kernpunten</Kop>
        <Kernpunten coaching={c} />
      </section>

      <section>
        <Kop className="club-coach-kop">Opstelling</Kop>
        {c.opstelling.map((zin, i) => (
          <p key={i} className="club-coach-tekst">{zin}</p>
        ))}
      </section>

      <section>
        <Kop className="club-coach-kop">Uitvoering</Kop>
        <ol className="club-coach-stappen">
          {c.stappen.map((stap, i) => (
            <li key={i}>{stap}</li>
          ))}
        </ol>
      </section>

      <section>
        <Kop className="club-coach-kop">Veelgemaakte fouten</Kop>
        <ul className="club-coach-fouten">
          {c.fouten.map((f, i) => (
            <li key={i} className="club-coach-fout">
              <span className="club-coach-fout-rij club-coach-fout-rij--fout">
                <X aria-hidden size={16} />
                <span><span className="club-sr">Fout: </span>{f.fout}</span>
              </span>
              <span className="club-coach-fout-rij club-coach-fout-rij--beter">
                <Check aria-hidden size={16} />
                <span><span className="club-sr">Beter: </span>{f.beter}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <dl className="club-coach-tegels">
        <div className="club-coach-tegel">
          <dt><Wind aria-hidden size={15} /> Ademhaling</dt>
          <dd>{c.ademhaling}</dd>
        </div>
        <div className="club-coach-tegel">
          <dt><Timer aria-hidden size={15} /> Tempo</dt>
          <dd>{c.tempo}</dd>
        </div>
        {c.makkelijker && (
          <div className="club-coach-tegel">
            <dt><ChevronDown aria-hidden size={15} /> Makkelijker</dt>
            <dd>{c.makkelijker}</dd>
          </div>
        )}
        {c.zwaarder && (
          <div className="club-coach-tegel">
            <dt><ChevronUp aria-hidden size={15} /> Zwaarder</dt>
            <dd>{c.zwaarder}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
