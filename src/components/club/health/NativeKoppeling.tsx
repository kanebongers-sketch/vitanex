'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DataSoort } from '@/lib/club/health/typen'
import { healthUrl } from './paden'

// Apple Gezondheid of Health Connect: werkt alleen in de app op de telefoon.
// In de browser zegt de kaart dat eerlijk ("Beschikbaar in de app") en laadt de
// plugin nooit (native.ts importeert hem pas in de app).

interface NativeKoppelingProps {
  bron: 'apple_health' | 'health_connect'
  /** De soorten waarvoor het lid toestemming gaf en die deze bron levert. */
  soorten: readonly DataSoort[]
  voor: string | null
  alleenLezen: boolean
}

type Staat = 'laden' | 'web' | 'ander_toestel' | 'klaar' | 'bezig'

const DAGEN_TERUG = 30

export function NativeKoppeling({ bron, soorten, voor, alleenLezen }: NativeKoppelingProps) {
  const router = useRouter()
  const [staat, setStaat] = useState<Staat>('laden')
  const [melding, setMelding] = useState<string | null>(null)

  useEffect(() => {
    let weg = false
    void import('@/lib/club/health/native').then(({ nativeBron }) => {
      if (weg) return
      const hier = nativeBron()
      setStaat(hier === null ? 'web' : hier === bron ? 'klaar' : 'ander_toestel')
    })
    return () => {
      weg = true
    }
  }, [bron])

  const bijwerken = async () => {
    setStaat('bezig')
    setMelding(null)
    const native = await import('@/lib/club/health/native')
    if (!(await native.nativeBeschikbaar())) {
      setStaat('klaar')
      return setMelding(bron === 'health_connect' ? 'Health Connect staat niet op deze telefoon. Installeer het via de Play Store.' : 'Apple Gezondheid is op dit toestel niet beschikbaar.')
    }
    if (!(await native.vraagNativeRechten(soorten))) {
      setStaat('klaar')
      return setMelding('Je hebt geen toegang gegeven. Je kunt dit aanpassen in de instellingen van je telefoon.')
    }
    const metingen = await native.leesNative(soorten, DAGEN_TERUG)
    const r = await native.stuurNaarClub(healthUrl('/native', voor), bron, metingen)
    setStaat('klaar')
    setMelding(r.ok ? (r.verwerkt > 0 ? `Bijgewerkt: ${r.verwerkt} metingen.` : 'Bijgewerkt. Er was niets nieuws.') : r.fout)
    if (r.ok) router.refresh()
  }

  if (staat === 'laden') return null
  if (staat === 'web') return <span className="club-hl-status">Beschikbaar in de app</span>
  if (staat === 'ander_toestel') return <span className="club-hl-status">Op een ander soort telefoon</span>
  return (
    <>
      <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" disabled={alleenLezen || staat === 'bezig' || soorten.length === 0} onClick={bijwerken}>
        {staat === 'bezig' ? 'Bezig met ophalen' : 'Nu bijwerken'}
      </button>
      {melding && (
        <p className="club-hl-melding" role="status">
          {melding}
        </p>
      )}
    </>
  )
}
