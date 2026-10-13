import type { Metadata } from 'next'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { magGroeiplanAanpassen, zietCoach, zietGroeiplan } from '@/lib/lifeos/leads/links'
import { notFound } from 'next/navigation'
import { haalGroeiplan } from '@/lib/lifeos/pt-dashboard/groeiplan-opslag'
import { haalPtTeamGegevens, type PtTeamGegevens } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { voorClub } from '@/lib/lifeos/pt-dashboard/club-filter'
import { CLUBS, clubsLabel } from '@/lib/lifeos/pt-dashboard/clubs'
import { actiesVoor, clubStanden, groeiCijfers } from '@/lib/lifeos/pt-dashboard/groeiplan'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalLopendeAfspraken } from '@/lib/lifeos/pt-dashboard/afspraken-opslag'
import { checkupStand, scoreAfspraak, type Afspraak } from '@/lib/lifeos/pt-dashboard/checkup'
import { CheckupTabel, ClubTabel, GroeiActies, GroeiFocus, GroeiTegels, type CheckupRij } from '@/components/lifeos/pt-groei/GroeiplanWeergave'
import { GroeiplanBewerken } from '@/components/lifeos/pt-groei/GroeiplanBewerken'

// /<code>/groeiplan — het plan voor meer PT-klanten, voor iedereen in de PT-app.
// PT'ers en clubmanagers zien hun acties; Kane en de eigenaren alles, en passen
// het aan. De cijfers zijn aantallen (geen namen, geen bedragen); een
// clubmanager ziet alleen zijn eigen club(s). PT'ers voorlopig niet (404, zie
// zietGroeiplan). De layout regelt het inloggen.

export const metadata: Metadata = { title: 'Groeiplan · Fit Factory PT' }

const datum = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })

export default async function GroeiplanPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  const { rol, userId } = s.link
  if (!zietGroeiplan(rol)) notFound()

  const coach = zietCoach(rol)
  const [opgeslagen, alles] = await Promise.all([haalGroeiplan(s.admin, userId), haalPtTeamGegevens(s.admin, userId)])
  const afspraken = coach && alles ? await haalLopendeAfspraken(s.admin, userId, alles.team.map((p) => p.id)) : null
  if (!opgeslagen || !alles) return <Foutmelding bericht="Het groeiplan kon niet geladen worden. Vernieuw de pagina." />

  const clubmanager = rol === 'clubmanager'
  const g = clubmanager ? voorClub(alles, s.link.clubs) : alles
  const vandaag = dagSleutelNl(new Date())
  const leads = [...g.leads.values()].flat()
  const klanten = [...g.klanten.values()].flat()
  const { plan } = opgeslagen
  const magAanpassen = magGroeiplanAanpassen(rol)
  const bijgewerkt = opgeslagen.bijgewerktOp
    ? `Bijgewerkt op ${datum.format(new Date(opgeslagen.bijgewerktOp))}${opgeslagen.bijgewerktDoor ? ` door ${opgeslagen.bijgewerktDoor}` : ''}.`
    : null
  const club = clubmanager && s.link.clubs.length > 0 ? clubsLabel(s.link.clubs) : null

  return (
    <>
      <FfHero boventitel={`Fit Factory PT · groeiplan${club ? ` ${club}` : ''}`} titel="Meer PT-klanten">
        <p className="ff-hero-sub">
          {magAanpassen
            ? 'Het plan voor het hele team. Wat je hier aanpast, zien de PT\'ers en clubmanagers meteen.'
            : 'Het plan van Fit Factory PT: waar we op focussen, wat jij kunt doen en hoe we ervoor staan.'}
        </p>
      </FfHero>
      <GroeiFocus focus={plan.focus} bijgewerkt={bijgewerkt} />
      {magAanpassen ? <GroeiplanBewerken code={s.link.code} plan={plan} /> : null}
      <GroeiActies acties={actiesVoor(plan, rol === 'pt' || clubmanager ? rol : 'alles')} toonVoor={magAanpassen} />
      {rol === 'pt' ? (
        <GroeiTegels titel="Jouw cijfers" c={groeiCijfers(g.leads.get(s.link.persoonId) ?? [], g.klanten.get(s.link.persoonId) ?? [], vandaag)} />
      ) : null}
      <GroeiTegels titel={club ? `${club}` : 'Het team'} c={groeiCijfers(leads, klanten, vandaag)} />
      {coach && afspraken ? <CheckupTabel rijen={checkupRijen(g, afspraken, vandaag)} ptHref={`/${s.link.code}/team`} /> : null}
      <ClubTabel standen={clubStanden(leads, klanten, plan, vandaag, clubmanager ? s.link.clubs : CLUBS)} />
    </>
  )
}

/** Per trainer: de lopende afspraak gemeten, plus wat nu aandacht vraagt. Wie nog geen afspraak heeft, staat bovenaan. */
function checkupRijen(g: PtTeamGegevens, afspraken: Map<string, Afspraak>, vandaag: string): CheckupRij[] {
  return g.team
    .map((p) => {
      const vorige = afspraken.get(p.id) ?? null
      const stand = checkupStand(g.leads.get(p.id) ?? [], g.klanten.get(p.id) ?? [], vorige, vandaag)
      const scores = vorige ? scoreAfspraak(vorige, stand) : []
      return {
        id: p.id,
        naam: p.naam,
        afspraakOp: vorige?.gemaaktOp ?? null,
        gehaald: scores.filter((x) => x.gehaald).length,
        afspraken: scores.length,
        teLaat: stand.leads.teLaat.length,
        referralNogNiet: stand.referrals.nogNiet.length,
      }
    })
    .sort((a, b) => (a.afspraakOp ?? '').localeCompare(b.afspraakOp ?? '') || a.naam.localeCompare(b.naam, 'nl'))
}
