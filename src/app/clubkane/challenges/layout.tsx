import type { ReactNode } from 'react'
import { eisOnderdeel } from '@/lib/club/toegang'

// Een clubmanager zonder recht op dit onderdeel krijgt een gewone 404 (zie src/lib/club/beheerders/rechten.ts).
export default async function Layout({ children }: { children: ReactNode }) {
  await eisOnderdeel('challenges')
  return children
}
