import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { maandagVan, plusDagen, weekParam, isoWeek } from '@/lib/club/rooster/tijd'
import { haalDienstenVan } from '@/lib/club/personeel/opslag'
import { duurMin } from '@/lib/club/personeel/regels'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import type { Dienst, PersoneelLid } from '@/lib/club/personeel/typen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

type Tekst = (typeof PERSONEEL)['nl']
import { PrintKnop } from './PrintKnop'
import { dagMaand, uurTekst, weekdagKort } from './weergave'

// "Mijn diensten": de komende vier weken van een medewerker, per week met de
// uren tegenover het contract, en de afgelopen twee weken met de urenstatus.
// Een ingelogde medewerker ziet meteen zijn eigen diensten; anderen kiezen wie.

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
  tk: Tekst
  taal: Taal
}

function DienstRegel({ d, staat, toonStatus, vestigingen, tk, taal }: DienstRegelProps) {
  const href = personeelHref(zonderPaneel({ ...staat, tab: 'week', mw: null }), { week: weekParam(d.datum), dienst: d.id, v: d.vestiging })
  return (
    <li className="club-rij">
      <span className="club-personeel-mijndag">
        <span>{weekdagKort(d.datum, taal)}</span>
        <strong className="club-getal">{dagMaand(d.datum, taal)}</strong>
      </span>
      <span className="club-rij-hoofd">
        <span className="club-rij-titel club-getal">{tk.algemeen.vanTot(d.begin, d.eind)}</span>
        <span className="club-rij-sub">{[naamVan(vestigingen, d.vestiging), d.notitie].filter(Boolean).join(' · ')}</span>
      </span>
      {d.uursoort !== 'werk' && <span className="club-chip club-chip--info">{tk.labels.uursoort[d.uursoort]}</span>}
      {toonStatus && <span className={d.uurStatus === 'gepland' ? 'club-chip club-chip--let-op' : 'club-chip club-chip--ok'}>{d.uurStatus === 'gepland' ? tk.mijn.nietBevestigd : tk.labels.uurStatus[d.uurStatus]}</span>}
      <Link className="club-knop club-knop--klein club-personeel-geen-print" href={href}>
        {tk.mijn.open}
      </Link>
    </li>
  )
}

export async function MijnTab({ t, staat, team, vandaag }: Props) {
  const taal = await getTaal()
  const tk = await clubTekst(PERSONEEL)
  // Een ingelogde medewerker ziet zonder keuze meteen zijn eigen diensten.
  const wie = staat.mw ?? (t.rol === 'medewerker' ? t.persoonId : null)
  const gekozen = team.find((l) => l.id === wie) ?? null
  const kiezer = (
    <form className="club-personeel-kiezer club-personeel-geen-print" method="get" action="/club/personeel">
      <input type="hidden" name="v" value={staat.v} />
      <input type="hidden" name="tab" value="mijn" />
      <label className="club-veld">
        <span>{tk.mijn.medewerker}</span>
        <select className="club-invoer" name="mw" defaultValue={gekozen?.id ?? ''}>
          <option value="" disabled>{tk.mijn.kies}</option>
          {team.map((l) => (
            <option key={l.id} value={l.id}>{l.naam}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="club-knop">{tk.mijn.toon}</button>
      {gekozen && <PrintKnop />}
    </form>
  )
  if (!gekozen) return <>{kiezer}<p className="club-leeg">{tk.mijn.kiesUitleg}</p></>

  const maandag = maandagVan(vandaag)
  const diensten = await haalDienstenVan(t.admin, t.userId, gekozen.id, plusDagen(vandaag, -14), plusDagen(maandag, 28))
  if (!diensten) return <>{kiezer}<p className="club-melding club-melding--fout" role="alert">{tk.mijn.laadFout}</p></>
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
            <section key={wk} className="club-kaart club-k6" aria-label={tk.mijn.week(isoWeek(wk).week)}>
              <h3 className="club-personeel-mijnkop">
                {tk.mijn.week(isoWeek(wk).week)}
                <span className="club-getal club-zacht">
                  {tk.mijn.uren(uurTekst(min, taal))}{gekozen.contracturen !== null ? tk.mijn.vanContract(uurTekst(gekozen.contracturen * 60, taal)) : ''}
                </span>
              </h3>
              {eigen.length === 0 ? <p className="club-hint">{tk.algemeen.geenDiensten}</p> : <ul className="club-lijst">{eigen.map((d) => <DienstRegel key={d.id} d={d} staat={staat} toonStatus={false} vestigingen={t.vestigingen} tk={tk} taal={taal} />)}</ul>}
            </section>
          )
        })}
      </div>
      <section className="club-kaart club-personeel-geen-print" aria-labelledby="club-personeel-verleden">
        <h3 id="club-personeel-verleden">{tk.mijn.afgelopen}</h3>
        {verleden.length === 0 ? <p className="club-hint">{tk.algemeen.geenDiensten}</p> : <ul className="club-lijst">{verleden.map((d) => <DienstRegel key={d.id} d={d} staat={staat} toonStatus vestigingen={t.vestigingen} tk={tk} taal={taal} />)}</ul>}
      </section>
    </div>
  )
}
