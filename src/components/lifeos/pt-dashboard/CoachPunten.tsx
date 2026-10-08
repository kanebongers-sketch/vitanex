import { OORDEEL_LABEL, type OpenPunt } from '@/lib/lifeos/pt-coaching/aandachtspunten'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'

// De open aandachtspunten uit eerdere coachgesprekken, zoals Kane ze noteerde.
// Alleen lezen: afvinken gebeurt samen, in het gesprek. Puur weergave.

export function CoachPunten({ punten }: { punten: readonly OpenPunt[] }) {
  return (
    <section className="ptd-sectie" aria-labelledby="ptd-punten-kop">
      <div className="ptd-sectiekop">
        <h2 id="ptd-punten-kop">Open aandachtspunten</h2>
        <span>uit eerdere gesprekken</span>
      </div>
      {punten.length === 0 ? (
        <p className="ptd-leeg">Er staan geen open aandachtspunten uit eerdere gesprekken.</p>
      ) : (
        <>
          <ul className="ptd-lijst">
            {punten.map((p) => (
              <li key={p.id} className="ptd-rij">
                <p className="ptd-tekst ptd-tekst--sterk">{p.tekst}</p>
                <p className="ptd-meta">
                  <span>sinds {dagKort(dagSleutelNl(new Date(p.sinds)))}</span>
                  {p.keerOpen > 0 ? <span>{p.keerOpen === 1 ? '1 gesprek open' : `${p.keerOpen} gesprekken open`}</span> : null}
                  {p.laatsteOordeel ? (
                    <span className={`ptd-badge${p.laatsteOordeel === 'erger' ? ' ptd-badge--let-op' : ''}`}>
                      Vorige keer: {OORDEEL_LABEL[p.laatsteOordeel].toLowerCase()}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
          <p className="ptd-hint">Of een punt is opgelost, bespreken jullie in het gesprek. Schrijf in je check-in gerust hoe het ervoor staat.</p>
        </>
      )}
    </section>
  )
}
