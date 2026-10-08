'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Drie tabbladen, plakt bovenaan tijdens scrollen. Actief = aria-current.

export function PtNav({ code }: { code: string }) {
  const pad = usePathname()
  const items = [
    { href: `/${code}`, label: 'Overzicht' },
    { href: `/${code}/lead`, label: 'Leads' },
    { href: `/${code}/klanten`, label: 'Klanten' },
  ]
  return (
    <nav className="ptd-nav" aria-label="PT-dashboard">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={pad === i.href ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
