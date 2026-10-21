import { redirect } from 'next/navigation'
import { eisClubToegang } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { takenHref } from '@/lib/club/taken/url'

// Oud adres: de dagweergave staat nu op /club/taken (tab Dag).
export default async function OudVandaag({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  redirect(vestiging ? takenHref('', vestiging) : '/club/taken')
}
