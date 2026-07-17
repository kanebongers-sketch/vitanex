import type { CSSProperties } from 'react'
import { DomeinSectie } from './DomeinSectie'

// ─── Domein: Business ───────────────────────────────────────────────────────
// Dit domein is leeg, en dat is de hele inhoud.
//
// Er is in LifeOS géén business-data. Geen tabel, geen API, geen model, geen
// veld. Niet "nog niet gevuld" — het bestaat niet. Dit is bewust een Server
// Component zonder fetch: er is niets om op te halen, en een laad-skelet
// suggereren zou al de eerste leugen zijn.
//
// Wat hier NIET komt, en waarom dat geen luiheid is:
//   - Geen omzetgrafiek met voorbeeldcijfers. Een "€ 12.400" met (voorbeeld)
//     eronder is over drie weken gewoon € 12.400.
//   - Geen 0 of € 0. Dat is een bewering: dat we het meten en dat het nul is.
//   - Geen "Binnenkort". Dat is een belofte die niemand heeft gedaan.
//
// MentaForce hééft B2B-data (coaching, HR), maar die gaat over kláánten van het
// platform — niet over Kane's eigen bedrijfsvoering. Die cijfers hier tonen zou
// andermans data als de jouwe presenteren.
//
// Zodra Kane de drie stappen hieronder zet, wordt dit een gewoon domein zoals de
// andere drie. Tot die tijd zegt het scherm precies wat er is: niets.

/** Wat dit domein nodig heeft. Stappen, geen roadmap — niemand heeft dit beloofd. */
const NODIG: readonly { wat: string; toelichting: string }[] = [
  {
    wat: 'Een keuze wélke cijfers meetellen',
    toelichting:
      'Omzet, klanten, uren, marge? Dat is een besluit van jou, geen technische vraag. Zolang het er niet is, valt er niets eerlijks te tonen.',
  },
  {
    wat: 'Een plek om ze te bewaren',
    toelichting: 'Een tabel plus een API-route, zoals gezondheid en taken die hebben.',
  },
  {
    wat: 'Een bron die ze vult',
    toelichting: 'Zelf invoeren, of een koppeling met je boekhouding. Zonder bron blijft de tabel leeg.',
  },
]

export function BusinessDomein() {
  return (
    <DomeinSectie titel="Business" definitie="Je bedrijf. Nog niet gemeten — er is nog geen bron.">
      <div style={{ display: 'grid', gap: 16, maxWidth: '68ch' }}>
        {/* Het streepje is dezelfde vorm als "geen meting" elders in de app, zodat
            leeg hier hetzelfde leest als leeg daar. Voor een screenreader ruis —
            de tekst eronder zegt het in woorden. */}
        <p className="os-cijfer" style={STREEP} aria-hidden="true">
          —
        </p>

        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Hier staat niets, en dat klopt. De andere drie domeinen lezen echte data uit je account;
          voor je bedrijf is er nog geen enkele bron — geen tabel, geen koppeling, geen cijfer. Een
          grafiek neerzetten zou betekenen dat we hem verzinnen.
        </p>

        <div>
          <h4 style={KOPJE}>Wat dit domein nodig heeft</h4>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {NODIG.map((stap, i) => (
              <li key={stap.wat} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span aria-hidden="true" className="os-cijfer" style={NUMMER}>
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>{stap.wat}</strong>
                  {' — '}
                  {stap.toelichting}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </DomeinSectie>
  )
}

const STREEP: CSSProperties = {
  margin: 0,
  fontSize: 34,
  lineHeight: 0.9,
  color: 'var(--text-4)',
}

const KOPJE: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
}

const NUMMER: CSSProperties = {
  flex: 'none',
  width: 18,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--brand)',
  lineHeight: 1.5,
}
