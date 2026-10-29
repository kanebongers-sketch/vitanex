import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel, instellingenMetadata } from '@/components/club/instellingen/InstellingenOnderdeel'

export async function generateMetadata(): Promise<Metadata> {
  return instellingenMetadata('medewerkers')
}

export default async function MedewerkersPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="medewerkers" zoek={await searchParams} />
}
