import { BEHOUD_LABEL, GRENS_GOED, GRENS_RISICO, keerTekst, type Behoud } from '@/lib/club/leden/behoud'
import { BEHOUD_CHIP } from '@/lib/club/leden/weergave'

// De behoudsscore op de ledenkaart: het getal groot, de zin in mensentaal en
// eerlijk waar de punten vandaan komen.

interface Onderdeel {
  label: string
  punten: number
  max: number
  uitleg: string
}

function onderdelen(b: Behoud): Onderdeel[] {
  return [
    { label: 'Frequentie', punten: b.onderdelen.frequentie, max: 30, uitleg: `${keerTekst(b.recentPerWeek)} per week, laatste 4 weken` },
    {
      label: 'Trend', punten: b.onderdelen.trend, max: 30,
      uitleg: b.eerderPerWeek === null ? 'Nog te kort lid om te vergelijken' : `Was ${keerTekst(b.eerderPerWeek)} per week in de 8 weken daarvoor`,
    },
    {
      label: 'Recent', punten: b.onderdelen.recent, max: 25,
      uitleg: b.dagenSinds === null ? 'Geen bezoek in 12 weken' : b.dagenSinds === 0 ? 'Vandaag geweest' : `${b.dagenSinds} dagen sinds het laatste bezoek`,
    },
    { label: 'No-shows', punten: b.onderdelen.noShows, max: 10, uitleg: `${b.noShows}x niet gekomen bij een les, laatste 8 weken` },
    {
      label: 'Lid-duur', punten: b.onderdelen.lidDuur, max: 5,
      uitleg: b.lidDagen === null ? 'Lid sinds onbekend' : b.lidDagen < 90 ? 'Nieuw lid: de eerste maanden zijn kwetsbaar' : `${Math.floor(b.lidDagen / 30)} maanden lid`,
    },
  ]
}

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
        <span className="club-leden-groot-getal club-getal">{behoud.score}</span>
        <div>
          <span className={`club-chip ${BEHOUD_CHIP[behoud.label]}`}>{BEHOUD_LABEL[behoud.label]}</span>
          <p className="club-leden-behoudkaart-zin">{behoud.uitleg}</p>
        </div>
      </div>
      <ul className="club-leden-onderdelen">
        {onderdelen(behoud).map((o) => (
          <li key={o.label}>
            <span className="club-leden-onderdeel-label">{o.label}</span>
            <span className="club-leden-meter" aria-hidden><span style={{ transform: `scaleX(${o.punten / o.max})` }} /></span>
            <span className="club-getal club-zacht">{o.punten}/{o.max}</span>
            <span className="club-leden-onderdeel-uitleg">{o.uitleg}</span>
          </li>
        ))}
      </ul>
      <p className="club-hint">Score 0 tot 100 uit check-ins en reserveringen. {GRENS_GOED} of meer is goed, onder {GRENS_RISICO} is risico.</p>
    </section>
  )
}
