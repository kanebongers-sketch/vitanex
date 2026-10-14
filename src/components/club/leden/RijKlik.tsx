'use client'

import type { MouseEvent, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Een hele rij klikbaar maken zonder de tabel kapot te maken: klik ergens in
// een <tr data-href> en je gaat naar de ledenkaart. De naam blijft een echte
// link, dus toetsenbord en "openen in nieuw tabblad" werken gewoon.

export function RijKlik({ children }: { children: ReactNode }) {
  const router = useRouter()

  function klik(e: MouseEvent<HTMLTableSectionElement>) {
    if (!(e.target instanceof Element) || e.target.closest('a, button, input, select, label')) return
    if (window.getSelection()?.toString()) return
    const href = e.target.closest('tr')?.getAttribute('data-href')
    if (href) router.push(href)
  }

  return <tbody onClick={klik}>{children}</tbody>
}
