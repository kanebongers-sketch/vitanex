'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'

// Kopieert de voorbeeldtekst naar het klembord, zodat het team hem in de eigen
// app (WhatsApp, mail, sms) kan plakken. Club verstuurt zelf niets.

interface Props {
  tekst: string
}

export function KopieerKnop({ tekst }: Props) {
  const [stand, setStand] = useState<'klaar' | 'gekopieerd' | 'mislukt'>('klaar')
  const t = useTekst(OPVOLGEN).taak

  useEffect(() => {
    if (stand === 'klaar') return
    const timer = window.setTimeout(() => setStand('klaar'), 2400)
    return () => window.clearTimeout(timer)
  }, [stand])

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst)
      setStand('gekopieerd')
    } catch {
      setStand('mislukt')
    }
  }

  return (
    <>
      <button type="button" className="club-knop club-knop--klein" onClick={kopieer}>
        {stand === 'gekopieerd' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        {stand === 'gekopieerd' ? t.gekopieerd : t.kopieer}
      </button>
      <span className="club-sr" role="status" aria-live="polite">
        {stand === 'gekopieerd' ? t.gekopieerdMelding : stand === 'mislukt' ? t.kopierenMislukt : ''}
      </span>
    </>
  )
}
