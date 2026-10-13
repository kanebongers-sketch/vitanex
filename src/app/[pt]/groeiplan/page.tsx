import type { Metadata } from 'next'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { magGroeiplanAanpassen } from '@/lib/lifeos/leads/links'
import { haalGroeiplan } from '@/lib/lifeos/pt-dashboard/groeiplan-opslag'
import { haalPtTeamGegevens } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { voorClub } from '@/lib/lifeos/pt-dashboard/club-filter'
import { CLUBS, clubsLabel } from '@/lib/lifeos/pt-dashboard/clubs'
import { actiesVoor, clubStanden, groeiCijfers } from '@/lib/lifeos/pt-dashboard/groeiplan'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { ClubTabel, GroeiActies, GroeiFocus, GroeiTegels } from '@/components/lifeos/pt-groei/GroeiplanWeergave'
import { GroeiplanBewerken } from '@/components/lifeos/pt-groei/GroeiplanBewerken'

// /<code>/groeiplan — het plan voor meer PT-klanten, voor iedereen in de PT-app.
// PT'ers en clubmanagers zien hun acties; Kane en de eigenaren alles, en passen
// het aan. De cijfers zijn aantallen (geen namen, geen bedragen); een
// clubmanager ziet alleen zijn eigen club(s). De layout regelt het inloggen.

export const metadata: Metadata = { title: 'Groeiplan · Fit Factory PT' }

const datum = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })

export default async function GroeiplanPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  const { rol, userId } = s.link

  const [opgeslagen, alles] = await Promise.all([haalGroeiplan(s.admin, userId), haalPtTeamGegevens(s.admin, userId)])
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
      <ClubTabel standen={clubStanden(leads, klanten, plan, vandaag, clubmanager ? s.link.clubs : CLUBS)} />
    </>
  )
}
