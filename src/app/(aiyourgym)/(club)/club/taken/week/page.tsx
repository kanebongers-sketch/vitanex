import type { Metadata } from 'next'
import Link from 'next/link'
import { eisModule } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { alleenActief, haalAfvinkingen, haalNotities, haalTaken } from '@/lib/club/taken/opslag'
import { leesWeek, takenHref } from '@/lib/club/taken/url'
import { weekContext } from '@/lib/club/taken/week'
import { weekLabel } from '@/lib/club/taken/weergave'
import { AfvinkProvider } from '@/components/club/taken/AfvinkContext'
import { WeekNotities } from '@/components/club/taken/DagNotities'
import { PrintKnop } from '@/components/club/taken/Hulpjes'
import { PersoonKiezer } from '@/components/club/taken/PersoonKiezer'
import { TakenKop, WeekBladeren } from '@/components/club/taken/TakenKop'
import { TakenRaster } from '@/components/club/taken/TakenRaster'
import '@/components/club/taken/taken.css'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(TAKEN)).pagina.metaWeek }
}

// De week zoals het Excel-tabblad, maar dan beter: per lijst een raster van
// taken en dagen, afvinken met een tik, tellers voor de weektaken.

export default async function TakenWeekPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('taken')
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const w = weekContext(leesWeek(params.week), nlDelen(new Date()).datum)
  const [data, afvinkingen, notities, medewerkers] = await Promise.all([
    haalTaken(t.admin, t.userId, vestiging),
    haalAfvinkingen(t.admin, t.userId, vestiging, w.maandag, w.zondag),
    haalNotities(t.admin, t.userId, vestiging, w.maandag, w.zondag),
    haalMedewerkers(t.admin, t.userId, vestiging),
  ])
  const actief = data ? alleenActief(data) : null
  const taal = await getTaal()
  const tt = TAKEN[taal]

  return (
    <div className="club-taken-pagina">
      <TakenKop
        vestiging={vestiging}
        vestigingNaam={naamVan(t.vestigingen, vestiging)}
        weergave="week"
        titel={
          <>
            {tt.raster.week} <span className="club-taken-weeknr">{w.weekNummer}</span>
          </>
        }
        sub={weekLabel(w.maandag, taal)}
      >
        <WeekBladeren weergave="week" vestiging={vestiging} vorige={w.vorige} volgende={w.volgende} isDezeWeek={w.isDezeWeek} />
        <PrintKnop />
      </TakenKop>
      {!actief || !afvinkingen || !notities ? (
        <p className="club-melding club-melding--fout" role="alert">
          {tt.dag.fout}
        </p>
      ) : actief.lijsten.length === 0 ? (
        <div className="club-leeg">
          <p>{tt.dag.geenLijsten}</p>
          <Link className="club-knop club-knop--primair" href={takenHref('beheer', vestiging)}>
            {tt.dag.lijstenMaken}
          </Link>
        </div>
      ) : (
        <AfvinkProvider
          key={`${vestiging}-${w.maandag}`}
          vestiging={vestiging}
          vandaag={w.vandaag}
          medewerkers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
          begin={afvinkingen}
        >
          <PersoonKiezer />
          {actief.lijsten.map((l) => (
            <TakenRaster key={l.id} lijst={l} taken={actief.taken.filter((x) => x.lijstId === l.id)} dagen={w.dagen} />
          ))}
          <WeekNotities dagen={w.dagen} notities={notities} />
        </AfvinkProvider>
      )}
    </div>
  )
}
