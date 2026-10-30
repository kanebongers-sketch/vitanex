import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
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
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { WelkomVoorRol } from '@/components/club/welkom/WelkomVoorRol'
import { kanBewerken } from '@/lib/club/rollen/wie'
import '@/components/club/rooster/rooster.css'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(ROOSTER)).titel }
}

function weekLabel(maandag: string, taal: Taal): string {
  const zondag = plusDagen(maandag, 6)
  const dag = (d: string) => formatDatum(`${d}T12:00:00Z`, taal, 'dagMaandLang')
  return ROOSTER[taal].weekBereik(dag(maandag), dag(zondag), zondag.slice(0, 4))
}

function wanneer(detail: LesDetail, taal: Taal): string {
  const start = new Date(detail.les.startOp)
  const dag = formatDatum(start, taal, 'dag')
  return ROOSTER[taal].paneel.wanneer(`${dag.charAt(0).toUpperCase()}${dag.slice(1)}`, formatTijd(start, taal), formatTijd(detail.les.eindOp, taal))
}

function magAfvinken(detail: LesDetail, regels: RoosterRegels, nuMs: number): boolean {
  return !detail.les.geannuleerd && nuMs >= Date.parse(detail.les.startOp) - regels.checkinVensterMin * 60_000
}

export default async function RoosterPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('rooster')
  const taal = await getTaal()
  const tekst = ROOSTER[taal]
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const staat = leesRoosterStaat(params, vestiging)
  const nu = new Date()
  const nuNl = nlDelen(nu)
  const maandag = maandagUitWeekParam(staat.week, nuNl.datum)
  const { van, tot } = weekBereik(maandag)
  const dagen = dagenVanWeek(maandag)

  // Regels en lesdetail hangen niet van de stamdata af: samen met de stamdata ophalen.
  const [stam, instellingen, detail] = await Promise.all([
    haalStamdata(t.admin, t.userId, vestiging),
    haalRegels(t.admin, t.userId, vestiging),
    staat.les ? haalLesDetail(t.admin, t.userId, staat.les) : Promise.resolve(null),
  ])
  const lessen = stam ? await haalLessen(t.admin, t.userId, vestiging, van, tot, stam) : null

  const optie = (x: { id: string; naam: string }) => ({ id: x.id, naam: x.naam })
  const zalen = (stam?.zalen ?? []).filter((z) => z.actief).map(optie)
  const lestypen = (stam?.lestypen ?? []).filter((l) => l.actief).map(optie)
  const instructeurs = (stam?.medewerkers ?? []).filter((m) => m.actief && m.rollen.includes('instructeur') && m.vestigingen.includes(vestiging)).map(optie)
  const gefilterd = filterLessen(lessen ?? [], staat)
  // Geeft deze persoon zelf les? Dan staat er een snelknop Mijn lessen bij de filters.
  const ikId = t.profiel?.id ?? t.persoonId
  const mijnId = ikId && instructeurs.some((i) => i.id === ikId) ? ikId : null
  // Het weekrooster staat in Instellingen; een instructeur komt daar niet, dus dan geen knop ernaartoe.
  const magInstellen = magOnderdeel(t.onderdelen, 'instellingen') && kanBewerken(t, 'instellingen')

  return (
    <>
      <RoosterKop
        vestigingNaam={naamVan(t.vestigingen, vestiging)}
        weekNummer={isoWeek(maandag).week}
        weekLabel={weekLabel(maandag, taal)}
        vorige={weekParam(plusDagen(maandag, -7))}
        volgende={weekParam(plusDagen(maandag, 7))}
        isDezeWeek={dagen.includes(nuNl.datum)}
        staat={staat}
      />
      <WelkomVoorRol t={t} vestiging={vestiging} pagina="rooster" />
      {lessen === null ? (
        <p className="club-melding club-melding--fout" role="alert">{tekst.laadFout}</p>
      ) : (
        <>
          <RoosterTegels cijfers={weekCijfers(gefilterd)} />
          <RoosterFilters staat={staat} zalen={zalen} lestypen={lestypen} instructeurs={instructeurs} mijnId={mijnId} />
          {lessen.length === 0 ? (
            <div className="club-leeg club-rooster-leeg">
              <CalendarPlus aria-hidden size={28} />
              <p>
                <strong>{tekst.leegTitel}</strong>
                {magInstellen ? tekst.leegUitleg : tekst.leegZonderInstellen}
              </p>
              {magInstellen && (
                <Link className="club-knop club-knop--primair" href={clubPad('/instellingen/weekrooster', vestiging)}>
                  {tekst.naarWeekrooster}
                </Link>
              )}
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
                taal={taal}
              />
              <DagLijst dagen={dagen} lessen={gefilterd} vandaag={nuNl.datum} nuMs={nu.getTime()} staat={staat} taal={taal} />
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
          wanneer={wanneer(detail, taal)}
          isBegonnen={Date.parse(detail.les.startOp) <= nu.getTime()}
          kanAfvinken={magAfvinken(detail, instellingen.regels, nu.getTime())}
          zalen={zalen}
          instructeurs={instructeurs}
          magLeden={moduleAan(t.organisatie, 'leden') && magOnderdeel(t.onderdelen, 'leden')}
        />
      )}
    </>
  )
}
