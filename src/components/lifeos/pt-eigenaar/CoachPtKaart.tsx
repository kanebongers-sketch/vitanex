import Link from 'next/link'
import { afspraakLabel, coachFase, datumLabel, laatsteContactOp, type CoachRij } from '@/lib/lifeos/pt-coaching/coach-overzicht'
import { CheckinKaart } from './CheckinKaart'
import { OpTePakkenLijst } from './OpTePakkenLijst'
import { VerslagenLijst } from './VerslagenLijst'

// Eén PT'er in het coach-overzicht van eigenaar/beheerder: waar het gesprek
// staat (verslag open, volgende afspraak of nog inplannen), laatste contact,
// de check-in van deze week, open aandachtspunten, de lead tracker en alle
// verslagen (ingeklapt). Puur.

function FaseBadge({ r, nu }: { r: CoachRij; nu: Date }) {
  const fase = coachFase(r, nu)
  if (fase === 'verslag') return <span className="ptd-badge ptd-badge--let-op">Verslag nog invullen</span>
  if (fase === 'inplannen') return <span className="ptd-badge">Volgende afspraak nog inplannen</span>
  return <span className="ptd-badge ptd-badge--accent">Volgende: {afspraakLabel(r.volgendeOp as string)}</span>
}

export function CoachPtKaart({ code, r, nu }: { code: string; r: CoachRij; nu: Date }) {
  const laatste = laatsteContactOp(r)
  return (
    <li className="ptd-kaart ptd-coach-pt">
      <div className="ptd-rij-kop">
        <Link className="ptd-naam ptd-link" href={`/${code}/team/${r.id}`}>{r.naam}</Link>
        <FaseBadge r={r} nu={nu} />
      </div>
      <p className="ptd-meta">
        <span>Laatste gesprek: {laatste ? datumLabel(laatste) : 'nog geen'}</span>
        <span>{r.verslagen.length} {r.verslagen.length === 1 ? 'verslag' : 'verslagen'}</span>
        <span>{r.checkin ? 'Check-in deze week ingevuld' : 'Check-in deze week nog niet ingevuld'}</span>
      </p>
      {r.checkin ? <CheckinKaart checkin={r.checkin} /> : null}
      {r.openPunten.length > 0 ? (
        <div>
          <p className="ptd-label">Open aandachtspunten · {r.openPunten.length}</p>
          <ul className="ptd-punten">
            {r.openPunten.map((x) => <li key={x.id} className="ptd-tekst">{x.tekst}</li>)}
          </ul>
        </div>
      ) : null}
      <OpTePakkenLijst code={code} ptId={r.id} opTePakken={r.opTePakken} />
      <details className="ptd-details ptd-details--in">
        <summary>Verslagen · {r.verslagen.length}</summary>
        <div className="ptd-details-inhoud">
          <VerslagenLijst code={code} verslagen={r.verslagen} />
        </div>
      </details>
    </li>
  )
}
