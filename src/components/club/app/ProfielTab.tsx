import { CreditCard, LockKeyhole } from 'lucide-react'
import { LID_STATUS_LABEL, initialen, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { dagKort } from '@/lib/club/cijfers/tijd'

// Profiel in de ledenapp: eigen gegevens. Geld en contract staan in Sportivity;
// hier alleen de naam van het abonnement.

export function ProfielTab({ lid, vestigingNaam }: { lid: Lid; vestigingNaam: string }) {
  const regels: [string, string | null][] = [
    ['Lidnummer', lid.lidnummer],
    ['E-mail', lid.email],
    ['Telefoon', lid.telefoon],
    ['Vestiging', vestigingNaam],
    ['Lid sinds', lid.lidSinds ? `${dagKort(lid.lidSinds)} ${lid.lidSinds.slice(0, 4)}` : null],
  ]
  return (
    <div className="club-lidapp-tab">
      <div className="club-lidapp-profielkop">
        <span className="club-lidapp-avatar" aria-hidden>
          {initialen(lid)}
        </span>
        <div>
          <h2 className="club-lidapp-kop">{volledigeNaam(lid)}</h2>
          <span className="club-lidapp-status">{LID_STATUS_LABEL[lid.status]}</span>
        </div>
      </div>
      <dl className="club-lidapp-gegevens">
        {regels.map(([label, waarde]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{waarde ?? 'Niet ingevuld'}</dd>
          </div>
        ))}
      </dl>
      <section className="club-lidapp-sportivity" aria-labelledby="lidapp-abonnement">
        <h3 id="lidapp-abonnement">
          <CreditCard aria-hidden size={16} /> Abonnement en betalingen
        </h3>
        <p className="club-lidapp-abo">{lid.abonnement ?? 'Abonnement onbekend'}</p>
        <p>Je abonnement, facturen en betalingen regel je in Sportivity. Vragen? Loop even langs de balie.</p>
      </section>
      <p className="club-lidapp-voetnoot">
        <LockKeyhole aria-hidden size={14} /> Inloggen met je eigen account komt bij de pilot.
      </p>
    </div>
  )
}
