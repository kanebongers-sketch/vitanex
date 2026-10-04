'use client'

import { useState } from 'react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'

interface Props {
  /** De kalenderdag van vandaag (YYYY-MM-DD) — die wordt dag 1 van het nieuwe blok. */
  vandaag: string
  /** Na een geslaagde start: de kaart opnieuw laden. */
  onGestart: () => Promise<void>
}

/**
 * Na week 4 stond hier alleen "afgerond", zonder weg terug. Nu begin je met één
 * klik een nieuw blok vanaf vandaag; je gelogde sets blijven bewaard.
 */
export function BlokAfgerond({ vandaag, onGestart }: Props) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function start() {
    setBezig(true)
    setFout(null)
    const uit = await haalJson('/api/lifeos/blok/nieuw', leesNiets, {
      method: 'POST',
      body: JSON.stringify({ datum: vandaag }),
    })
    setBezig(false)
    if (!uit.ok) {
      setFout(uit.fout)
      return
    }
    await onGestart()
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
        Je 4-weken blok is afgerond. Begin een nieuw blok vanaf vandaag: het schema start weer bij week 1, je
        vorige prestaties blijven de basis voor je gewichtsadvies.
      </p>
      <div>
        <Knop variant="primair" onClick={() => void start()} disabled={bezig}>
          {bezig ? 'Bezig…' : 'Nieuw blok starten'}
        </Knop>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}
