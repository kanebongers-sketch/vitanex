'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CircleCheck, Hand, QrCode, X } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { lijktOpCheckinCode } from '@/lib/club/checkin/qr-formaat'
import { isQrCheckinAntwoord, type QrCheckinAntwoord } from '@/lib/club/checkin/types'
import { CameraBeeld } from './CameraBeeld'
import { useQrCamera } from './useQrCamera'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'

type KioskTekst = (typeof CHECKIN)['nl']['kiosk']

// Zelf-check-in (kiosk): een tablet bij de ingang met de voorcamera. Het lid
// houdt de QR-code uit de app voor de camera en ziet groot "Welkom Sanne", of
// een vriendelijke melding om even naar de balie te gaan. Alleen de voornaam
// in beeld; nooit statussen of redenen van het lidmaatschap (anderen kijken mee).
// Nooit "toch inchecken": dat beslist de balie.

const WELKOM_MS = 3500
const MELDING_MS = 6000

type Uitkomst =
  | { soort: 'welkom'; titel: string; regel: string }
  | { soort: 'binnen'; titel: string; regel: string }
  | { soort: 'balie'; titel: string; regel: string }

interface Props {
  vestiging: Vestiging
  vestigingNaam: string
  sportschool: string
  terug: string
}

function uitkomstVan(a: QrCheckinAntwoord, t: KioskTekst): Uitkomst {
  const naam = a.lid.voornaam
  if (a.soort === 'ingecheckt') return { soort: 'welkom', titel: t.welkom(naam), regel: a.les ? t.aanwezig(a.les.naam) : t.ingecheckt }
  if (a.soort === 'dubbel') return { soort: 'binnen', titel: t.alBinnen(naam), regel: t.alBinnenRegel }
  return { soort: 'balie', titel: t.hoi(naam), regel: t.naarBalie }
}

async function stuurScan(qr: string, vestiging: Vestiging, t: KioskTekst): Promise<Uitkomst> {
  try {
    const res = await fetch('/api/club/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qr, vestiging }) })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok && isQrCheckinAntwoord(data)) return uitkomstVan(data, t)
    return { soort: 'balie', titel: t.codeWerktNiet, regel: t.codeWerktNietRegel }
  } catch {
    return { soort: 'balie', titel: t.geenVerbinding, regel: t.geenVerbindingRegel }
  }
}

export function CheckinKiosk({ vestiging, vestigingNaam, sportschool, terug }: Props) {
  const [uitkomst, setUitkomst] = useState<Uitkomst | null>(null)
  const [bezig, setBezig] = useState(false)
  const t = useTekst(CHECKIN).kiosk

  async function scan(code: string) {
    if (bezig || uitkomst) return
    if (!lijktOpCheckinCode(code)) {
      setUitkomst({ soort: 'balie', titel: t.geenCode, regel: t.geenCodeRegel })
      return
    }
    setBezig(true)
    setUitkomst(await stuurScan(code, vestiging, t))
    setBezig(false)
  }

  const { video, stand } = useQrCamera({ actief: true, kant: 'user', pauze: bezig || uitkomst !== null, onCode: (c) => void scan(c) })

  useEffect(() => {
    if (!uitkomst) return
    const weg = window.setTimeout(() => setUitkomst(null), uitkomst.soort === 'balie' ? MELDING_MS : WELKOM_MS)
    return () => window.clearTimeout(weg)
  }, [uitkomst])

  return (
    <div className="club-kiosk" role="region" aria-label={t.label}>
      <header className="club-kiosk-kop">
        <div>
          <p className="club-boventitel">{sportschool} · {vestigingNaam}</p>
          <h1>{t.titel}</h1>
          <p className="club-kiosk-uitleg">
            <QrCode aria-hidden size={20} /> {t.uitleg}
          </p>
        </div>
        <Link href={terug} className="club-kiosk-sluit" aria-label={t.sluit}>
          <X aria-hidden size={20} />
        </Link>
      </header>
      <div className="club-kiosk-beeld">
        <CameraBeeld video={video} stand={stand} gespiegeld label={t.camera} className="club-checkin-camera--groot" />
        {uitkomst && (
          <div className={`club-kiosk-uitkomst club-kiosk-uitkomst--${uitkomst.soort}`} role="status" aria-live="assertive">
            {uitkomst.soort === 'balie' ? <Hand aria-hidden size={64} /> : <CircleCheck aria-hidden size={64} />}
            <p className="club-kiosk-uitkomst-titel">{uitkomst.titel}</p>
            <p>{uitkomst.regel}</p>
          </div>
        )}
        {bezig && !uitkomst && <p className="club-kiosk-bezig" role="status">{t.bezig}</p>}
      </div>
    </div>
  )
}
