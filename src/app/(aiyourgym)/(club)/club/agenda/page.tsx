import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eisClubToegang } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { agendaFilter } from '@/lib/club/agenda/filter'
import { AgendaScherm, agendaZicht } from '@/components/club/agenda/AgendaScherm'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { AGENDA } from '@/lib/aiyourgym/taal/woorden/club/agenda'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(AGENDA)).titel }
}

// Rooster · Agenda: alles met een tijd behalve groepslessen en diensten. Een
// scherm met filters (Alles, Met leden, Team); het oude /club/afspraken komt
// hier uit op Met leden. Filter, week, dag en trainer staan in de URL.
export default async function AgendaPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const keuze = agendaFilter(zoek.filter, agendaZicht(t))
  if (keuze.actief === null) notFound()
  return <AgendaScherm t={t} vestiging={vestiging} zoek={zoek} basis="/agenda" keuze={{ ...keuze, actief: keuze.actief }} />
}
