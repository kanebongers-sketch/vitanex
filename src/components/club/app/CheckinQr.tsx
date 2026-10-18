'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { QrCode, Sun } from 'lucide-react'
import { isCheckinCodeAntwoord, type CheckinCodeAntwoord } from '@/lib/club/checkin/types'
import { useLedenappApi } from './LedenappApi'

// De check-in QR-code op Home. Wisselt elke 30 seconden: de app haalt zelf een
// nieuwe code als de oude afloopt, en meteen als de app weer in beeld komt.
// Groot, donker op wit, met de naam van het lid en een aftelbalkje. De code
// zelf zit alleen in het plaatje (ondertekend, geen naam of lidnummer erin).

const OPNIEUW_NA_FOUT_MS = 10_000

type Stand =
  | { soort: 'laden' }
  | { soort: 'fout' }
  | (Extract<CheckinCodeAntwoord, { soort: 'code' }> & { sleutel: number })
  | Extract<CheckinCodeAntwoord, { soort: 'uit' }>

export function CheckinQr({ lidId }: { lidId: string }) {
  const api = useLedenappApi()
  const [stand, setStand] = useState<Stand>({ soort: 'laden' })
  const url = api.checkinCode(lidId)

  const haal = useEffectEvent(async (): Promise<number | null> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const data: unknown = await res.json().catch(() => null)
      // Voorvertoning in Club door iemand anders dan Kane: geen echte code.
      if (res.status === 404) {
        setStand({ soort: 'uit', melding: 'De check-in code verschijnt in de app van het lid zelf.' })
        return null
      }
      if (!res.ok || !isCheckinCodeAntwoord(data)) {
        setStand({ soort: 'fout' })
        return OPNIEUW_NA_FOUT_MS
      }
      if (data.soort === 'uit') {
        setStand(data)
        return null
      }
      setStand({ ...data, sleutel: Date.now() })
      return data.vernieuwOverMs
    } catch {
      setStand({ soort: 'fout' })
      return OPNIEUW_NA_FOUT_MS
    }
  })

  useEffect(() => {
    let klok: number | undefined
    let weg = false
    async function ronde() {
      window.clearTimeout(klok)
      const over = await haal()
      if (!weg && over !== null && document.visibilityState === 'visible') klok = window.setTimeout(() => void ronde(), over)
    }
    function zichtbaar() {
      if (document.visibilityState === 'visible') void ronde()
      else window.clearTimeout(klok)
    }
    void ronde()
    document.addEventListener('visibilitychange', zichtbaar)
    return () => {
      weg = true
      window.clearTimeout(klok)
      document.removeEventListener('visibilitychange', zichtbaar)
    }
  }, [url])

  return (
    <section className="club-lidapp-qr" aria-labelledby="lidapp-qr">
      <h3 id="lidapp-qr">
        <QrCode aria-hidden size={16} /> Inchecken
      </h3>
      <QrInhoud stand={stand} />
    </section>
  )
}

function QrInhoud({ stand }: { stand: Stand }) {
  if (stand.soort === 'laden') return <div className="club-lidapp-qr-vlak club-lidapp-qr-vlak--laden" aria-busy="true" aria-label="Code laden" />
  if (stand.soort === 'uit') return <p className="club-lidapp-leeg">{stand.melding}</p>
  if (stand.soort === 'fout') return <p className="club-lidapp-leeg" role="status">De code kon niet worden geladen. We proberen het zo opnieuw.</p>
  const totaalMs = stand.vakSec * 1000
  return (
    <>
      <div className="club-lidapp-qr-vlak">
        <img src={stand.beeld} alt={`Check-in code van ${stand.naam}`} width={280} height={280} />
      </div>
      <p className="club-lidapp-qr-naam">{stand.naam}</p>
      <div className="club-lidapp-qr-tijd" aria-hidden>
        <span
          key={stand.sleutel}
          style={{ animationDuration: `${stand.vernieuwOverMs}ms`, transform: `scaleX(${Math.min(1, stand.vernieuwOverMs / totaalMs)})` }}
        />
      </div>
      <p>Houd je telefoon voor de camera of scanner bij de ingang. De code wisselt elke {stand.vakSec} seconden.</p>
      <p className="club-lidapp-qr-tip">
        <Sun aria-hidden size={14} /> Zet je scherm op de hoogste helderheid, dan scant hij het snelst.
      </p>
    </>
  )
}
