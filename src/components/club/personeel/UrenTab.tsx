import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { plusDagen, weekParam, type NlMoment } from '@/lib/club/rooster/tijd'
import { haalDiensten } from '@/lib/club/personeel/opslag'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import { afwijkingen, goedTeKeuren, PERIODE_SOORTEN, periodeVan, urenOverzicht, verschuifPeriode } from '@/lib/club/personeel/uren'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'
import type { PersoneelLid } from '@/lib/club/personeel/typen'
import { UrenActies } from './UrenActies'
import { UrenTabel } from './UrenTabel'
import { dagMaand, dagMaandLang, uurTekst, weekdagKort } from './weergave'

// Urenadministratie: per periode per medewerker gepland, gewerkt, contract,
// ziek, verlof, avond en weekend, met de afwijkingen die eerst bekeken moeten
// worden. Goedkeuren in een keer kan alleen voor diensten zonder afwijking.

interface Props {
  t: ClubToegang
  staat: PersoneelStaat
  vestiging: Vestiging
  team: PersoneelLid[]
  nu: NlMoment
}

export async function UrenTab({ t, staat, vestiging, team, nu }: Props) {
  const taal = await getTaal()
  const alles = await clubTekst(PERSONEEL)
  const tk = alles.urenTab
  const periode = periodeVan(staat.periode, staat.op ?? nu.datum)
  const diensten = await haalDiensten(t.admin, t.userId, vestiging, periode.van, periode.tot)
  if (!diensten) return <p className="club-melding club-melding--fout" role="alert">{tk.laadFout}</p>
  const regels = urenOverzicht(team, diensten, periode)
  const afw = afwijkingen(diensten, nu.datum, nu.minuten, taal)
  const klaarVoorGoedkeuren = goedTeKeuren(diensten, afw).length
  const teVerwerken = diensten.filter((d) => d.uurStatus === 'goedgekeurd').length
  const verwerkt = diensten.filter((d) => d.uurStatus === 'verwerkt').length
  const basis = zonderPaneel(staat)
  const laatste = plusDagen(periode.tot, -1)
  const csv = `/api/club/personeel/uren/csv?${new URLSearchParams({ v: vestiging, periode: periode.soort, op: periode.van }).toString()}`
  const som = (k: 'gewerktMin' | 'geplandMin' | 'ziekMin' | 'verlofMin') => regels.reduce((n, r) => n + r[k], 0)

  return (
    <>
      <section className="club-personeel-balk" aria-label={tk.periode}>
        <div className="club-segment" role="group" aria-label={tk.soortPeriode}>
          {PERIODE_SOORTEN.map((p) => (
            <Link key={p} href={personeelHref(basis, { periode: p })} aria-current={staat.periode === p ? 'page' : undefined} scroll={false}>
              {alles.labels.periode[p]}
            </Link>
          ))}
        </div>
        <nav className="club-personeel-bladeren" aria-label={tk.periodeKiezen}>
          <Link className="club-knop club-knop--klein" href={personeelHref(basis, { op: verschuifPeriode(periode, -1).van })} aria-label={tk.vorige} scroll={false}>
            <ChevronLeft aria-hidden size={16} />
          </Link>
          <span className="club-personeel-periode">
            {tk.bereik(dagMaandLang(periode.van, taal), dagMaandLang(laatste, taal))}
          </span>
          <Link className="club-knop club-knop--klein" href={personeelHref(basis, { op: verschuifPeriode(periode, 1).van })} aria-label={tk.volgende} scroll={false}>
            <ChevronRight aria-hidden size={16} />
          </Link>
        </nav>
        <a className="club-knop club-knop--klein" href={csv} download>
          <Download aria-hidden size={14} /> {tk.csv}
        </a>
      </section>

      <dl className="club-personeel-cijfers club-personeel-cijfers--groot">
        <div><dt>{tk.gewerkt}</dt><dd className="club-getal">{uurTekst(som('gewerktMin'), taal)}</dd></div>
        <div><dt>{tk.gepland}</dt><dd className="club-getal">{uurTekst(som('geplandMin'), taal)}</dd></div>
        <div><dt>{tk.ziekVerlof}</dt><dd className="club-getal">{uurTekst(som('ziekMin'), taal)} / {uurTekst(som('verlofMin'), taal)}</dd></div>
        <div data-let-op={afw.length > 0 || undefined}><dt>{tk.afwijkingen}</dt><dd className="club-getal">{afw.length}</dd></div>
        <div><dt>{tk.teVerwerken}</dt><dd className="club-getal">{teVerwerken}</dd></div>
        <div><dt>{tk.verwerkt}</dt><dd className="club-getal">{verwerkt}</dd></div>
      </dl>

      <UrenActies vestiging={vestiging} van={periode.van} tot={periode.tot} klaarVoorGoedkeuren={klaarVoorGoedkeuren} afwijkingen={afw.length} teVerwerken={teVerwerken} />

      <div className="club-personeel-werkvlak">
        <UrenTabel regels={regels} team={team} />
        <aside className="club-personeel-zij">
          <section className="club-kaart club-personeel-zijkaart" aria-labelledby="club-personeel-afw">
            <h2 id="club-personeel-afw">
              {tk.afwijkingen} <span className="club-getal club-zacht">{afw.length}</span>
            </h2>
            {afw.length === 0 ? (
              <p className="club-hint">{tk.geenAfwijkingen}</p>
            ) : (
              <ul className="club-personeel-meldingen">
                {afw.map((a, i) => (
                  <li key={`${a.dienstId}-${a.soort}-${i}`} data-soort={a.soort}>
                    <Link href={personeelHref(zonderPaneel({ ...staat, tab: 'week', mw: null }), { week: weekParam(a.datum), dienst: a.dienstId })}>
                      <span className="club-personeel-meldingdag">
                        {weekdagKort(a.datum, taal)} {dagMaand(a.datum, taal)}
                      </span>
                      <span>
                        <strong>{team.find((l) => l.id === a.medewerkerId)?.naam ?? alles.algemeen.onbekend}</strong> · {tk.afwijking[a.soort]}
                        <br />
                        <span className="club-zacht">{a.tekst}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}
