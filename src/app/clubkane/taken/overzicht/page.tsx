import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { isoWeek, nlDelen } from '@/lib/club/rooster/tijd'
import { alleenActief, haalAfsluitrondes, haalAfvinkingen, haalNotities, haalTaken } from '@/lib/club/taken/opslag'
import { achterstand, historie, vorigeMaandagen } from '@/lib/club/taken/overzicht'
import { leesWeek } from '@/lib/club/taken/url'
import { weekContext } from '@/lib/club/taken/week'
import { weekLabel } from '@/lib/club/taken/weergave'
import { Achterstand, Historie, OverzichtTegels } from '@/components/club/taken/Overzicht'
import { TakenKop, WeekBladeren } from '@/components/club/taken/TakenKop'
import '@/components/club/taken/taken.css'

export const metadata: Metadata = { title: 'Overzicht taken' }

const AANTAL_WEKEN = 4

export default async function TakenOverzichtPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const params = await searchParams
  const vestiging = kiesVestiging(params.v)
  const w = weekContext(leesWeek(params.week), nlDelen(new Date()).datum)
  const maandagen = vorigeMaandagen(w.maandag, AANTAL_WEKEN)
  const [data, afvinkingen, notities, rondes] = await Promise.all([
    haalTaken(t.admin, t.userId, vestiging),
    haalAfvinkingen(t.admin, t.userId, vestiging, maandagen[0], w.zondag),
    haalNotities(t.admin, t.userId, vestiging, w.maandag, w.zondag),
    haalAfsluitrondes(t.admin, t.userId, vestiging, w.maandag, w.zondag),
  ])
  const actief = data ? alleenActief(data) : null
  const kop = (
    <TakenKop vestiging={vestiging} vestigingNaam={VESTIGING_LABEL[vestiging]} weergave="overzicht" titel={`Overzicht week ${w.weekNummer}`} sub={weekLabel(w.maandag)}>
      <WeekBladeren weergave="overzicht" vestiging={vestiging} vorige={w.vorige} volgende={w.volgende} isDezeWeek={w.isDezeWeek} />
    </TakenKop>
  )
  if (!actief || !afvinkingen || !notities || !rondes) {
    return (
      <div className="club-taken-pagina">
        {kop}
        <p className="club-melding club-melding--fout" role="alert">
          Het overzicht kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </p>
      </div>
    )
  }

  const regels = achterstand(actief.taken, afvinkingen, w.dagen, w.vandaag)
  const gemist = regels.filter((r) => r.taak.frequentie === 'dagelijks').reduce((s, r) => s + r.gemisteDagen.length, 0)
  const weekAchter = regels.filter((r) => r.taak.frequentie === 'per_week').length
  const verstreken = w.dagen.filter((d) => d < w.vandaag).length
  const afgemeld = rondes.filter((r) => r.datum < w.vandaag).length

  return (
    <div className="club-taken-pagina">
      {kop}
      <OverzichtTegels gemist={gemist} weekAchter={weekAchter} afgemeld={afgemeld} verstreken={verstreken} notities={notities.length} />
      <section aria-labelledby="club-taken-achter-kop">
        <div className="club-sectiekop">
          <h2 id="club-taken-achter-kop">Niet gedaan deze week</h2>
          <span>Vandaag telt nog niet mee</span>
        </div>
        <Achterstand lijsten={actief.lijsten} regels={regels} />
      </section>
      <section aria-labelledby="club-taken-historie-kop">
        <div className="club-sectiekop">
          <h2 id="club-taken-historie-kop">Laatste {AANTAL_WEKEN} weken</h2>
          <span>Week {isoWeek(maandagen[0]).week} tot en met {isoWeek(maandagen[AANTAL_WEKEN - 1]).week}</span>
        </div>
        <Historie lijsten={actief.lijsten} rijen={historie(actief.taken, afvinkingen, maandagen)} weekNummers={maandagen.map((m) => isoWeek(m).week)} />
      </section>
    </div>
  )
}
