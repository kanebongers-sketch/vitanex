import { redirect } from 'next/navigation'
import { kiesVestiging, type ZoekParams } from '@/lib/club/kern/vestiging'
import { takenHref } from '@/lib/club/taken/url'

// Oud adres: de dagweergave staat nu op /clubkane/taken (tab Dag).
export default async function OudVandaag({ searchParams }: { searchParams: ZoekParams }) {
  redirect(takenHref('', kiesVestiging((await searchParams).v)))
}
