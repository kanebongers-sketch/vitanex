import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { bouwTeamOverzicht } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import { moetOpvolgen } from '@/lib/lifeos/leads/leads'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { TeamOverzichtWeergave } from '@/components/lifeos/pt-team/TeamOverzichtWeergave'
import { TEAM_FOUT } from './teksten'

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
  const teLaat = [...leads.values()].flat().filter((l) => moetOpvolgen(l, g.vandaag) && l.opvolgdatum !== g.vandaag).length

  return (
    <>
      <FfHero boventitel="Fit Factory PT · eigenaar" titel={`Hoi ${g.link.naam}`}>
        <p className="ff-hero-sub">Alles wat het PT-team bijhoudt, live: leads, opvolging, klanten en abonnementen. Je kijkt mee; invullen doen de PT&apos;ers zelf.</p>
      </FfHero>
      <TeamOverzichtWeergave data={data} ptHref={`/${code}/team`}>
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
    </>
  )
}
