import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { plusDagen, weekParam, type NlMoment } from '@/lib/club/rooster/tijd'
import { haalDiensten } from '@/lib/club/personeel/opslag'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import { afwijkingen, goedTeKeuren, PERIODE_LABEL, PERIODE_SOORTEN, periodeVan, urenOverzicht, verschuifPeriode, type Afwijking } from '@/lib/club/personeel/uren'
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

const AFWIJKING_LABEL: Record<Afwijking['soort'], string> = { afwijkend: 'Andere tijd', onbevestigd: 'Niet bevestigd', overlap: 'Overlap' }

export async function UrenTab({ t, staat, vestiging, team, nu }: Props) {
  const periode = periodeVan(staat.periode, staat.op ?? nu.datum)
  const diensten = await haalDiensten(t.admin, t.userId, vestiging, periode.van, periode.tot)
  if (!diensten) return <p className="club-melding club-melding--fout" role="alert">De uren konden niet worden geladen.</p>
  const regels = urenOverzicht(team, diensten, periode)
  const afw = afwijkingen(diensten, nu.datum, nu.minuten)
  const klaarVoorGoedkeuren = goedTeKeuren(diensten, afw).length
  const teVerwerken = diensten.filter((d) => d.uurStatus === 'goedgekeurd').length
  const verwerkt = diensten.filter((d) => d.uurStatus === 'verwerkt').length
  const basis = zonderPaneel(staat)
  const laatste = plusDagen(periode.tot, -1)
  const csv = `/api/club/personeel/uren/csv?${new URLSearchParams({ v: vestiging, periode: periode.soort, op: periode.van }).toString()}`
  const som = (k: 'gewerktMin' | 'geplandMin' | 'ziekMin' | 'verlofMin') => regels.reduce((n, r) => n + r[k], 0)

  return (
    <>
      <section className="club-personeel-balk" aria-label="Periode">
        <div className="club-segment" role="group" aria-label="Soort periode">
          {PERIODE_SOORTEN.map((p) => (
            <Link key={p} href={personeelHref(basis, { periode: p })} aria-current={staat.periode === p ? 'page' : undefined} scroll={false}>
              {PERIODE_LABEL[p]}
            </Link>
          ))}
        </div>
        <nav className="club-personeel-bladeren" aria-label="Periode kiezen">
          <Link className="club-knop club-knop--klein" href={personeelHref(basis, { op: verschuifPeriode(periode, -1).van })} aria-label="Vorige periode" scroll={false}>
            <ChevronLeft aria-hidden size={16} />
          </Link>
          <span className="club-personeel-periode">
            {dagMaandLang(periode.van)} tot en met {dagMaandLang(laatste)}
          </span>
          <Link className="club-knop club-knop--klein" href={personeelHref(basis, { op: verschuifPeriode(periode, 1).van })} aria-label="Volgende periode" scroll={false}>
            <ChevronRight aria-hidden size={16} />
          </Link>
        </nav>
        <a className="club-knop club-knop--klein" href={csv} download>
          <Download aria-hidden size={14} /> CSV voor salaris
        </a>
      </section>

      <dl className="club-personeel-cijfers club-personeel-cijfers--groot">
        <div><dt>Gewerkt</dt><dd className="club-getal">{uurTekst(som('gewerktMin'))}</dd></div>
        <div><dt>Gepland</dt><dd className="club-getal">{uurTekst(som('geplandMin'))}</dd></div>
        <div><dt>Ziek / verlof</dt><dd className="club-getal">{uurTekst(som('ziekMin'))} / {uurTekst(som('verlofMin'))}</dd></div>
        <div data-let-op={afw.length > 0 || undefined}><dt>Afwijkingen</dt><dd className="club-getal">{afw.length}</dd></div>
        <div><dt>Te verwerken</dt><dd className="club-getal">{teVerwerken}</dd></div>
        <div><dt>Verwerkt</dt><dd className="club-getal">{verwerkt}</dd></div>
      </dl>

      <UrenActies vestiging={vestiging} van={periode.van} tot={periode.tot} klaarVoorGoedkeuren={klaarVoorGoedkeuren} afwijkingen={afw.length} teVerwerken={teVerwerken} />

      <div className="club-personeel-werkvlak">
        <UrenTabel regels={regels} team={team} />
        <aside className="club-personeel-zij">
          <section className="club-kaart club-personeel-zijkaart" aria-labelledby="club-personeel-afw">
            <h2 id="club-personeel-afw">
              Afwijkingen <span className="club-getal club-zacht">{afw.length}</span>
            </h2>
            {afw.length === 0 ? (
              <p className="club-hint">Geen afwijkingen in deze periode.</p>
            ) : (
              <ul className="club-personeel-meldingen">
                {afw.map((a, i) => (
                  <li key={`${a.dienstId}-${a.soort}-${i}`} data-soort={a.soort}>
                    <Link href={personeelHref(zonderPaneel({ ...staat, tab: 'week', mw: null }), { week: weekParam(a.datum), dienst: a.dienstId })}>
                      <span className="club-personeel-meldingdag">
                        {weekdagKort(a.datum)} {dagMaand(a.datum)}
                      </span>
                      <span>
                        <strong>{team.find((l) => l.id === a.medewerkerId)?.naam ?? 'Onbekend'}</strong> · {AFWIJKING_LABEL[a.soort]}
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
