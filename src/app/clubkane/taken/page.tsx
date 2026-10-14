import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { clubPad, kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { isDatum, nlDelen, plusDagen, weekParam } from '@/lib/club/rooster/tijd'
import { alleenActief, haalAfsluitrondes, haalAfvinkingen, haalNotities, haalTaken } from '@/lib/club/taken/opslag'
import { takenHref } from '@/lib/club/taken/url'
import { weekContext } from '@/lib/club/taken/week'
import { dagLang } from '@/lib/club/taken/weergave'
import { AfvinkProvider } from '@/components/club/taken/AfvinkContext'
import { DagAfsluiten } from '@/components/club/taken/DagAfsluiten'
import { DagNotities } from '@/components/club/taken/DagNotities'
import { AutoVerversen, PrintKnop } from '@/components/club/taken/Hulpjes'
import { PersoonKiezer } from '@/components/club/taken/PersoonKiezer'
import { TakenKop } from '@/components/club/taken/TakenKop'
import { TakenRaster } from '@/components/club/taken/TakenRaster'
import '@/components/club/taken/taken.css'

export const metadata: Metadata = { title: 'Taken' }

// De dag, in dezelfde tabel als de week (zoals de Excel van Budel, besluit Kane):
// per lijst de taken met een kolom voor deze dag, afvinken met een tik, de
// weekteller ernaast. Bladeren per dag (?dag=2026-10-14); standaard vandaag.
// Onderaan het notitieveld en "Afsluitronde klaar".

function kiesDag(ruw: string | string[] | undefined, vandaag: string): string {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return isDatum(w) ? w : vandaag
}

export default async function TakenDagPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const params = await searchParams
  const vestiging = kiesVestiging(params.v)
  const vandaag = nlDelen(new Date()).datum
  const dag = kiesDag(params.dag, vandaag)
  const w = weekContext(weekParam(dag), vandaag)
  const [data, afvinkingen, notities, rondes, medewerkers] = await Promise.all([
    haalTaken(t.admin, t.userId, vestiging),
    haalAfvinkingen(t.admin, t.userId, vestiging, w.maandag, w.zondag),
    haalNotities(t.admin, t.userId, vestiging, dag, dag),
    haalAfsluitrondes(t.admin, t.userId, vestiging, dag, dag),
    haalMedewerkers(t.admin, t.userId, vestiging),
  ])
  const actief = data ? alleenActief(data) : null
  const naam = dagLang(dag)
  const dagHref = (d: string) => clubPad('/taken', vestiging, d === vandaag ? undefined : { dag: d })

  return (
    <div className="club-taken-pagina">
      {dag === vandaag && <AutoVerversen />}
      <TakenKop
        vestiging={vestiging}
        vestigingNaam={VESTIGING_LABEL[vestiging]}
        weergave=""
        titel={`${naam.charAt(0).toUpperCase()}${naam.slice(1)}`}
        sub={dag === vandaag ? 'Vandaag. Tik op een vakje om af te vinken.' : dag < vandaag ? 'Een eerdere dag.' : 'Een dag die nog moet komen.'}
      >
        <nav className="club-taken-bladeren" aria-label="Dag kiezen">
          <Link href={dagHref(plusDagen(dag, -1))} className="club-knop club-knop--klein" aria-label="Vorige dag" scroll={false}>
            <ChevronLeft aria-hidden size={16} />
          </Link>
          <Link href={dagHref(vandaag)} className="club-knop club-knop--klein" aria-current={dag === vandaag ? 'page' : undefined} scroll={false}>
            Vandaag
          </Link>
          <Link href={dagHref(plusDagen(dag, 1))} className="club-knop club-knop--klein" aria-label="Volgende dag" scroll={false}>
            <ChevronRight aria-hidden size={16} />
          </Link>
        </nav>
        <PrintKnop />
      </TakenKop>
      {!actief || !afvinkingen || !notities || !rondes ? (
        <p className="club-melding club-melding--fout" role="alert">
          De taken konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </p>
      ) : actief.lijsten.length === 0 ? (
        <div className="club-leeg">
          <p>Deze vestiging heeft nog geen takenlijsten.</p>
          <Link className="club-knop club-knop--primair" href={takenHref('beheer', vestiging)}>
            Lijsten maken of kopieren
          </Link>
        </div>
      ) : (
        <AfvinkProvider
          key={`${vestiging}-${dag}`}
          vestiging={vestiging}
          vandaag={vandaag}
          medewerkers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
          begin={afvinkingen}
        >
          <PersoonKiezer />
          {actief.lijsten.map((l) => (
            <TakenRaster key={l.id} lijst={l} taken={actief.taken.filter((x) => x.lijstId === l.id)} dagen={[dag]} />
          ))}
          <DagNotities datum={dag} begin={notities} />
          {dag === vandaag && <DagAfsluiten lijsten={actief.lijsten} taken={actief.taken} dagen={w.dagen} ronde={rondes[0] ?? null} />}
        </AfvinkProvider>
      )}
    </div>
  )
}
