import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
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
  const t = await eisModule('personeel')
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const gelezen = leesStaat(params, vestiging)
  // Een ingelogde medewerker komt standaard bij zijn eigen diensten uit (besluit Kane 20-10-2026: de trainer op de vloer eerst).
  const staat = t.rol === 'medewerker' && !params.tab ? { ...gelezen, tab: 'mijn' as const } : gelezen
  const nu = nlDelen(new Date())
  const maandag = maandagUitWeekParam(staat.week, nu.datum)
  const team = await haalTeam(t.admin, t.userId, vestiging)

  return (
    <div className="club-personeel-pagina">
      <PersoneelKop staat={staat} vestigingNaam={naamVan(t.vestigingen, vestiging)} maandag={maandag} vandaag={nu.datum} />
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
