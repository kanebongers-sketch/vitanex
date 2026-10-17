import { Plus } from 'lucide-react'
import { STATUS_LABEL, type AfspraakWeergave } from '@/lib/club/afspraken/model'
import { nlDatumTijd } from '@/lib/club/afspraken/weergave'

// De week: zeven dagen naast elkaar (op de telefoon onder elkaar). Elke
// afspraak met tijd, lid, soort (kleur) en trainer. Tik om te openen.

const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

interface Props {
  dagen: { datum: string; afspraken: AfspraakWeergave[] }[]
  vandaag: string
  trainerNaam: (id: string) => string
  onKies: (a: AfspraakWeergave) => void
  onNieuw: (datum: string) => void
}

export function WeekOverzicht({ dagen, vandaag, trainerNaam, onKies, onNieuw }: Props) {
  return (
    <div className="club-afspraken-week">
      {dagen.map((d) => {
        const label = DAG.format(new Date(`${d.datum}T12:00:00Z`))
        const actief = d.afspraken.filter((a) => a.status !== 'geannuleerd').length
        return (
          <section key={d.datum} className="club-afspraken-dag" data-vandaag={d.datum === vandaag || undefined} data-voorbij={d.datum < vandaag || undefined} aria-label={label}>
            <h2 className="club-afspraken-dagkop">
              <span>{label}</span>
              <span className="club-afspraken-dagtel">{actief > 0 ? actief : ''}</span>
            </h2>
            {d.afspraken.length > 0 ? (
              <ul className="club-afspraken-items">
                {d.afspraken.map((a) => (
                  <li key={a.id}>
                    <button type="button" className="club-afspraken-item" data-kleur={a.kleur} data-status={a.status} onClick={() => onKies(a)}>
                      <span className="club-afspraken-tijd">{nlDatumTijd(a.start).tijd}</span>
                      <span className="club-afspraken-naam">{a.lidNaam}</span>
                      <span className="club-afspraken-meta">
                        {a.typeNaam} · {trainerNaam(a.medewerkerId).split(' ')[0]}
                        {a.status !== 'gepland' ? <> · {STATUS_LABEL[a.status]}</> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {d.datum >= vandaag ? (
              <button type="button" className="club-afspraken-plus" onClick={() => onNieuw(d.datum)}>
                <Plus size={14} aria-hidden /><span className="club-sr">Afspraak maken op {label}</span>
              </button>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
