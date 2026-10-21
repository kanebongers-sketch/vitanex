import type { ReactNode } from 'react'
import { eisModule, eisOnderdeel } from '@/lib/club/toegang'

// Een clubmanager zonder recht op dit onderdeel krijgt een gewone 404 (zie src/lib/club/beheerders/rechten.ts).
export default async function Layout({ children }: { children: ReactNode }) {
  // De community hoort bij de ledenapp: staat die uit, dan bestaat dit onderdeel niet.
  await eisModule('app')
  await eisOnderdeel('community')
  return children
}
