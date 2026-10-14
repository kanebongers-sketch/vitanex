'use client'

import { Printer } from 'lucide-react'

export function PrintKnop() {
  return (
    <button type="button" className="club-knop" onClick={() => window.print()}>
      <Printer aria-hidden size={16} /> Printen
    </button>
  )
}
