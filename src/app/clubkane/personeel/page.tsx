import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { maandagUitWeekParam, nlDelen } from '@/lib/club/rooster/tijd'
import { haalTeam } from '@/lib/club/personeel/opslag'
import { leesStaat } from '@/lib/club/personeel/url'
import { PersoneelKop } from '@/components/club/personeel/PersoneelKop'
import { WeekTab } from '@/components/club/personeel/WeekTab'
import { TeamTab } from '@/components/club/personeel/TeamTab'
import { MijnTab } from '@/components/club/personeel/MijnTab'
import { UrenTab } from '@/components/club/personeel/UrenTab'
import '@/components/club/personeel/personeel.css'

// /clubkane/personeel: het rooster van het fitnesspersoneel (balie, vloer,
// opening en afsluiten), beschikbaarheid, "mijn diensten" en de uren voor de
// administratie. Alles staat in de URL (?tab, ?week, ?dienst, ...).

export const metadata: Metadata = { title: 'Personeel' }

export default async function PersoneelPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const params = await searchParams
  const vestiging = kiesVestiging(params.v)
  const staat = leesStaat(params, vestiging)
  const nu = nlDelen(new Date())
  const maandag = maandagUitWeekParam(staat.week, nu.datum)
  const team = await haalTeam(t.admin, t.userId, vestiging)

  return (
    <div className="club-personeel-pagina">
      <PersoneelKop staat={staat} vestigingNaam={VESTIGING_LABEL[vestiging]} maandag={maandag} vandaag={nu.datum} />
      {team === null ? (
        <p className="club-melding club-melding--fout" role="alert">
          Het personeel kon niet worden geladen. Staat migratie 388 er al op? Ververs de pagina om het opnieuw te proberen.
        </p>
      ) : staat.tab === 'team' ? (
        <TeamTab t={t} staat={staat} vestiging={vestiging} team={team} vandaag={nu.datum} />
      ) : staat.tab === 'mijn' ? (
        <MijnTab t={t} staat={staat} team={team} vandaag={nu.datum} />
      ) : staat.tab === 'uren' ? (
        <UrenTab t={t} staat={staat} vestiging={vestiging} team={team} nu={nu} />
      ) : (
        <WeekTab t={t} staat={staat} vestiging={vestiging} team={team} maandag={maandag} nu={nu} />
      )}
    </div>
  )
}
