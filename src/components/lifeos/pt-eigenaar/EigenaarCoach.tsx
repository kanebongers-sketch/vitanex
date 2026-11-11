import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { haalCoachTeam } from '@/lib/lifeos/pt-coaching/coach-team'
import { coachFase, moetDoorplannen, nietDezeWeek, sorteerCoachRijen, telCoach, weekVan, type CoachRij } from '@/lib/lifeos/pt-coaching/coach-overzicht'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { CoachgesprekkenBeheer } from '@/components/lifeos/pt-beheer/CoachgesprekkenBeheer'
import { CoachRijBeheer } from '@/components/lifeos/pt-beheer/CoachRijBeheer'
import { CoachPtKaart, CoachRijInhoud, CoachRijKop, coachRijSamenvatting } from './CoachPtKaart'
import { TEAM_FOUT } from './teksten'

// /<eigenaar>/coach: de coachgesprekken met het team als een rustige lijst.
// Per PT'er naam, laatste gesprek en stand; wat af moet staat bovenaan. Details
// (open punten, leads, verslagen) achter een uitklap. De beheerder krijgt er
// zijn acties bij (inplannen, verslag, pincodes); eigenaren lezen alleen.

const AGENDA_HINT: Record<'niet_gekoppeld' | 'fout', string> = {
  niet_gekoppeld: "Kane's agenda is niet gekoppeld: volgende afspraken ontbreken.",
  fout: 'De agenda kon nu niet gelezen worden: volgende afspraken ontbreken even.',
}

/** "ma 10 t/m zo 16 nov" uit maandag en zondag (YYYY-MM-DD). */
function weekLabel(maandag: string, zondag: string): string {
  const fmt = (dag: string, opties: Intl.DateTimeFormatOptions) => {
    const [j, m, d] = dag.split('-').map(Number)
    return new Intl.DateTimeFormat('nl-NL', { ...opties, timeZone: 'UTC' }).format(new Date(Date.UTC(j, m - 1, d))).replace(/\./g, '')
  }
  return `${fmt(maandag, { weekday: 'short', day: 'numeric' })} t/m ${fmt(zondag, { weekday: 'short', day: 'numeric', month: 'short' })}`
}

function standRegel(rijen: readonly CoachRij[], nu: Date): string {
  const t = telCoach(rijen, nu)
  const inplannen = rijen.filter((r) => coachFase(r, nu) === 'inplannen').length
  const delen = [
    t.teVerslaan > 0 ? `${t.teVerslaan} verslag open` : null,
    inplannen > 0 ? `${inplannen} nog geen gesprek ingepland` : null,
  ].filter((d): d is string => d !== null)
  return delen.join(' · ')
}

/** Kop van de week: "Deze week 2 van 15 gesprekken", met de dagen erbij. */
function WeekStand({ rijen, nu }: { rijen: readonly CoachRij[]; nu: Date }) {
  const t = telCoach(rijen, nu)
  const w = weekVan(nu)
  const rest = standRegel(rijen, nu)
  return (
    <div className="ptd-coachweek">
      <p className="ptd-coachweek-getal">
        <strong>{t.dezeWeek}</strong> van {t.totaal} gesprekken deze week
      </p>
      <p className="ptd-coachweek-sub">{weekLabel(w.maandag, w.zondag)}{rest ? ` · ${rest}` : ''}</p>
    </div>
  )
}

const ptErs = (n: number) => (n === 1 ? '1 PT’er' : `${n} PT’ers`)

/**
 * Meldingen van de week: wie deze week geen gesprek heeft (niet geweest en niet gepland),
 * en wie deze week een gesprek had maar volgende week nog niet in de agenda staat. Dit moet meteen.
 */
function WeekMeldingen({ rijen, nu }: { rijen: readonly CoachRij[]; nu: Date }) {
  const niet = nietDezeWeek(rijen, nu)
  const door = moetDoorplannen(rijen, nu)
  if (niet.length === 0 && door.length === 0) return null
  return (
    <div className="ptd-coachmelding" role="alert">
      {niet.length > 0 ? (
        <>
          <p className="ptd-coachmelding-kop">Deze week niet ingepland: {ptErs(niet.length)}</p>
          <p className="ptd-coachmelding-tekst">{niet.map((r) => r.naam).join(', ')}</p>
        </>
      ) : null}
      {door.length > 0 ? (
        <>
          <p className="ptd-coachmelding-kop">Volgende week nog inplannen: {ptErs(door.length)}</p>
          <p className="ptd-coachmelding-tekst">Gesprek deze week gehad, vervolg staat nog niet in de agenda: {door.map((r) => r.naam).join(', ')}</p>
        </>
      ) : null}
    </div>
  )
}

export async function EigenaarCoach({ code, beheerder = false }: { code: string; beheerder?: boolean }) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const nu = new Date()
  // Alleen PT'ers: de beheerder traint wel klanten, maar heeft geen coachgesprek.
  const pts = g.team.team.filter((p) => p.id !== g.team?.beheerderId)
  const ct = await haalCoachTeam(g.admin, g.link.userId, pts, g.team.leads, g.team.klanten, nu)
  const rijen = sorteerCoachRijen(ct.rijen, nu)

  const lijst =
    rijen.length === 0 ? (
      <p className="ptd-leeg">Nog geen PT&apos;ers in het team.</p>
    ) : (
      <ul className="ptd-coachlijst">
        {rijen.map((r) =>
          beheerder ? (
            <CoachRijBeheer
              key={r.id}
              ptId={r.id}
              fase={coachFase(r, nu)}
              kop={<CoachRijKop code={code} r={r} nu={nu} />}
              samenvatting={coachRijSamenvatting(r)}
              inhoud={<CoachRijInhoud code={code} r={r} />}
            />
          ) : (
            <CoachPtKaart key={r.id} code={code} r={r} nu={nu} />
          ),
        )}
      </ul>
    )

  return (
    <section className="ptd-sectie" aria-labelledby="eig-coach-kop">
      <div className="ptd-sectiekop">
        <h2 id="eig-coach-kop">Coachgesprekken</h2>
      </div>
      {rijen.length > 0 ? <WeekStand rijen={rijen} nu={nu} /> : null}
      {ct.agenda !== 'ok' ? <p className="ptd-hint">{AGENDA_HINT[ct.agenda]}</p> : <WeekMeldingen rijen={rijen} nu={nu} />}
      {beheerder ? <CoachgesprekkenBeheer>{lijst}</CoachgesprekkenBeheer> : lijst}
    </section>
  )
}
