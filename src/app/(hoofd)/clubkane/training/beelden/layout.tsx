import type { ReactNode } from 'react'
import { eisKane } from '@/lib/club/toegang'

// Prototype van eigen oefenbeelden: alleen Kane. Iedereen anders krijgt een gewone 404.
export default async function Layout({ children }: { children: ReactNode }) {
  await eisKane()
  return children
}
