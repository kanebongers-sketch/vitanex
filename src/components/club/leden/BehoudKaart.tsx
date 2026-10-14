import { BEHOUD_LABEL, GRENS_GOED, GRENS_RISICO, type Behoud } from '@/lib/club/leden/behoud'
import { behoudOnderdelen } from '@/lib/club/leden/onderdelen'
import { BEHOUD_CHIP } from '@/lib/club/leden/weergave'

// De behoudsscore op de ledenkaart: het getal groot, dezelfde zin als in de
// ledenlijst en eerlijk waar de punten vandaan komen.

export function BehoudKaart({ behoud, geenTekst }: { behoud: Behoud | null; geenTekst: string }) {
  if (!behoud) {
    return (
      <section className="club-kaart club-leden-behoudkaart" aria-labelledby="behoud-kop">
        <h2 id="behoud-kop">Behoud</h2>
        <p className="club-hint">{geenTekst}</p>
      </section>
    )
  }
  return (
    <section className={`club-kaart club-leden-behoudkaart club-leden-behoud--${behoud.label}`} aria-labelledby="behoud-kop">
      <h2 id="behoud-kop">Behoud</h2>
      <div className="club-leden-behoudkaart-kop">
        <span className="club-leden-groot-getal club-getal">
          {behoud.score}<span className="club-sr"> van 100</span>
        </span>
        <div>
          <span className={`club-chip ${BEHOUD_CHIP[behoud.label]}`}>{BEHOUD_LABEL[behoud.label]}</span>
          <p className="club-leden-behoudkaart-zin">{behoud.uitleg}</p>
        </div>
      </div>
      <ul className="club-leden-onderdelen" aria-label="Opbouw van de score">
        {behoudOnderdelen(behoud).map((o) => (
          <li key={o.label}>
            <span className="club-leden-onderdeel-label">{o.label}</span>
            <span className="club-leden-meter" aria-hidden><span style={{ transform: `scaleX(${o.punten / o.max})` }} /></span>
            <span className="club-getal club-zacht">{o.punten}/{o.max}<span className="club-sr"> punten</span></span>
            <span className="club-leden-onderdeel-uitleg">{o.uitleg}</span>
          </li>
        ))}
      </ul>
      <p className="club-hint">
        Score van 0 tot 100 uit check-ins (alle vestigingen) en reserveringen. {GRENS_GOED} of meer is goed, onder {GRENS_RISICO} is risico.
      </p>
    </section>
  )
}
