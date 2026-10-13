import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { bouwTeamOverzicht } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import { moetOpvolgen } from '@/lib/lifeos/leads/leads'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { TeamOverzichtWeergave } from '@/components/lifeos/pt-team/TeamOverzichtWeergave'
import { TEAM_FOUT } from './teksten'
import { haalWachtendePins, zietGeld, type LinkRol } from '@/lib/lifeos/leads/links'
import { WachtendePincodes } from '@/components/lifeos/pt-beheer/WachtendePincodes'
import { StopRedenen } from '@/components/lifeos/pt-team/StopRedenen'
import { stopOverzicht } from '@/lib/lifeos/pt-dashboard/stopredenen'
import { clubsLabel } from '@/lib/lifeos/pt-dashboard/clubs'
import { haalGroeiplan } from '@/lib/lifeos/pt-dashboard/groeiplan-opslag'
import { GroeiplanKaart } from '@/components/lifeos/pt-groei/GroeiplanKaart'

const ROL_KOP: Record<LinkRol, string> = { pt: 'PT', eigenaar: 'eigenaar', beheerder: 'beheerder', clubmanager: 'clubmanager' }

// /<eigenaar> — het hele PT-team in één beeld: dezelfde cijfers die Kane in
// LifeOS ziet (totalen, per PT'er, per club, team-trend). Alleen lezen.

export async function EigenaarTeam({ code }: { code: string }) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const { team, leads, klanten } = g.team
  const data = bouwTeamOverzicht(
    team.map((p) => ({ ...p, code: null, pinStatus: null })),
    leads,
    klanten,
    g.vandaag,
    g.doelen,
  )
  // Kane: wachtende pincodes bovenaan, zodat hij meteen kan goedkeuren.
  const [pins, groeiplan] = await Promise.all([
    g.link.rol === 'beheerder' ? haalWachtendePins(g.admin, g.link.userId) : Promise.resolve(null),
    haalGroeiplan(g.admin, g.link.userId),
  ])
  const club = g.link.rol === 'clubmanager' && g.link.clubs.length > 0 ? clubsLabel(g.link.clubs) : null
  const teLaat = [...leads.values()].flat().filter((l) => moetOpvolgen(l, g.vandaag) && l.opvolgdatum !== g.vandaag).length

  return (
    <>
      <FfHero boventitel={`Fit Factory PT · ${ROL_KOP[g.link.rol]}${club ? ` ${club}` : ''}`} titel={`Hoi ${g.link.naam}`}>
        <p className="ff-hero-sub">
          {club
            ? `De PT in ${club}, live: leads, opvolging, klanten en prestaties per PT'er. Je kijkt mee; invullen doen de PT'ers zelf.`
            : `Alles wat het PT-team bijhoudt, live: leads, opvolging, klanten en abonnementen.${g.link.rol === 'beheerder' ? ' Klanten en doelen pas je hier ook aan.' : " Je kijkt mee; invullen doen de PT'ers zelf."}`}
        </p>
      </FfHero>
      {pins && pins.length > 0 ? <WachtendePincodes pins={pins} /> : null}
      {groeiplan ? <GroeiplanKaart code={code} focus={groeiplan.plan.focus} /> : null}
      <TeamOverzichtWeergave data={data} ptHref={`/${code}/team`} toonGeld={zietGeld(g.link.rol)}>
        <div className="ptd-acties">
          <Link className="ptd-knop ptd-knop--klein" href={`/${code}/lead`}>
            Alle leads <ChevronRight size={14} aria-hidden />
          </Link>
          {teLaat > 0 ? (
            <Link className="ptd-knop ptd-knop--klein" href={`/${code}/lead?toon=te_laat`}>
              {teLaat} opvolging te laat <ChevronRight size={14} aria-hidden />
            </Link>
          ) : null}
        </div>
        <p className="ptd-hint">Een 0 betekent: niets ingevuld in de app — niet per se niets gedaan.</p>
      </TeamOverzichtWeergave>
      <StopRedenen o={stopOverzicht(team, klanten)} />
    </>
  )
}
