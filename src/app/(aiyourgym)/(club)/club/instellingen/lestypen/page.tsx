import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel, instellingenMetadata } from '@/components/club/instellingen/InstellingenOnderdeel'

export async function generateMetadata(): Promise<Metadata> {
  return instellingenMetadata('lestypen')
}

export default async function LestypenPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="lestypen" zoek={await searchParams} />
}
