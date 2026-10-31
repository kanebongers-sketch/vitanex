'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Maximize2, QrCode, RotateCcw, ScanLine, Sun, WifiOff, X } from 'lucide-react'
import { isCheckinCodeAntwoord, type CheckinCodeAntwoord } from '@/lib/club/checkin/types'
import { useLedenappApi } from './LedenappApi'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

// De check-in QR-code bovenaan Home. Wisselt elke 30 seconden: de app haalt
// zelf een nieuwe code als de oude afloopt, en meteen als de app weer in beeld
// komt. Op Home een compacte kaart; een tik geeft de code op volledig scherm
// (donker op wit, met naam, aftelbalkje en de tip over de helderheid), waarbij
// het scherm aan blijft zolang dat kan (Wake Lock). Escape of Sluiten gaat
// terug. De code zelf zit alleen in het plaatje (ondertekend, geen naam of
// lidnummer erin).

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
  const [groot, setGroot] = useState(false)
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
      {stand.soort === 'code' ? (
        <button type="button" className="club-lidapp-qr-kaart" onClick={() => setGroot(true)} aria-label={t.openAria} aria-haspopup="dialog">
          <span className="club-lidapp-qr-mini" aria-hidden>
            <img src={stand.beeld} alt="" width={72} height={72} />
          </span>
          <span className="club-lidapp-qr-kaarttekst">
            <span id="lidapp-qr" className="club-lidapp-qr-titel">
              <QrCode aria-hidden size={16} /> {t.kop}
            </span>
            <span className="club-lidapp-qr-live">
              <span aria-hidden /> {t.live}
            </span>
            <span className="club-lidapp-qr-groot">{t.groot}</span>
          </span>
          <Maximize2 aria-hidden size={20} className="club-lidapp-qr-pijl" />
        </button>
      ) : stand.soort === 'laden' ? (
        <div className="club-lidapp-qr-kaart" role="status" aria-busy="true">
          <span className="club-lidapp-qr-mini club-lidapp-qr-vlak--laden" aria-hidden>
            <ScanLine size={28} strokeWidth={1.5} />
          </span>
          <span className="club-lidapp-qr-kaarttekst">
            <span id="lidapp-qr" className="club-lidapp-qr-titel">
              <QrCode aria-hidden size={16} /> {t.kop}
            </span>
            <span className="club-lidapp-qr-groot">{t.laden}</span>
          </span>
        </div>
      ) : (
        <>
          <div className="club-lidapp-qr-kop">
            <h3 id="lidapp-qr">
              <QrCode aria-hidden size={16} /> {t.kop}
            </h3>
          </div>
          <QrInhoud stand={stand} onOpnieuw={opnieuw} t={t} />
        </>
      )}
      {groot && stand.soort === 'code' && <QrGroot stand={stand} onSluit={() => setGroot(false)} t={t} />}
    </section>
  )
}

type CodeStand = Extract<Stand, { soort: 'code' }>
type QrTeksten = (typeof LEDENAPP)['nl']['qr']

/** Houdt het scherm aan zolang de code groot staat (waar de browser dat toestaat). */
function useSchermAan() {
  useEffect(() => {
    let slot: { release: () => Promise<void> } | null = null
    let weg = false
    const vraag = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (s: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
        if (!wl || document.visibilityState !== 'visible') return
        const nieuw = await wl.request('screen')
        if (weg) void nieuw.release().catch(() => undefined)
        else slot = nieuw
      } catch {
        // Niet toegestaan of niet ondersteund: de tip over helderheid blijft staan.
      }
    }
    const zichtbaar = () => {
      if (document.visibilityState === 'visible') void vraag()
    }
    void vraag()
    document.addEventListener('visibilitychange', zichtbaar)
    return () => {
      weg = true
      document.removeEventListener('visibilitychange', zichtbaar)
      void slot?.release().catch(() => undefined)
    }
  }, [])
}

function QrGroot({ stand, onSluit, t }: { stand: CodeStand; onSluit: () => void; t: QrTeksten }) {
  const vlak = useRef<HTMLDivElement>(null)
  const sluit = useEffectEvent(onSluit)
  useSchermAan()
  useEffect(() => {
    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    vlak.current?.focus()
    function toets(e: KeyboardEvent) {
      if (e.key === 'Escape') sluit()
    }
    window.addEventListener('keydown', toets)
    return () => {
      window.removeEventListener('keydown', toets)
      vorige?.focus()
    }
  }, [])
  return (
    <div className="club-lidapp-qr-scherm">
      <div ref={vlak} className="club-lidapp-qr-volledig" role="dialog" aria-modal="true" aria-label={t.kop} tabIndex={-1}>
        <button type="button" className="club-lidapp-blad-sluit club-lidapp-qr-sluit" onClick={onSluit} aria-label={t.sluiten}>
          <X aria-hidden size={22} />
        </button>
        <CodeInhoud stand={stand} t={t} groot />
      </div>
    </div>
  )
}

function CodeInhoud({ stand, t, groot = false }: { stand: CodeStand; t: QrTeksten; groot?: boolean }) {
  const totaalMs = stand.vakSec * 1000
  return (
    <>
      <span className="club-lidapp-qr-live">
        <span aria-hidden /> {t.live}
      </span>
      <div className="club-lidapp-qr-vlak" data-groot={groot || undefined}>
        <img src={stand.beeld} alt={t.alt(stand.naam)} width={360} height={360} />
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

function QrInhoud({ stand, onOpnieuw, t }: { stand: Stand; onOpnieuw: () => void; t: QrTeksten }) {
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
  return null
}
