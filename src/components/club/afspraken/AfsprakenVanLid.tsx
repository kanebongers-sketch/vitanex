import Link from 'next/link'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad } from '@/lib/club/kern/vestiging'
import { haalAfsprakenVanLid, haalAlleMedewerkers } from '@/lib/club/afspraken/opslag'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import { nlDatumTijd, tijdvak } from '@/lib/club/afspraken/weergave'
import './afspraken.css'

// Voor de ledenkaart (server component, laadt zelf): de komende afspraken van
// het lid en de laatste die geweest zijn, met een link naar die dag.

interface Props {
  lidId: string
  vestiging: string
}

export async function AfsprakenVanLid({ lidId, vestiging }: Props) {
  const t = await eisClubToegang()
  const taal = await getTaal()
  const w = AFSPRAKEN[taal]
  const tl = w.vanLid
  const nu = new Date()
  const [lijst, medewerkers] = await Promise.all([haalAfsprakenVanLid(t.admin, t.userId, lidId, nu), haalAlleMedewerkers(t.admin, t.userId)])
  const naam = new Map((medewerkers ?? []).map((m) => [m.id, m.naam]))
  const komend = (lijst ?? []).filter((a) => a.status === 'gepland' && new Date(a.eind) >= nu)
  const geweest = (lijst ?? []).filter((a) => !komend.includes(a)).reverse().slice(0, 5)

  return (
    <section className="club-kaart club-afspraken-lid" aria-labelledby="afspraken-lid-kop">
      <div className="club-sectiekop">
        <h2 id="afspraken-lid-kop">{tl.titel}</h2>
        <Link href={clubPad('/afspraken', vestiging)}>{tl.agenda}</Link>
      </div>
      {lijst === null ? <p className="club-melding club-melding--fout">{tl.laadFout}</p> : null}
      {lijst !== null && lijst.length === 0 ? <p className="club-hint">{tl.leeg}</p> : null}
      {[{ titel: tl.komend, items: komend }, { titel: tl.eerder, items: geweest }].map((groep) =>
        groep.items.length > 0 ? (
          <div key={groep.titel} className="club-afspraken-lidgroep">
            <h3>{groep.titel}</h3>
            <ul>
              {groep.items.map((a) => {
                const datum = nlDatumTijd(a.start).datum
                return (
                  <li key={a.id} data-kleur={a.kleur} data-status={a.status}>
                    <Link href={clubPad('/afspraken', a.vestiging, { weergave: 'dag', dag: datum })}>
                      <span className="club-afspraken-itemtijd">{formatDatum(`${datum}T12:00:00Z`, taal, 'weekdagKort')}, {tijdvak(a, taal)}</span>
                      <strong>{a.typeNaam}</strong>
                      <span className="club-afspraken-meta">{tl.met(naam.get(a.medewerkerId) ?? tl.eenTrainer)}{a.status === 'gepland' ? '' : ` · ${w.status[a.status]}`}</span>
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
