import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel, instellingenMetadata } from '@/components/club/instellingen/InstellingenOnderdeel'

export async function generateMetadata(): Promise<Metadata> {
  return instellingenMetadata('weekrooster')
}

export default async function WeekroosterPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="weekrooster" zoek={await searchParams} />
}
