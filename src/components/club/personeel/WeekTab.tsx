import type { CSSProperties } from 'react'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { dagenVanWeek, isoWeekdag, isoWeek, minutenNaarTijd, type NlMoment } from '@/lib/club/rooster/tijd'
import { controleerWeek } from '@/lib/club/personeel/controle'
import { geplandPerPersoon, isWerk, MIN_RUST_UREN } from '@/lib/club/personeel/regels'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import type { PersoneelLid } from '@/lib/club/personeel/typen'
import { DagRij } from './DagRij'
import { DienstLijst } from './DienstLijst'
import { ControleLijst, UrenBalk } from './WeekZij'
import { SnelPlannen } from './SnelPlannen'
import { PrintWeek } from './PrintWeek'
import { DienstPaneel } from './DienstPaneel'
import { PatroonPaneel } from './PatroonPaneel'
import { NotitiePaneel } from './NotitiePaneel'
import { bereikVan, laadWeek } from './week-data'
import { magUrenActie, magUrenBeheren } from '@/lib/club/personeel/uren-rechten'
import { plekStijl, uurTekst, type Bereik } from './weergave'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

interface Props {
  t: ClubToegang
  staat: PersoneelStaat
  vestiging: Vestiging
  team: PersoneelLid[]
  maandag: string
  nu: NlMoment
}

function TijdAs({ bereik }: { bereik: Bereik }) {
  const uren = Array.from({ length: (bereik.tot - bereik.van) / 60 + 1 }, (_, i) => bereik.van + i * 60)
  return (
    <div className="club-personeel-as" aria-hidden>
      <span className="club-personeel-baanlabel" />
      <div className="club-personeel-spoor">
        {uren.map((u) => (
          <span key={u} style={plekStijl(u, u, bereik)}>
            {minutenNaarTijd(u).slice(0, 2)}
          </span>
        ))}
      </div>
    </div>
  )
}

export async function WeekTab({ t, staat, vestiging, team, maandag, nu }: Props) {
  const taal = await getTaal()
  const tk = (await clubTekst(PERSONEEL)).week
  const data = await laadWeek(t, vestiging, maandag, team, staat.paneel === 'patroon')
  if (!data) return <p className="club-melding club-melding--fout" role="alert">{tk.laadFout}</p>
  const dagen = dagenVanWeek(maandag)
  const bereik = bereikVan(data.bemand, data.week, dagen)
  const meldingen = controleerWeek({
    dagen,
    diensten: data.week,
    randDiensten: data.alle.filter((d) => !dagen.includes(d.datum)),
    beschikbaarheid: data.beschikbaarheid,
    bemand: data.bemand,
    leden: team,
    minRustUren: MIN_RUST_UREN,
  }, taal)
  const gepland = geplandPerPersoon(data.week)
  const totaal = [...gepland.values()].reduce((a, b) => a + b, 0)
  const soortNamen = new Map(data.soorten.map((s) => [s.id, s.naam]))
  const gaten = meldingen.filter((m) => m.soort === 'gat').length
  const open = data.week.filter((d) => d.medewerkerId === null).length
  const geopend = staat.dienst ? (data.alle.find((d) => d.id === staat.dienst) ?? null) : null
  const sluitHref = personeelHref(zonderPaneel(staat))
  const paneelDatum = geopend?.datum ?? staat.nieuw

  return (
    <>
      <section className="club-personeel-balk" aria-label={tk.dezeWeek}>
        <dl className="club-personeel-cijfers">
          <div><dt>{tk.diensten}</dt><dd className="club-getal">{data.week.filter(isWerk).length}</dd></div>
          <div><dt>{tk.urenGepland}</dt><dd className="club-getal">{uurTekst(totaal, taal)}</dd></div>
          <div data-let-op={open > 0 || undefined}><dt>{tk.open}</dt><dd className="club-getal">{open}</dd></div>
          <div data-let-op={gaten > 0 || undefined}><dt>{tk.gaten}</dt><dd className="club-getal">{gaten}</dd></div>
        </dl>
        <SnelPlannen vestiging={vestiging} maandag={maandag} patroonHref={personeelHref(zonderPaneel(staat), { paneel: 'patroon' })} />
      </section>

      <div className="club-personeel-werkvlak">
        <section className="club-personeel-week" style={{ '--uren': (bereik.tot - bereik.van) / 60 } as CSSProperties} aria-label={tk.dienstenWeek(isoWeek(maandag).week)}>
          <TijdAs bereik={bereik} />
          {dagen.map((d) => (
            <DagRij
              key={d}
              datum={d}
              isVandaag={d === nu.datum}
              bemand={data.bemand[isoWeekdag(d) - 1]}
              bereik={bereik}
              diensten={data.week.filter((x) => x.datum === d)}
              notities={data.notities.filter((n) => n.datum === d)}
              team={team}
              soortNamen={soortNamen}
              staat={staat}
              nuMin={d === nu.datum ? nu.minuten : null}
            />
          ))}
        </section>
        <DienstLijst dagen={dagen} diensten={data.week} notities={data.notities} bemand={data.bemand} team={team} soortNamen={soortNamen} staat={staat} vandaag={nu.datum} />
        <aside className="club-personeel-zij">
          <UrenBalk team={team} gepland={gepland} staat={staat} />
          <ControleLijst meldingen={meldingen} staat={staat} />
        </aside>
      </div>

      <PrintWeek dagen={dagen} week={data.week} notities={data.notities} team={team} soortNamen={soortNamen} titel={tk.printTitel(isoWeek(maandag).week)} />

      {(geopend || (staat.nieuw && !staat.paneel)) && paneelDatum && (
        <DienstPaneel
          key={geopend?.id ?? `${staat.nieuw}-${staat.van}-${staat.mw}`}
          vestiging={vestiging}
          dienst={geopend}
          start={{ datum: paneelDatum, begin: staat.van, eind: staat.tot, medewerkerId: staat.mw }}
          team={team}
          soorten={data.soorten}
          alle={data.alle}
          beschikbaarheid={data.beschikbaarheid}
          bemand={data.bemand}
          sluitHref={sluitHref}
          uren={{ goedkeuren: magUrenBeheren(t), wijzigen: geopend ? magUrenActie(t, geopend, 'bevestig') : false }}
        />
      )}
      {staat.paneel === 'patroon' && <PatroonPaneel vestiging={vestiging} maandag={maandag} sjablonen={data.sjablonen} sluitHref={sluitHref} />}
      {staat.paneel === 'notitie' && staat.nieuw && (
        <NotitiePaneel vestiging={vestiging} datum={staat.nieuw} notities={data.notities.filter((n) => n.datum === staat.nieuw)} team={team} sluitHref={sluitHref} />
      )}
    </>
  )
}
