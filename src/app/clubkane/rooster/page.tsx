import type { Metadata } from 'next'
import Link from 'next/link'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/gedeeld/vestiging'
import { haalLesDetail, haalLessen, haalRegels, haalStamdata, type LesDetail } from '@/lib/club/rooster/opslag'
import { ruimsteOpening } from '@/lib/club/rooster/openingstijden'
import { filterLessen, uurBereik, weekCijfers } from '@/lib/club/rooster/raster'
import { dagenVanWeek, isoWeek, maandagUitWeekParam, nlDelen, plusDagen, weekBereik, weekParam } from '@/lib/club/rooster/tijd'
import { leesRoosterStaat, roosterHref } from '@/lib/club/rooster/url'
import type { RoosterRegels } from '@/lib/club/rooster/regels'
import { RoosterFilters } from '@/components/club/rooster/RoosterFilters'
import { RoosterKop, RoosterTegels } from '@/components/club/rooster/RoosterKop'
import { DagLijst, WeekRaster } from '@/components/club/rooster/WeekRaster'
import { LesPaneel } from '@/components/club/rooster/LesPaneel'
import '@/components/club/rooster/rooster.css'

export const metadata: Metadata = { title: 'Rooster' }

const DAG_MAAND = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const WANNEER = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })
const KLOK = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

function weekLabel(maandag: string): string {
  const zondag = plusDagen(maandag, 6)
  return `${DAG_MAAND.format(new Date(`${maandag}T12:00:00Z`))} tot ${DAG_MAAND.format(new Date(`${zondag}T12:00:00Z`))} ${zondag.slice(0, 4)}`
}

function wanneer(detail: LesDetail): string {
  const start = new Date(detail.les.startOp)
  const dag = WANNEER.format(start)
  return `${dag.charAt(0).toUpperCase()}${dag.slice(1)} · ${KLOK.format(start)} tot ${KLOK.format(new Date(detail.les.eindOp))}`
}

function magAfvinken(detail: LesDetail, regels: RoosterRegels, nuMs: number): boolean {
  return !detail.les.geannuleerd && nuMs >= Date.parse(detail.les.startOp) - regels.checkinVensterMin * 60_000
}

export default async function RoosterPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const params = await searchParams
  const vestiging = kiesVestiging(params.v)
  const staat = leesRoosterStaat(params, vestiging)
  const nu = new Date()
  const nuNl = nlDelen(nu)
  const maandag = maandagUitWeekParam(staat.week, nuNl.datum)
  const { van, tot } = weekBereik(maandag)
  const dagen = dagenVanWeek(maandag)

  const stam = await haalStamdata(t.admin, t.userId, vestiging)
  const [lessen, instellingen, detail] = await Promise.all([
    stam ? haalLessen(t.admin, t.userId, vestiging, van, tot, stam) : Promise.resolve(null),
    haalRegels(t.admin, t.userId, vestiging),
    staat.les ? haalLesDetail(t.admin, t.userId, staat.les) : Promise.resolve(null),
  ])

  const optie = (x: { id: string; naam: string }) => ({ id: x.id, naam: x.naam })
  const zalen = (stam?.zalen ?? []).filter((z) => z.actief).map(optie)
  const lestypen = (stam?.lestypen ?? []).filter((l) => l.actief).map(optie)
  const instructeurs = (stam?.medewerkers ?? []).filter((m) => m.actief && m.rollen.includes('instructeur') && m.vestigingen.includes(vestiging)).map(optie)
  const gefilterd = filterLessen(lessen ?? [], staat)

  return (
    <>
      <RoosterKop
        vestigingNaam={VESTIGING_LABEL[vestiging]}
        weekNummer={isoWeek(maandag).week}
        weekLabel={weekLabel(maandag)}
        vorige={weekParam(plusDagen(maandag, -7))}
        volgende={weekParam(plusDagen(maandag, 7))}
        isDezeWeek={dagen.includes(nuNl.datum)}
        staat={staat}
      />
      {lessen === null ? (
        <p className="club-melding club-melding--fout" role="alert">Het rooster kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>
      ) : (
        <>
          <RoosterTegels cijfers={weekCijfers(gefilterd)} />
          <RoosterFilters staat={staat} zalen={zalen} lestypen={lestypen} instructeurs={instructeurs} />
          {lessen.length === 0 ? (
            <div className="club-leeg club-rooster-leeg">
              <p>Er staan nog geen lessen in deze week.</p>
              <Link className="club-knop club-knop--primair" href={clubPad('/instellingen', vestiging, { tab: 'weekrooster' })}>
                Naar het weekrooster
              </Link>
            </div>
          ) : (
            <>
              <WeekRaster
                dagen={dagen}
                lessen={gefilterd}
                bereik={uurBereik(gefilterd, ruimsteOpening(instellingen.openingstijden))}
                vandaag={nuNl.datum}
                nuMinuten={nuNl.minuten}
                nuMs={nu.getTime()}
                staat={staat}
              />
              <DagLijst dagen={dagen} lessen={gefilterd} vandaag={nuNl.datum} nuMs={nu.getTime()} staat={staat} />
            </>
          )}
        </>
      )}
      {detail && (
        <LesPaneel
          key={detail.les.id}
          detail={detail}
          sluitHref={roosterHref(staat, { les: null })}
          vestiging={vestiging}
          wanneer={wanneer(detail)}
          isBegonnen={Date.parse(detail.les.startOp) <= nu.getTime()}
          kanAfvinken={magAfvinken(detail, instellingen.regels, nu.getTime())}
          zalen={zalen}
          instructeurs={instructeurs}
        />
      )}
    </>
  )
}
