import Link from 'next/link'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad } from '@/lib/club/kern/vestiging'
import { haalAfsprakenVanLid, haalAlleMedewerkers } from '@/lib/club/afspraken/opslag'
import { STATUS_LABEL } from '@/lib/club/afspraken/model'
import { nlDatumTijd, tijdvak } from '@/lib/club/afspraken/weergave'
import './afspraken.css'

// Voor de ledenkaart (server component, laadt zelf): de komende afspraken van
// het lid en de laatste die geweest zijn, met een link naar die dag.

const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

interface Props {
  lidId: string
  vestiging: string
}

export async function AfsprakenVanLid({ lidId, vestiging }: Props) {
  const t = await eisClubToegang()
  const nu = new Date()
  const [lijst, medewerkers] = await Promise.all([haalAfsprakenVanLid(t.admin, t.userId, lidId, nu), haalAlleMedewerkers(t.admin, t.userId)])
  const naam = new Map((medewerkers ?? []).map((m) => [m.id, m.naam]))
  const komend = (lijst ?? []).filter((a) => a.status === 'gepland' && new Date(a.eind) >= nu)
  const geweest = (lijst ?? []).filter((a) => !komend.includes(a)).reverse().slice(0, 5)

  return (
    <section className="club-kaart club-afspraken-lid" aria-labelledby="afspraken-lid-kop">
      <div className="club-sectiekop">
        <h2 id="afspraken-lid-kop">Afspraken</h2>
        <Link href={clubPad('/afspraken', vestiging)}>Agenda</Link>
      </div>
      {lijst === null ? <p className="club-melding club-melding--fout">De afspraken konden niet worden geladen.</p> : null}
      {lijst !== null && lijst.length === 0 ? <p className="club-hint">Nog geen afspraken met een trainer.</p> : null}
      {[{ titel: 'Komend', items: komend }, { titel: 'Eerder', items: geweest }].map((groep) =>
        groep.items.length > 0 ? (
          <div key={groep.titel} className="club-afspraken-lidgroep">
            <h3>{groep.titel}</h3>
            <ul>
              {groep.items.map((a) => {
                const datum = nlDatumTijd(a.start).datum
                return (
                  <li key={a.id} data-kleur={a.kleur} data-status={a.status}>
                    <Link href={clubPad('/afspraken', a.vestiging, { weergave: 'dag', dag: datum })}>
                      <span className="club-afspraken-itemtijd">{DAG.format(new Date(`${datum}T12:00:00Z`))}, {tijdvak(a)}</span>
                      <strong>{a.typeNaam}</strong>
                      <span className="club-afspraken-meta">met {naam.get(a.medewerkerId) ?? 'een trainer'}{a.status === 'gepland' ? '' : ` · ${STATUS_LABEL[a.status]}`}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  )
}
