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
import { magUrenBeheren, opentBijEigenDiensten } from '@/lib/club/personeel/uren-rechten'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'
import '@/components/club/personeel/personeel.css'
import { isMedewerkerSessie } from '@/lib/club/rollen/wie'
import { WelkomVoorRol } from '@/components/club/welkom/WelkomVoorRol'

// /club/personeel: het rooster van het fitnesspersoneel (balie, vloer,
// opening en afsluiten), beschikbaarheid, "mijn diensten" en de uren voor de
// administratie. Alles staat in de URL (?tab, ?week, ?dienst, ...).

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(PERSONEEL)).pagina.titel }
}

export default async function PersoneelPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('personeel')
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const gelezen = leesStaat(params, vestiging)
  // Een ingelogde medewerker komt standaard bij zijn eigen diensten uit (besluit Kane 20-10-2026: de trainer op de vloer eerst).
  // Het tabblad Uren (goedkeuren en exporteren) is voor wie uren beheert; een trainer ziet daar Mijn diensten.
  const urenBeheer = magUrenBeheren(t)
  // Wie het rooster plant (de roosteraar) begint op het weekrooster.
  const naarMijn = isMedewerkerSessie(t) && ((!params.tab && opentBijEigenDiensten(t)) || (gelezen.tab === 'uren' && !urenBeheer))
  const staat = naarMijn ? { ...gelezen, tab: 'mijn' as const } : gelezen
  const nu = nlDelen(new Date())
  const maandag = maandagUitWeekParam(staat.week, nu.datum)
  const team = await haalTeam(t.admin, t.userId, vestiging)
  const tk = (await clubTekst(PERSONEEL)).pagina

  return (
    <div className="club-personeel-pagina">
      <PersoneelKop staat={staat} vestigingNaam={naamVan(t.vestigingen, vestiging)} maandag={maandag} vandaag={nu.datum} metUren={urenBeheer} />
      <WelkomVoorRol t={t} vestiging={vestiging} pagina={staat.tab === 'uren' ? 'uren' : 'personeel'} />
      {team === null ? (
        <p className="club-melding club-melding--fout" role="alert">
          {tk.laadFout}
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
