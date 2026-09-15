import type { CSSProperties } from 'react'

// ─── De laadstaat van LifeOS ────────────────────────────────────────────────
// De Suspense-fallback van dit route-segment. Een rustig navy skelet in de vorm
// van de cockpit: kop, Vita-band, en de twee clusters op hetzelfde gedeelde
// 12-koloms raster (zie `.os-cluster` + `.os-tile--*`). Zo springt de layout niet
// zodra de echte kaarten binnenkomen.
//
// Bewust géén spinner: een draaiend rondje zegt "wacht" en verder niets, terwijl
// een skelet al vertelt wát er komt. Ook bewust géén pulse-animatie — de
// kaart-skeletten in de cockpit zijn ook statisch (zie `WelzijnScoreKaart`), en
// een stilstaand scherm dat oplicht zodra het klaar is, is rustiger dan een
// scherm dat vast staat te knipperen.
//
// `aria-busy` + een sr-only regel: voor wie voorleest is dit anders een stapel
// betekenisloze lege vakken.

export default function LifeosLaden() {
  return (
    <div className="lifeos-root">
      <div className="os-sfeer" aria-hidden="true" />
      <main className="os-schil os-schil--breed" aria-busy="true">
        <p style={SR_ONLY}>Je cockpit wordt geladen.</p>

        <div aria-hidden="true">
          {/* Kop: datumregel + groet. */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ ...VLAK, height: 11, width: 132, marginBottom: 10 }} />
            <div style={{ ...VLAK, height: 40, width: 'min(360px, 70%)' }} />
          </div>

          {/* Wayfinding-tegels onder de begroeting. */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`nav-${i}`} style={{ ...VLAK, height: 40, width: 128, borderRadius: 14 }} />
            ))}
          </div>

          <div className="os-cockpit">
            {/* Vandaag: de briefing-hero met Vita's signalen + vraag-balk erin —
                de langste kaart, één oppervlak. Zelfde vorm als de echte cockpit,
                zodat de layout niet springt als de kaarten binnenkomen. */}
            <div className="os-cockpit__band">
              <div style={{ ...KAART, height: 360 }} />
            </div>

            {/* Cluster "Mijn dag": twee halve tegels (taken + agenda). */}
            <section className="os-cluster">
              <ClusterKop />
              {Array.from({ length: 2 }, (_, i) => (
                <div key={`dag-${i}`} className="os-tile--half">
                  <div style={{ ...KAART, height: 236 }} />
                </div>
              ))}
            </section>

            {/* Cluster "Deze week": twee halve tegels (PT-klanten + PT-gesprekken). */}
            <section className="os-cluster">
              <ClusterKop />
              {Array.from({ length: 2 }, (_, i) => (
                <div key={`week-${i}`} className="os-tile--half">
                  <div style={{ ...KAART, height: 208 }} />
                </div>
              ))}
            </section>

            {/* Inbox: volle-breedte-lijst. */}
            <div className="os-cockpit__band">
              <div style={{ ...KAART, height: 168 }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/** De kop van een cluster: een titelbalk + een smallere introregel. */
function ClusterKop() {
  return (
    <div className="os-cluster__kop">
      <div style={{ ...VLAK, height: 22, width: 'min(220px, 55%)', marginBottom: 8 }} />
      <div style={{ ...VLAK, height: 12, width: 'min(420px, 80%)' }} />
    </div>
  )
}

/** Een leeg vlak in de skelet-kleur. Nooit een cijfer, nooit een streepje. */
const VLAK: CSSProperties = {
  borderRadius: 8,
  background: 'var(--bg-raised)',
}

/** De omtrek van een kaart: hetzelfde vlak, in het formaat van `.os-kaart`. */
const KAART: CSSProperties = {
  borderRadius: 16,
  border: '1px solid var(--line)',
  background: 'var(--bg-card)',
}

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
}
