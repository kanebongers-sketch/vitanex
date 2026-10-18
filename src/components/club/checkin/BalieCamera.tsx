'use client'

import { useState } from 'react'
import { Camera, RefreshCcw, X } from 'lucide-react'
import { CameraBeeld } from './CameraBeeld'
import { useQrCamera } from './useQrCamera'

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
  const { video, stand } = useQrCamera({ actief: open, kant, pauze, onCode })

  if (!open) {
    return (
      <button type="button" className="club-knop club-knop--stil club-checkin-camera-knop" onClick={() => setOpen(true)}>
        <Camera aria-hidden size={18} /> Scan met camera
      </button>
    )
  }
  return (
    <div className="club-checkin-camera-blok">
      <CameraBeeld video={video} stand={stand} gespiegeld={kant === 'user'} label="Camerabeeld voor het scannen van de QR-code" />
      <div className="club-checkin-camera-knoppen">
        <button type="button" className="club-knop club-knop--stil" onClick={() => setKant(kant === 'environment' ? 'user' : 'environment')}>
          <RefreshCcw aria-hidden size={16} /> Andere camera
        </button>
        <button type="button" className="club-knop club-knop--stil" onClick={() => setOpen(false)}>
          <X aria-hidden size={16} /> Camera uit
        </button>
      </div>
    </div>
  )
}
