'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'

// Een knop in het beheer die een API-actie doet en de pagina ververst. Met
// `bevestig` eerst een vraag. Fouten verschijnen naast de knop.

interface Props {
  url: string
  method: 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  label: string
  bezigLabel?: string
  bevestig?: string
  soort?: 'primair' | 'stil' | 'gevaar'
  klein?: boolean
}

export function BeheerKnop({ url, method, body, label, bezigLabel = 'Even geduld...', bevestig, soort = 'stil', klein = true }: Props) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function klik() {
    if (bevestig && !window.confirm(bevestig)) return
    setBezig(true)
    setFout(null)
    const uit = await stuur(url, method, body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    router.refresh()
  }

  return (
    <span className="club-cmb-knopvak">
      <button type="button" className={`club-knop club-knop--${soort}${klein ? ' club-knop--klein' : ''}`} disabled={bezig} onClick={() => void klik()}>
        {bezig ? bezigLabel : label}
      </button>
      {fout && (
        <span className="club-melding club-melding--fout" role="alert">
          {fout}
        </span>
      )}
    </span>
  )
}
