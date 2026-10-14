import type { CheckinRij, LidReservering } from '@/lib/club/leden/rijen'
import { checkinNotitie, reserveringStatusTekst } from '@/lib/club/leden/reservering'
import { datumKort, tijdNl } from '@/lib/club/leden/tijd'
import { RESERVERING_CHIP } from '@/lib/club/leden/weergave'

// Aankomende en recente reserveringen van een lid, met lesnaam en tijd. Bij een
// voorbije les staat erbij of het lid die dag incheckte.

interface ReserveringenProps {
  aankomend: LidReservering[]
  recent: LidReservering[]
  checkins: CheckinRij[]
  nu: Date
}

function Regel({ r, checkins, nu }: { r: LidReservering; checkins: CheckinRij[]; nu: Date }) {
  const [dag, maand] = datumKort(r.start, nu).split(' ')
  const notitie = checkinNotitie(checkins, r, nu)
  const zonderCheckin = notitie === 'geen check-in die dag'
  return (
    <li className="club-rij club-leden-resrij">
      <span className="club-leden-datumblok club-getal" aria-hidden>
        <strong>{dag}</strong>
        <span>{maand}</span>
      </span>
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{r.lesNaam}</span>
        <span className="club-rij-sub">
          <span className="club-sr">{datumKort(r.start, nu)}, </span>
          {tijdNl(r.start)} tot {tijdNl(r.eind)}
          {notitie ? <span className={zonderCheckin ? 'club-leden-res-notitie club-leden-res-notitie--mist' : 'club-leden-res-notitie'}> · {notitie}</span> : null}
        </span>
      </span>
      <span className={`club-chip ${r.lesGeannuleerd ? 'club-chip--uit' : RESERVERING_CHIP[r.status]}`}>{reserveringStatusTekst(r)}</span>
    </li>
  )
}

interface LijstProps {
  titel: string
  rijen: LidReservering[]
  leeg: string
  checkins: CheckinRij[]
  nu: Date
}

function Lijst({ titel, rijen, leeg, checkins, nu }: LijstProps) {
  return (
    <div>
      <h3 className="club-leden-subkop">{titel}</h3>
      {rijen.length
        ? <ul className="club-lijst">{rijen.map((r) => <Regel key={r.id} r={r} checkins={checkins} nu={nu} />)}</ul>
        : <p className="club-hint">{leeg}</p>}
    </div>
  )
}

export function Reserveringen({ aankomend, recent, checkins, nu }: ReserveringenProps) {
  return (
    <section className="club-kaart" aria-labelledby="reserveringen-kop">
      <h2 id="reserveringen-kop">Reserveringen</h2>
      <div className="club-leden-tweekolom">
        <Lijst titel="Aankomend" rijen={aankomend} leeg="Geen lessen geboekt." checkins={checkins} nu={nu} />
        <Lijst titel="Recent" rijen={recent} leeg="Geen lessen in de laatste 8 weken." checkins={checkins} nu={nu} />
      </div>
    </section>
  )
}
