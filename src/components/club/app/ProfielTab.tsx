import type { ReactNode } from 'react'
import { CreditCard, LockKeyhole } from 'lucide-react'
import type { Teksten } from '@/lib/club/bedrijf/model'
import { LedenappJuridisch } from '@/components/club/bedrijf/LedenappJuridisch'
import { LID_STATUS_LABEL, initialen, volledigeNaam } from '@/lib/club/kern/lid'
import type { LidVoorApp } from '@/lib/club/ledenlogin/lid-voor-app'
import { dagKort } from '@/lib/club/cijfers/tijd'

// Profiel in de ledenapp: eigen gegevens. Geld en contract staan in Sportivity;
// hier alleen de naam van het abonnement.

interface ProfielTabProps {
  lid: LidVoorApp
  vestigingNaam: string
  /** Huisregels, voorwaarden en privacy van de sportschool (leeg = niets tonen). */
  teksten: Teksten | null
  sportschool: string
  /** Extra blok onder het abonnement, bijvoorbeeld hulp of een vraag aan de sportschool. */
  hulp?: ReactNode
  /** De voetnoot over inloggen bij de pilot (alleen in de voorvertoning; in /mijn is het lid al ingelogd). */
  pilotNoot?: boolean
}

export function ProfielTab({ lid, vestigingNaam, teksten, sportschool, hulp, pilotNoot = true }: ProfielTabProps) {
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
          <span className="club-lidapp-status" data-status={lid.status}>
            {LID_STATUS_LABEL[lid.status]}
          </span>
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
      {hulp}
      {teksten && <LedenappJuridisch teksten={teksten} sportschool={sportschool} />}
      {pilotNoot && (
        <p className="club-lidapp-voetnoot">
          <LockKeyhole aria-hidden size={14} /> Inloggen met je eigen account komt bij de pilot.
        </p>
      )}
    </div>
  )
}
