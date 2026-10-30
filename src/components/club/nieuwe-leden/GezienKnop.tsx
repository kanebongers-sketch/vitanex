'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'

// "Gezien" bij een melding op Vandaag: de melding verdwijnt voor het hele team.

interface Props {
  lidId: string
  wat: 'aanmelding' | 'intake'
  label: string
}

export function GezienKnop({ lidId, wat, label }: Props) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function gezien() {
    setBezig(true)
    setFout(null)
    const r = await stuur(`/api/club/leden/${encodeURIComponent(lidId)}/gezien`, 'POST', { wat })
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    router.refresh()
  }

  return (
    <>
      <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => void gezien()} disabled={bezig} aria-busy={bezig || undefined}>
        <Check size={15} aria-hidden /> {label}
      </button>
      {fout && <span className="club-nl-fout" role="alert">{fout}</span>}
    </>
  )
}
