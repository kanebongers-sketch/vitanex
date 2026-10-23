import { regelTeksten, type AppRegels } from '@/lib/club/app/regels'

// De uitleg naast het telefoonframe: wat een lid kan, welke regels hij ziet en
// wat er nog moet gebeuren voor de pilot. Eerlijk over wat er nu wel en niet is.

const KAN = [
  ['Home', 'Volgende les, bezoek deze maand, weken op rij en de QR-code om in te checken.'],
  ['Lessen', 'Rooster van de komende 7 dagen met vrije plekken. Reserveren, annuleren en wachtlijst.'],
  ['Schema', 'Het actieve schema van de trainer, per dag. Afvinken dat de training gedaan is.'],
  ['Profiel', 'Eigen gegevens. Abonnement en betalingen blijven in je ledenadministratie.'],
] as const

export function AppUitleg({ regels }: { regels: AppRegels }) {
  return (
    <aside className="club-lidapp-uitleg" aria-label="Over de ledenapp">
      <ol className="club-lidapp-punten">
        {KAN.map(([titel, tekst], i) => (
          <li key={titel}>
            <span aria-hidden>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <strong>{titel}</strong>
              <p>{tekst}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="club-lidapp-uitleg-regels">
        <h2>Regels die het lid ziet</h2>
        <ul>
          {regelTeksten(regels).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="club-hint">De regels komen uit de instellingen van deze vestiging.</p>
      </section>
      <p className="club-melding">
        Voorvertoning: je bekijkt de app namens een demolid. Reserveren en afvinken werken echt op de demodata. Inloggen voor leden zelf komt bij de pilot.
      </p>
    </aside>
  )
}
