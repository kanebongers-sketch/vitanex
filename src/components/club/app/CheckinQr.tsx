'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { QrCode, RotateCcw, ScanLine, Sun, WifiOff } from 'lucide-react'
import { isCheckinCodeAntwoord, type CheckinCodeAntwoord } from '@/lib/club/checkin/types'
import { useLedenappApi } from './LedenappApi'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

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
  const t = LEDENAPP[useTaal()].qr
  const [stand, setStand] = useState<Stand>({ soort: 'laden' })
  // Ophogen = meteen opnieuw proberen (knop bij een fout); het lid staat vaak al bij de ingang.
  const [poging, setPoging] = useState(0)
  const url = api.checkinCode(lidId)

  const haal = useEffectEvent(async (): Promise<number | null> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const data: unknown = await res.json().catch(() => null)
      // Voorvertoning in Club door iemand anders dan Kane: geen echte code.
      if (res.status === 404) {
        setStand({ soort: 'uit', melding: t.inAppLid })
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
  }, [url, poging])

  function opnieuw() {
    setStand({ soort: 'laden' })
    setPoging((n) => n + 1)
  }

  return (
    <section className="club-lidapp-qr" aria-labelledby="lidapp-qr" data-stand={stand.soort}>
      <div className="club-lidapp-qr-kop">
        <h3 id="lidapp-qr">
          <QrCode aria-hidden size={16} /> {t.kop}
        </h3>
        {stand.soort === 'code' && (
          <span className="club-lidapp-qr-live">
            <span aria-hidden /> {t.live}
          </span>
        )}
      </div>
      <QrInhoud stand={stand} onOpnieuw={opnieuw} t={t} />
    </section>
  )
}

function QrInhoud({ stand, onOpnieuw, t }: { stand: Stand; onOpnieuw: () => void; t: (typeof LEDENAPP)['nl']['qr'] }) {
  if (stand.soort === 'laden') {
    return (
      <div className="club-lidapp-qr-vlak club-lidapp-qr-vlak--laden" role="status" aria-busy="true">
        <ScanLine aria-hidden size={40} strokeWidth={1.5} />
        <span className="club-sr">{t.laden}</span>
      </div>
    )
  }
  if (stand.soort === 'uit') return <p className="club-lidapp-qr-melding">{stand.melding}</p>
  if (stand.soort === 'fout') {
    return (
      <>
        <p className="club-lidapp-qr-melding club-lidapp-qr-melding--fout" role="status">
          <WifiOff aria-hidden size={18} /> {t.fout}
        </p>
        <button type="button" className="club-lidapp-knop" onClick={onOpnieuw}>
          <RotateCcw aria-hidden size={16} /> {t.opnieuw}
        </button>
      </>
    )
  }
  const totaalMs = stand.vakSec * 1000
  return (
    <>
      <div className="club-lidapp-qr-vlak">
        <img src={stand.beeld} alt={t.alt(stand.naam)} width={280} height={280} />
      </div>
      <p className="club-lidapp-qr-naam">{stand.naam}</p>
      <div className="club-lidapp-qr-tijd" aria-hidden>
        <span
          key={stand.sleutel}
          style={{ animationDuration: `${stand.vernieuwOverMs}ms`, transform: `scaleX(${Math.min(1, stand.vernieuwOverMs / totaalMs)})` }}
        />
      </div>
      <p className="club-lidapp-qr-uitleg">{t.uitleg(stand.vakSec)}</p>
      <p className="club-lidapp-qr-tip">
        <Sun aria-hidden size={14} /> {t.tip}
      </p>
    </>
  )
}
