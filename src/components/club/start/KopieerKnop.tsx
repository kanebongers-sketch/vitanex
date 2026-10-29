'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Een adres kopieren met een klik. Lukt het niet (oude browser, geen
// toestemming), dan zeggen we dat eerlijk: het adres staat ernaast om over te nemen.

interface KopieerKnopProps {
  tekst: string
  /** Waar het over gaat, voor de schermlezer ("adres van de ledenapp"). */
  label: string
}

type Stand = 'rust' | 'ok' | 'mislukt'

export function KopieerKnop({ tekst, label }: KopieerKnopProps) {
  const [stand, setStand] = useState<Stand>('rust')
  const t = useTekst(START).kopieer

  useEffect(() => {
    if (stand === 'rust') return
    const klok = window.setTimeout(() => setStand('rust'), 2400)
    return () => window.clearTimeout(klok)
  }, [stand])

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst)
      setStand('ok')
    } catch {
      setStand('mislukt')
    }
  }

  return (
    <span className="club-start-kopieer">
      <button type="button" className="club-knop club-knop--klein" aria-label={t.label(label)} onClick={() => void kopieer()}>
        {stand === 'ok' ? <Check aria-hidden size={14} strokeWidth={3} /> : <Copy aria-hidden size={14} />}
        {stand === 'ok' ? t.gekopieerd : t.knop}
      </button>
      <span className="sr-only" aria-live="polite">
        {stand === 'ok' ? t.gekopieerd : stand === 'mislukt' ? t.misluktSr : ''}
      </span>
      {stand === 'mislukt' && <span className="club-zacht club-start-kopieer-fout">{t.mislukt}</span>}
    </span>
  )
}
