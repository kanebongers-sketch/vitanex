'use client'

import { useState } from 'react'
import { Camera, RefreshCcw, X } from 'lucide-react'
import { CameraBeeld } from './CameraBeeld'
import { useQrCamera } from './useQrCamera'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'

// "Scan met camera" aan de balie: de camera van de tablet of telefoon leest de
// QR-code uit de ledenapp. Standaard de achtercamera; een knop wisselt.

interface Props {
  /** Direct open (check-in methode alleen QR). */
  startOpen: boolean
  /** Pauze terwijl er een uitkomst of verzoek loopt. */
  pauze: boolean
  onCode: (code: string) => void
}

export function BalieCamera({ startOpen, pauze, onCode }: Props) {
  const [open, setOpen] = useState(startOpen)
  const [kant, setKant] = useState<'environment' | 'user'>('environment')
  const t = useTekst(CHECKIN).camera
  const { video, stand } = useQrCamera({ actief: open, kant, pauze, onCode })

  if (!open) {
    return (
      <button type="button" className="club-knop club-knop--stil club-checkin-camera-knop" onClick={() => setOpen(true)}>
        <Camera aria-hidden size={18} /> {t.scan}
      </button>
    )
  }
  return (
    <div className="club-checkin-camera-blok">
      <CameraBeeld video={video} stand={stand} gespiegeld={kant === 'user'} label={t.label} />
      <div className="club-checkin-camera-knoppen">
        <button type="button" className="club-knop club-knop--stil" onClick={() => setKant(kant === 'environment' ? 'user' : 'environment')}>
          <RefreshCcw aria-hidden size={16} /> {t.ander}
        </button>
        <button type="button" className="club-knop club-knop--stil" onClick={() => setOpen(false)}>
          <X aria-hidden size={16} /> {t.uit}
        </button>
      </div>
    </div>
  )
}
