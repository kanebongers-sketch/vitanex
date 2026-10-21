import type { ReactNode } from 'react'
import { eisBeheerdersBeheer } from '@/lib/club/toegang'
import '@/components/club/huisstijl/huisstijl.css'
import '@/components/club/instellingen/instellingen.css'
import '@/components/club/rooster/rooster.css'
import '@/components/club/start/start.css'

// De startwizard is voor wie de sportschool inricht: Kane en de eigenaar.
// Een clubmanager of medewerker krijgt een gewone 404.

export default async function StartLayout({ children }: { children: ReactNode }) {
  await eisBeheerdersBeheer()
  return children
}
