import { behoudLabel, GRENS_GOED, GRENS_RISICO, type Behoud } from '@/lib/club/leden/behoud'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import { behoudOnderdelen } from '@/lib/club/leden/onderdelen'
import { BEHOUD_CHIP } from '@/lib/club/leden/weergave'

// De behoudsscore op de ledenkaart: het getal groot, dezelfde zin als in de
// ledenlijst en eerlijk waar de punten vandaan komen.

export async function BehoudKaart({ behoud, geenTekst }: { behoud: Behoud | null; geenTekst: string }) {
  const taal = await getTaal()
  const t = LEDEN[taal].behoud
  if (!behoud) {
    return (
      <section className="club-kaart club-leden-behoudkaart" aria-labelledby="behoud-kop">
        <h2 id="behoud-kop">{t.kop}</h2>
        <p className="club-hint">{geenTekst}</p>
      </section>
    )
  }
  return (
    <section className={`club-kaart club-leden-behoudkaart club-leden-behoud--${behoud.label}`} aria-labelledby="behoud-kop">
      <h2 id="behoud-kop">{t.kop}</h2>
      <div className="club-leden-behoudkaart-kop">
        <span className="club-leden-groot-getal club-getal">
          {behoud.score}<span className="club-sr"> {t.vanHonderd}</span>
        </span>
        <div>
          <span className={`club-chip ${BEHOUD_CHIP[behoud.label]}`}>{behoudLabel(behoud.label, taal)}</span>
          <p className="club-leden-behoudkaart-zin">{behoud.uitleg}</p>
        </div>
      </div>
      <ul className="club-leden-onderdelen" aria-label={t.opbouw}>
        {behoudOnderdelen(behoud, taal).map((o) => (
          <li key={o.label}>
            <span className="club-leden-onderdeel-label">{o.label}</span>
            <span className="club-leden-meter" aria-hidden><span style={{ transform: `scaleX(${o.punten / o.max})` }} /></span>
            <span className="club-getal club-zacht">{o.punten}/{o.max}<span className="club-sr"> {t.punten}</span></span>
            <span className="club-leden-onderdeel-uitleg">{o.uitleg}</span>
          </li>
        ))}
      </ul>
      <p className="club-hint">
        {t.uitleg(GRENS_GOED, GRENS_RISICO)}
      </p>
    </section>
  )
}
