import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { LifeosNav } from '@/components/lifeos/os/LifeosNav'
import { SnelTaakKnop } from '@/components/lifeos/taken/SnelTaakKnop'
import { PT_FAVICON } from '@/lib/fit-factory/domein'
import { COLORS } from '@/components/marketing/theme'

// fitfactorypt.nl/lifeoskane — Kane's LifeOS, losgeknipt van MentaForce. Eén
// schil voor alle LifeOS-pagina's: het eigen menu, de toegangscontrole (alleen
// Kane; de echte gate zit server-side op elke /api/lifeos-route) en de snelle
// taak-knop. Nooit in zoekmachines (ook de X-Robots-Tag van het domein).

export const metadata: Metadata = {
  title: { default: 'LifeOS', template: '%s · LifeOS' },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  icons: { icon: PT_FAVICON },
}

export const viewport: Viewport = { themeColor: COLORS.navyDeep }

export default function LifeosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lifeos-root lk-app">
      <LifeosNav />
      <FounderPoort>{children}</FounderPoort>
      {/* Overal snel een taak toevoegen (+ rechtsonder, sneltoets n). */}
      <SnelTaakKnop />
    </div>
  )
}
