import type { ReactNode } from 'react'
import { eisPlatformEigenaar } from '@/lib/club/toegang'

// Het platformoverzicht van AI Your Gym (alle sportscholen, aanmeldingen) is
// alleen voor Kane. Eigenaren, clubmanagers en medewerkers krijgen een 404.
export default async function Layout({ children }: { children: ReactNode }) {
  await eisPlatformEigenaar()
  return children
}
