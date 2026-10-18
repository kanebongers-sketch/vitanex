import type { ReactNode } from 'react'
import { eisClubToegang } from '@/lib/club/toegang'
import '@/components/club/hulp/hulp.css'

// Het helpcentrum: iedereen die in Club binnen is mag hulp zien en een vraag
// melden, ook een clubmanager zonder rechten op andere onderdelen.
// /clubkane/hulp/meldingen vraagt daarnaast zelf eisKane().
export default async function Layout({ children }: { children: ReactNode }) {
  await eisClubToegang()
  return children
}
