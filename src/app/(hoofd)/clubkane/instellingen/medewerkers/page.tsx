import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel } from '@/components/club/instellingen/InstellingenOnderdeel'

export const metadata: Metadata = { title: 'Medewerkers' }

export default async function MedewerkersPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="medewerkers" zoek={await searchParams} />
}
