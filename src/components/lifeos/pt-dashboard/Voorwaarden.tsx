import { ABONNEMENT, ABONNEMENTEN, euro } from '@/lib/lifeos/pt-dashboard/abonnementen'

// De abonnementen en voorwaarden op één plek, voor het gesprek met een klant.
// Bron: "Fit Factory Personal Training Abonnementen 2026". Prijzen per maand, incl. btw.

const VOORWAARDEN: [string, string][] = [
  ['Looptijd', '3 maanden vast.'],
  ['Verlenging', 'Daarna automatisch per maand.'],
  ['Opzeggen', 'Maandelijks, met een opzegtermijn van één volledige kalendermaand — schriftelijk via WhatsApp of e-mail.'],
  ['Betaling', 'Automatische incasso; een gemiste betaling binnen 7 dagen voldoen.'],
  ['Annuleren', 'Kosteloos tot 24 uur vóór de sessie; daarbinnen wordt de sessie gerekend.'],
  ['Niet-gebruikte sessies', 'Schuiven niet door naar de volgende maand, tenzij anders afgesproken.'],
  ['Bevriezen', 'Bij blessure, ziekte of uitzonderlijke omstandigheden, in overleg.'],
]

export function Voorwaarden() {
  return (
    <details className="ptd-kaart ptd-details">
      <summary>Abonnementen &amp; voorwaarden</summary>
      <div className="ptd-details-inhoud">
        <ul className="ptd-lijst">
          {ABONNEMENTEN.map((a) => (
            <li key={a} className="ptd-meta ptd-prijsregel">
              <span>{ABONNEMENT[a].label}</span>
              <span>
                {euro(ABONNEMENT[a].prijs)} · Eersel {euro(ABONNEMENT[a].prijsEersel)}
                {ABONNEMENT[a].duo ? ' (per duo)' : ''}
              </span>
            </li>
          ))}
        </ul>
        <p className="ptd-hint">
          Altijd inbegrepen: vaste trainer, sessies van 60 minuten, schema op maat, voedings- en coachcheck per maand, volledig
          Fit Factory-lidmaatschap, app, de Fit Guide, WhatsApp-support op werkdagen en een start- en eindmeting.
        </p>
        <dl className="ptd-voorwaarden">
          {VOORWAARDEN.map(([k, w]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{w}</dd>
            </div>
          ))}
        </dl>
        <p className="ptd-hint">Bron: Fit Factory Personal Training Abonnementen 2026. Prijswijzigingen voorbehouden.</p>
      </div>
    </details>
  )
}
