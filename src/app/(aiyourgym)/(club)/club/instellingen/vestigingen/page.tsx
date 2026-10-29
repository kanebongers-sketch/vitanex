import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel, instellingenMetadata } from '@/components/club/instellingen/InstellingenOnderdeel'

export async function generateMetadata(): Promise<Metadata> {
  return instellingenMetadata('vestigingen')
}

export default async function VestigingenPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="vestigingen" zoek={await searchParams} />
}
