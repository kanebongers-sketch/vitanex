import type { CheckinRij, LidReservering } from '@/lib/club/leden/rijen'
import { checkinNotitie, reserveringStatusTekst } from '@/lib/club/leden/reservering'
import { datumKort, tijdNl } from '@/lib/club/leden/tijd'
import { RESERVERING_CHIP } from '@/lib/club/leden/weergave'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

// Aankomende en recente reserveringen van een lid, met lesnaam en tijd. Bij een
// voorbije les staat erbij of het lid die dag incheckte.

interface ReserveringenProps {
  aankomend: LidReservering[]
  recent: LidReservering[]
  checkins: CheckinRij[]
  nu: Date
  /** Uit als de aankomende lessen elders op de kaart staan (blok Lessen, met annuleren). */
  metAankomend?: boolean
}

function Regel({ r, checkins, nu, taal }: { r: LidReservering; checkins: CheckinRij[]; nu: Date; taal: Taal }) {
  const t = LEDEN[taal]
  const [dag, maand] = datumKort(r.start, nu, taal).split(' ')
  const notitie = checkinNotitie(checkins, r, nu, taal)
  const zonderCheckin = notitie === t.reservering.geenCheckin
  return (
    <li className="club-rij club-leden-resrij">
      <span className="club-leden-datumblok club-getal" aria-hidden>
        <strong>{dag}</strong>
        <span>{maand}</span>
      </span>
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{r.lesNaam}</span>
        <span className="club-rij-sub">
          <span className="club-sr">{datumKort(r.start, nu, taal)}, </span>
          {t.reserveringen.tijdvak(tijdNl(r.start), tijdNl(r.eind))}
          {notitie ? <span className={zonderCheckin ? 'club-leden-res-notitie club-leden-res-notitie--mist' : 'club-leden-res-notitie'}> · {notitie}</span> : null}
        </span>
      </span>
      <span className={`club-chip ${r.lesGeannuleerd ? 'club-chip--uit' : RESERVERING_CHIP[r.status]}`}>{reserveringStatusTekst(r, taal)}</span>
    </li>
  )
}

interface LijstProps {
  titel: string
  rijen: LidReservering[]
  leeg: string
  checkins: CheckinRij[]
  nu: Date
  taal: Taal
}

function Lijst({ titel, rijen, leeg, checkins, nu, taal }: LijstProps) {
  return (
    <div>
      <h3 className="club-leden-subkop">{titel}</h3>
      {rijen.length
        ? <ul className="club-lijst">{rijen.map((r) => <Regel key={r.id} r={r} checkins={checkins} nu={nu} taal={taal} />)}</ul>
        : <p className="club-hint">{leeg}</p>}
    </div>
  )
}

export async function Reserveringen({ aankomend, recent, checkins, nu, metAankomend = true }: ReserveringenProps) {
  const taal = await getTaal()
  const t = LEDEN[taal].reserveringen
  const recentLijst = <Lijst titel={t.recent} rijen={recent} leeg={t.geenRecent} checkins={checkins} nu={nu} taal={taal} />
  return (
    <section className="club-kaart" aria-labelledby="reserveringen-kop">
      <h2 id="reserveringen-kop">{t.kop}</h2>
      {metAankomend ? (
        <div className="club-leden-tweekolom">
          <Lijst titel={t.aankomend} rijen={aankomend} leeg={t.geenAankomend} checkins={checkins} nu={nu} taal={taal} />
          {recentLijst}
        </div>
      ) : recentLijst}
    </section>
  )
}
