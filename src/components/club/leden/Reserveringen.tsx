import { RESERVERING_LABEL, type LidReservering } from '@/lib/club/leden/rijen'
import { datumKort, tijdNl } from '@/lib/club/leden/tijd'
import { RESERVERING_CHIP } from '@/lib/club/leden/weergave'

// Aankomende en recente reserveringen van een lid, met lesnaam en tijd.

interface ReserveringenProps {
  aankomend: LidReservering[]
  recent: LidReservering[]
  nu: Date
}

function Regel({ r, nu }: { r: LidReservering; nu: Date }) {
  const [dag, maand] = datumKort(r.start, nu).split(' ')
  const status = r.lesGeannuleerd ? 'Les vervalt' : r.status === 'wachtlijst' && r.wachtpositie ? `Wachtlijst ${r.wachtpositie}` : RESERVERING_LABEL[r.status]
  return (
    <li className="club-rij">
      <span className="club-leden-datumblok club-getal">
        <strong>{dag}</strong>
        <span>{maand}</span>
      </span>
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{r.lesNaam}</span>
        <span className="club-rij-sub">{tijdNl(r.start)} tot {tijdNl(r.eind)}</span>
      </span>
      <span className={`club-chip ${r.lesGeannuleerd ? 'club-chip--uit' : RESERVERING_CHIP[r.status]}`}>{status}</span>
    </li>
  )
}

function Lijst({ titel, rijen, leeg, nu }: { titel: string; rijen: LidReservering[]; leeg: string; nu: Date }) {
  return (
    <div>
      <h3 className="club-leden-subkop">{titel}</h3>
      {rijen.length ? <ul className="club-lijst">{rijen.map((r) => <Regel key={r.id} r={r} nu={nu} />)}</ul> : <p className="club-hint">{leeg}</p>}
    </div>
  )
}

export function Reserveringen({ aankomend, recent, nu }: ReserveringenProps) {
  return (
    <section className="club-kaart" aria-labelledby="reserveringen-kop">
      <h2 id="reserveringen-kop">Reserveringen</h2>
      <div className="club-leden-tweekolom">
        <Lijst titel="Aankomend" rijen={aankomend} leeg="Geen lessen geboekt." nu={nu} />
        <Lijst titel="Recent" rijen={recent} leeg="Geen lessen in de laatste 6 weken." nu={nu} />
      </div>
    </section>
  )
}
