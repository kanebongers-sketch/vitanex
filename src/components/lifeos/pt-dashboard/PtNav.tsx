'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, MessagesSquare, UserPlus, Users, type LucideIcon } from 'lucide-react'

// De app-navigatie: op de telefoon een tabbalk onderin (duimbereik, zoals een
// echte app), vanaf tablet een rij bovenaan. Actief = aria-current.

const ITEMS: { pad: string; label: string; icoon: LucideIcon }[] = [
  { pad: '', label: 'Home', icoon: LayoutDashboard },
  { pad: '/lead', label: 'Leads', icoon: UserPlus },
  { pad: '/klanten', label: 'Klanten', icoon: Users },
  { pad: '/coach', label: 'Coach', icoon: MessagesSquare },
  { pad: '/bibliotheek', label: 'Kennis', icoon: BookOpen },
]

export function PtNav({ code }: { code: string }) {
  const pad = usePathname()
  return (
    <nav className="ff-tabs" aria-label="PT-app">
      {ITEMS.map(({ pad: p, label, icoon: Icoon }) => {
        const href = `/${code}${p}`
        const actief = p === '' ? pad === href : pad === href || pad.startsWith(`${href}/`)
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
