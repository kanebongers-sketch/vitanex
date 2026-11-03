import type { ReactNode } from 'react'
import { eisOnderdeel } from '@/lib/club/toegang'

// Het Prikbord hoort bij Team en vloer (kern/pakketten.ts). Zonder dat pakket,
// of zonder recht, een gewone 404; Notities blijft dan op /club/notities.
export default async function Layout({ children }: { children: ReactNode }) {
  await eisOnderdeel('prikbord')
  return children
}
