import Link from 'next/link'
import { CheckCheck, Lock, Plus } from 'lucide-react'
import { isoWeekdag, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import { dekking } from '@/lib/club/personeel/regels'
import { urenKlok } from '@/lib/club/personeel/uren'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import type { Dienst, PersoneelLid, RoosterNotitie } from '@/lib/club/personeel/typen'
import { dagMaand, weekdagKort } from './weergave'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

type Labels = (typeof PERSONEEL)['nl']['labels']

// Het weekrooster op de telefoon: per dag een lijst diensten (tijd, wie, soort)
// in plaats van de tijdbalk. Zelfde gegevens en links als de tijdbalk; CSS kiest
// welke van de twee je ziet. Gaten en open diensten staan bij de dag.

interface Props {
  dagen: readonly string[]
  diensten: readonly Dienst[]
  notities: readonly RoosterNotitie[]
  bemand: Openingstijden
  team: readonly PersoneelLid[]
  soortNamen: ReadonlyMap<string, string>
  staat: PersoneelStaat
  vandaag: string
}

function gatMinuten(diensten: readonly Dienst[], van: string, tot: string): number {
  return dekking(diensten, tijdNaarMinuten(van), tijdNaarMinuten(tot))
    .filter((s) => s.aantal === 0)
    .reduce((n, s) => n + s.tot - s.van, 0)
}

function StatusTeken({ d, labels }: { d: Dienst; labels: Labels }) {
  if (d.uursoort !== 'werk') return <span className="club-chip club-chip--info">{labels.uursoort[d.uursoort]}</span>
  if (d.uurStatus === 'verwerkt') return <Lock aria-label={labels.uurStatus.verwerkt} size={14} />
  if (d.uurStatus === 'goedgekeurd') return <CheckCheck aria-label={labels.uurStatus.goedgekeurd} size={15} />
  return null
}

export async function DienstLijst({ dagen, diensten, notities, bemand, team, soortNamen, staat, vandaag }: Props) {
  const taal = await getTaal()
  const alles = await clubTekst(PERSONEEL)
  const tk = alles.lijst
  const basis = zonderPaneel(staat)
  return (
    <section className="club-personeel-dienstlijst" aria-label={tk.label}>
      {dagen.map((datum) => {
        const eigen = diensten.filter((d) => d.datum === datum).sort((a, b) => a.begin.localeCompare(b.begin))
        const open = bemand[isoWeekdag(datum) - 1]
        const gat = open ? gatMinuten(eigen, open.van, open.tot) : 0
        const isVandaag = datum === vandaag
        return (
          <section key={datum} className="club-personeel-lijstdag" data-vandaag={isVandaag || undefined} aria-labelledby={`club-personeel-lijst-${datum}`}>
            <header className="club-personeel-lijstkop">
              <h2 id={`club-personeel-lijst-${datum}`}>
                {weekdagKort(datum, taal)} <span className="club-zacht">{dagMaand(datum, taal)}</span>
              </h2>
              {isVandaag && <span className="club-chip club-chip--merk">{tk.vandaag}</span>}
              {gat > 0 && <span className="club-chip club-chip--let-op">{alles.dag.gatUur(urenKlok(gat))}</span>}
              <Link className="club-knop club-knop--klein club-knop--stil club-personeel-lijstplus" href={personeelHref(basis, { nieuw: datum, van: open?.van ?? null, tot: null })} scroll={false} aria-label={tk.plannenOp(`${weekdagKort(datum, taal)} ${dagMaand(datum, taal)}`)}>
                <Plus aria-hidden size={16} />
              </Link>
            </header>
            {notities
              .filter((n) => n.datum === datum)
              .map((n) => (
                <Link key={n.id} className="club-personeel-lijstnotitie" data-soort={n.soort} href={personeelHref(basis, { paneel: 'notitie', nieuw: datum })} scroll={false}>
                  {n.van && <span className="club-getal">{n.van}</span>}
                  {n.soort === 'geen_afspraken' && n.medewerkerId ? `${team.find((l) => l.id === n.medewerkerId)?.naam ?? alles.algemeen.onbekend}: ` : ''}
                  {n.tekst}
                </Link>
              ))}
            {eigen.length === 0 ? (
              <p className="club-personeel-lijstleeg">{open ? tk.nogGeen : alles.dag.onbemand}</p>
            ) : (
              <ul className="club-personeel-lijstrijen">
                {eigen.map((d) => {
                  const lid = team.find((l) => l.id === d.medewerkerId) ?? null
                  const soort = d.soortId ? soortNamen.get(d.soortId) : null
                  return (
                    <li key={d.id}>
                      <Link
                        href={personeelHref(basis, { dienst: d.id })}
                        scroll={false}
                        className="club-personeel-lijstrij"
                        data-kleur={lid?.kleur}
                        data-open={lid === null || undefined}
                        data-uursoort={d.uursoort}
                        aria-current={staat.dienst === d.id ? 'true' : undefined}
                      >
                        <span className="club-personeel-lijsttijd club-getal">
                          {d.begin}
                          <span>
                            <span className="club-sr">{alles.algemeen.tot} </span>
                            {d.eind}
                          </span>
                        </span>
                        <span className="club-personeel-lijstwie">
                          <strong>{lid?.naam ?? alles.algemeen.openDienst}</strong>
                          {soort && <span>{soort}</span>}
                        </span>
                        <StatusTeken d={d} labels={alles.labels} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </section>
  )
}
