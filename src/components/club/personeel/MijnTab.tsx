import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { maandagVan, plusDagen, weekParam, isoWeek } from '@/lib/club/rooster/tijd'
import { haalDienstenVan } from '@/lib/club/personeel/opslag'
import { duurMin } from '@/lib/club/personeel/regels'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import { UUR_STATUS_LABEL, UURSOORT_LABEL, type Dienst, type PersoneelLid } from '@/lib/club/personeel/typen'
import { PrintKnop } from './PrintKnop'
import { dagMaand, uurTekst, weekdagKort } from './weergave'

// "Mijn diensten": de komende vier weken van een medewerker, per week met de
// uren tegenover het contract, en de afgelopen twee weken met de urenstatus.
// Later ziet een medewerker dit zelf; nu kiest Kane wie.

interface Props {
  t: ClubToegang
  staat: PersoneelStaat
  team: PersoneelLid[]
  vandaag: string
}

type EigenDienst = Dienst & { vestiging: string }

interface DienstRegelProps {
  d: EigenDienst
  staat: PersoneelStaat
  toonStatus: boolean
  vestigingen: readonly VestigingInfo[]
}

function DienstRegel({ d, staat, toonStatus, vestigingen }: DienstRegelProps) {
  const href = personeelHref(zonderPaneel({ ...staat, tab: 'week', mw: null }), { week: weekParam(d.datum), dienst: d.id, v: d.vestiging })
  return (
    <li className="club-rij">
      <span className="club-personeel-mijndag">
        <span>{weekdagKort(d.datum)}</span>
        <strong className="club-getal">{dagMaand(d.datum)}</strong>
      </span>
      <span className="club-rij-hoofd">
        <span className="club-rij-titel club-getal">
          {d.begin} tot {d.eind}
        </span>
        <span className="club-rij-sub">{[naamVan(vestigingen, d.vestiging), d.notitie].filter(Boolean).join(' · ')}</span>
      </span>
      {d.uursoort !== 'werk' && <span className="club-chip club-chip--info">{UURSOORT_LABEL[d.uursoort]}</span>}
      {toonStatus && <span className={d.uurStatus === 'gepland' ? 'club-chip club-chip--let-op' : 'club-chip club-chip--ok'}>{d.uurStatus === 'gepland' ? 'Niet bevestigd' : UUR_STATUS_LABEL[d.uurStatus]}</span>}
      <Link className="club-knop club-knop--klein club-personeel-geen-print" href={href}>
        Open
      </Link>
    </li>
  )
}

export async function MijnTab({ t, staat, team, vandaag }: Props) {
  const gekozen = team.find((l) => l.id === staat.mw) ?? null
  const kiezer = (
    <form className="club-personeel-kiezer club-personeel-geen-print" method="get" action="/clubkane/personeel">
      <input type="hidden" name="v" value={staat.v} />
      <input type="hidden" name="tab" value="mijn" />
      <label className="club-veld">
        <span>Medewerker</span>
        <select className="club-invoer" name="mw" defaultValue={gekozen?.id ?? ''}>
          <option value="" disabled>Kies een medewerker</option>
          {team.map((l) => (
            <option key={l.id} value={l.id}>{l.naam}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="club-knop">Toon</button>
      {gekozen && <PrintKnop />}
    </form>
  )
  if (!gekozen) return <>{kiezer}<p className="club-leeg">Kies een medewerker om zijn of haar diensten te zien.</p></>

  const maandag = maandagVan(vandaag)
  const diensten = await haalDienstenVan(t.admin, t.userId, gekozen.id, plusDagen(vandaag, -14), plusDagen(maandag, 28))
  if (!diensten) return <>{kiezer}<p className="club-melding club-melding--fout" role="alert">De diensten konden niet worden geladen.</p></>
  const weken = [0, 1, 2, 3].map((i) => plusDagen(maandag, i * 7))
  const verleden = diensten.filter((d) => d.datum < vandaag).reverse()

  return (
    <div className="club-personeel-mijn">
      {kiezer}
      <h2 className="club-personeel-mijnnaam" data-kleur={gekozen.kleur}>
        <span className="club-personeel-stip" aria-hidden /> {gekozen.naam}
      </h2>
      <div className="club-raster">
        {weken.map((wk) => {
          const eigen = diensten.filter((d) => d.datum >= wk && d.datum < plusDagen(wk, 7) && d.datum >= vandaag)
          const min = eigen.filter((d) => d.uursoort === 'werk').reduce((n, d) => n + duurMin(d.begin, d.eind), 0)
          return (
            <section key={wk} className="club-kaart club-k6" aria-label={`Week ${isoWeek(wk).week}`}>
              <h3 className="club-personeel-mijnkop">
                Week {isoWeek(wk).week}
                <span className="club-getal club-zacht">
                  {uurTekst(min)} uur{gekozen.contracturen !== null ? ` van ${uurTekst(gekozen.contracturen * 60)}` : ''}
                </span>
              </h3>
              {eigen.length === 0 ? <p className="club-hint">Geen diensten.</p> : <ul className="club-lijst">{eigen.map((d) => <DienstRegel key={d.id} d={d} staat={staat} toonStatus={false} vestigingen={t.vestigingen} />)}</ul>}
            </section>
          )
        })}
      </div>
      <section className="club-kaart club-personeel-geen-print" aria-labelledby="club-personeel-verleden">
        <h3 id="club-personeel-verleden">Afgelopen twee weken</h3>
        {verleden.length === 0 ? <p className="club-hint">Geen diensten.</p> : <ul className="club-lijst">{verleden.map((d) => <DienstRegel key={d.id} d={d} staat={staat} toonStatus vestigingen={t.vestigingen} />)}</ul>}
      </section>
    </div>
  )
}
