'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, RotateCcw } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { DemoStatus } from '@/lib/club/platform/demo-aanvragen'

interface AfgehandeldKnopProps {
  id: string
  naam: string
  status: DemoStatus
}

// Zet een demo-aanvraag op afgehandeld (of terug op open) en ververst het
// overzicht, zodat de tegel en de volgorde meteen kloppen.
export function AfgehandeldKnop({ id, naam, status }: AfgehandeldKnopProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const open = status === 'open'

  async function wissel() {
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/platform/demo-aanvragen', 'PATCH', { id, status: open ? 'afgehandeld' : 'open' })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    router.refresh()
  }

  return (
    <span className="club-platform-demo-actie">
      <button
        type="button"
        className={open ? 'club-knop club-knop--klein club-knop--primair' : 'club-knop club-knop--klein'}
        onClick={() => void wissel()}
        disabled={bezig}
        aria-label={open ? `Demo-aanvraag van ${naam} afgehandeld` : `Demo-aanvraag van ${naam} weer openzetten`}
      >
        {open ? <Check size={14} aria-hidden /> : <RotateCcw size={14} aria-hidden />}
        {bezig ? 'Bezig…' : open ? 'Afgehandeld' : 'Weer open'}
      </button>
      {fout && (
        <span className="club-fout" role="alert">
          {fout}
        </span>
      )}
    </span>
  )
}
