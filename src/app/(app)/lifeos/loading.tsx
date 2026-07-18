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

          <div className="os-cockpit">
            {/* Vita als volle band. */}
            <div className="os-cockpit__band">
              <div style={{ ...KAART, height: 132 }} />
            </div>

            {/* Cluster "Mijn dag": twee brede ankers, vier halve tegels (de
                breedte-dragende kaarten) en vier kwart-tegels (de compacte
                tools) — zelfde verdeling als de echte cockpit. */}
            <section className="os-cluster">
              <ClusterKop />
              <div className="os-tile--anker">
                <div style={{ ...KAART, height: 248 }} />
              </div>
              <div className="os-tile--anker">
                <div style={{ ...KAART, height: 248 }} />
              </div>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={`half-${i}`} className="os-tile--half">
                  <div style={{ ...KAART, height: 208 }} />
                </div>
              ))}
              {Array.from({ length: 4 }, (_, i) => (
                <div key={`kwart-${i}`} className="os-tile--kwart">
                  <div style={{ ...KAART, height: 172 }} />
                </div>
              ))}
            </section>

            {/* Vita-gesprek als gecentreerde band. */}
            <div className="os-cockpit__gesprek">
              <div style={{ ...KAART, height: 220 }} />
            </div>

            {/* Cluster "Verbinden": drie volle-breedte-surfaces. */}
            <section className="os-cluster">
              <ClusterKop />
              <div className="os-tile--vol">
                <div style={{ ...KAART, height: 300 }} />
              </div>
              <div className="os-tile--vol">
                <div style={{ ...KAART, height: 260 }} />
              </div>
              <div className="os-tile--vol">
                <div style={{ ...KAART, height: 300 }} />
              </div>
            </section>
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
