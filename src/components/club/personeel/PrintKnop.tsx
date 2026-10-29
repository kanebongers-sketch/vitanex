'use client'

import { Printer } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

export function PrintKnop() {
  const tk = useTekst(PERSONEEL).algemeen
  return (
    <button type="button" className="club-knop" onClick={() => window.print()}>
      <Printer aria-hidden size={16} /> {tk.printen}
    </button>
  )
}
