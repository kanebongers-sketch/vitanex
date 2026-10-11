'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ClipboardList, Dumbbell, FolderKanban, LayoutDashboard, LayoutGrid, LogOut, Network, Salad, Users,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { PT_APP_BEHEER } from '@/lib/lifeos/pt-dashboard/beheer'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'

// Het menu van LifeOS op fitfactorypt.nl/lifeoskane, in dezelfde opbouw als de
// Fit Factory PT-app: een balk bovenin (logo + LIFEOS links, naam en uitloggen
// rechts) en daaronder de tabs in Barlow-kapitalen, de actieve tab als amber vlak.
// Op een smal scherm scrollen de tabs horizontaal in plaats van te wrappen.

interface Item {
  href: string
  label: string
  icoon: LucideIcon
}

export const LIFEOS_BASIS = '/lifeoskane'

const ITEMS: readonly Item[] = [
  { href: LIFEOS_BASIS, label: 'Dashboard', icoon: LayoutDashboard },
  { href: `${LIFEOS_BASIS}/training`, label: 'Training', icoon: Dumbbell },
  { href: `${LIFEOS_BASIS}/mensen`, label: 'Mensen', icoon: Users },
  { href: `${LIFEOS_BASIS}/categorieen`, label: 'Categorieën', icoon: LayoutGrid },
  { href: `${LIFEOS_BASIS}/kennis`, label: 'Kennis', icoon: Network },
  { href: `${LIFEOS_BASIS}/projecten`, label: 'Projecten', icoon: FolderKanban },
  { href: `${LIFEOS_BASIS}/programma`, label: 'Programma', icoon: Salad },
  { href: PT_APP_BEHEER, label: 'Fit Factory PT', icoon: ClipboardList },
]

function isActief(pad: string, href: string): boolean {
  if (href === LIFEOS_BASIS) return pad === LIFEOS_BASIS
  return pad === href || pad.startsWith(`${href}/`)
}

export function LifeosNav() {
  const pad = usePathname()
  const router = useRouter()

  async function uitloggen() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <>
      <header className="lk-balk">
        <Link href={LIFEOS_BASIS} className="lk-merk" aria-label="LifeOS dashboard">
          <FfLogo className="lk-logo" prioriteit />
          <span className="lk-woordmerk" aria-hidden="true">
            Life<b>OS</b>
          </span>
        </Link>
        <div className="lk-balk-rechts">
          <span className="lk-wie">Kane</span>
          <button type="button" className="lk-uit" onClick={() => void uitloggen()} aria-label="Uitloggen">
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            <span className="lk-uit-tekst">Uitloggen</span>
          </button>
        </div>
      </header>
      <nav className="lk-tabs" aria-label="LifeOS">
        {ITEMS.map(({ href, label, icoon: Icoon }) => (
          <Link key={href} href={href} className="lk-tab" aria-current={isActief(pad, href) ? 'page' : undefined}>
            <Icoon strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
