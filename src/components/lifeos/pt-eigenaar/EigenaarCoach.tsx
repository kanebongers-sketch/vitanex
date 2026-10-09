import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { weekLabel, huidigeWeek } from '@/lib/lifeos/pt-dashboard/checkin'
import { haalCoachTeam } from '@/lib/lifeos/pt-coaching/coach-team'
import { RONDE_DAGEN, sorteerCoachRijen, telCoach } from '@/lib/lifeos/pt-coaching/coach-overzicht'
import { Tegel } from '@/components/lifeos/pt-dashboard/Tegel'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { CoachPtKaart } from './CoachPtKaart'
import { TEAM_FOUT } from './teksten'
import { CoachgesprekkenBeheer } from '@/components/lifeos/pt-beheer/CoachgesprekkenBeheer'

// /<eigenaar>/coach — de coachgesprekken met het hele team in één oogopslag:
// wie Kane de afgelopen twee weken sprak, bij wie de volgende afspraak staat,
// wie zijn check-in invulde en waar nog een verslag open staat. Per PT'er de
// check-in, open punten, de lead tracker (eerst op te pakken) en alle verslagen.
// Alleen lezen; de beheerder heeft daarboven zijn eigen gesprekken-kaart.

const AGENDA_HINT: Record<'niet_gekoppeld' | 'fout', string> = {
  niet_gekoppeld: "Kane's agenda is niet gekoppeld: de volgende afspraken zijn hier niet zichtbaar.",
  fout: 'De agenda kon nu niet gelezen worden: de volgende afspraken ontbreken even.',
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
  const t = telCoach(rijen, nu)

  return (
    <>
      {beheerder ? <CoachgesprekkenBeheer /> : null}
      <section className="ptd-sectie" aria-labelledby="eig-coach-kop">
        <div className="ptd-sectiekop">
          <h2 id="eig-coach-kop">Coachgesprekken met het team</h2>
          <span>{weekLabel(huidigeWeek(nu))}</span>
        </div>
        <div className="ptd-tegels">
          <Tegel getal={`${t.gehad}/${t.totaal}`} label="Gesprek gehad" uitleg={`afgelopen ${RONDE_DAGEN} dagen`} accent />
          <Tegel getal={`${t.ingepland}/${t.totaal}`} label="Volgende afspraak staat" uitleg={ct.agenda === 'ok' ? 'in de agenda' : 'agenda niet leesbaar'} />
          <Tegel getal={`${t.checkins}/${t.totaal}`} label="Check-in deze week" uitleg="ingevuld door de PT'er" />
          <Tegel getal={String(t.teVerslaan)} label="Verslag nog invullen" uitleg={t.teVerslaan === 0 ? 'alles verwerkt' : 'gesprek geweest, verslag open'} />
        </div>
        {ct.agenda !== 'ok' ? <p className="ptd-hint">{AGENDA_HINT[ct.agenda]}</p> : null}
        <p className="ptd-hint">
          Wat af moet staat bovenaan: eerst een open verslag, dan wie nog geen volgende afspraak heeft, daarna iedereen op datum van de
          volgende afspraak.
        </p>
        {rijen.length === 0 ? (
          <p className="ptd-leeg">Nog geen PT&apos;ers in het team.</p>
        ) : (
          <ul className="ptd-lijst">
            {rijen.map((r) => <CoachPtKaart key={r.id} code={code} r={r} nu={nu} />)}
          </ul>
        )}
      </section>
    </>
  )
}
