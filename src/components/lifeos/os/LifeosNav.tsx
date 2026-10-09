'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ClipboardList, Dumbbell, FolderKanban, LayoutDashboard, LayoutGrid, LogOut, Network, Salad, Users,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { PT_APP_BEHEER } from '@/lib/lifeos/pt-dashboard/beheer'

// Het menu van LifeOS op fitfactorypt.nl/lifeoskane. Eigen menu, los van de
// consumenten-app: een vaste balk bovenin die op mobiel horizontaal scrolt.

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
    <header className="lk-balk">
      <Link href={LIFEOS_BASIS} className="lk-merk" aria-label="LifeOS dashboard">
        LifeOS<b>.</b>
      </Link>
      <nav className="lk-nav" aria-label="LifeOS">
        {ITEMS.map(({ href, label, icoon: Icoon }) => (
          <Link key={href} href={href} className="lk-link" aria-current={isActief(pad, href) ? 'page' : undefined}>
            <Icoon size={15} strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <button type="button" className="lk-uit" onClick={() => void uitloggen()} aria-label="Uitloggen">
        <LogOut size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  )
}
