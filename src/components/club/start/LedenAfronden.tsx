'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { StartVoet, type StartVoetProps } from './StartVoet'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Onderaan stap Leden: zonder ingelezen leden ga je pas verder als je
// bevestigt dat je zonder leden begint (dan telt de stap als af, regel in
// stappen.ts). Met leden staat hier alleen de voet.

interface LedenAfrondenProps {
  /** Hoeveel leden er al zijn. */
  leden: number
  /** Bevestigde de eigenaar al dat hij zonder leden begint? */
  zonderLeden: boolean
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function LedenAfronden({ leden, zonderLeden, voet }: LedenAfrondenProps) {
  const router = useRouter()
  const [zonder, setZonder] = useState(zonderLeden)
  const [fout, setFout] = useState<string | null>(null)
  const t = useTekst(START)
  const gewijzigd = zonder !== zonderLeden

  async function voorVerder(doel: 'verder' | 'stoppen'): Promise<boolean> {
    setFout(null)
    if (doel === 'verder' && leden === 0 && !zonder) {
      setFout(t.leden.verplicht)
      return false
    }
    if (!gewijzigd) return true
    const uit = await stuur('/api/club/start', 'PATCH', { bevestig: { zonder_leden: zonder } })
    if (!uit.ok) {
      setFout(uit.fout)
      return false
    }
    router.refresh()
    return true
  }

  return (
    <>
      {leden === 0 ? (
        <label className="club-start-bevestig club-start-blok">
          <input
            type="checkbox"
            checked={zonder}
            onChange={(e) => {
              setFout(null)
              setZonder(e.target.checked)
            }}
          />
          <span>
            <strong>{t.leden.zonder}</strong>
            <span className="club-zacht">{t.leden.zonderUitleg}</span>
          </span>
        </label>
      ) : (
        <p className="club-melding club-melding--ok">{t.leden.aantal(leden)}</p>
      )}
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <StartVoet {...voet} voorVerder={voorVerder} primair={gewijzigd ? t.voet.opslaanVerder : undefined} />
    </>
  )
}
