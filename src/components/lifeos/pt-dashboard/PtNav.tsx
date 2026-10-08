'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, MessagesSquare, UserPlus, Users, type LucideIcon } from 'lucide-react'
import type { LinkRol } from '@/lib/lifeos/leads/links'

// De app-navigatie: op de telefoon een tabbalk onderin (duimbereik, zoals een
// echte app), vanaf tablet een rij bovenaan. Actief = aria-current. Een eigenaar
// krijgt dezelfde tabs, maar "Home" heet "Team" (ook actief op /team/<id>).

interface Item {
  pad: string
  label: string
  icoon: LucideIcon
  /** Subpaden die dit item ook actief maken. */
  ook?: string
}

const ITEMS: Item[] = [
  { pad: '', label: 'Home', icoon: LayoutDashboard },
  { pad: '/lead', label: 'Leads', icoon: UserPlus },
  { pad: '/klanten', label: 'Klanten', icoon: Users },
  { pad: '/coach', label: 'Coach', icoon: MessagesSquare },
  { pad: '/bibliotheek', label: 'Kennis', icoon: BookOpen },
]

const EIGENAAR_ITEMS: Item[] = ITEMS.map((i) => (i.pad === '' ? { ...i, label: 'Team', ook: '/team' } : i))

export function PtNav({ code, rol = 'pt' }: { code: string; rol?: LinkRol }) {
  const pad = usePathname()
  return (
    <nav className="ff-tabs" aria-label="PT-app">
      {(rol === 'eigenaar' ? EIGENAAR_ITEMS : ITEMS).map(({ pad: p, label, icoon: Icoon, ook }) => {
        const href = `/${code}${p}`
        const actief =
          (p === '' ? pad === href : pad === href || pad.startsWith(`${href}/`)) || (!!ook && pad.startsWith(`/${code}${ook}/`))
        return (
          <Link key={href} href={href} aria-current={actief ? 'page' : undefined}>
            <Icoon aria-hidden strokeWidth={2} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
