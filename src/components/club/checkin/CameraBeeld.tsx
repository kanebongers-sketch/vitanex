'use client'

import type { RefObject } from 'react'
import { CameraOff } from 'lucide-react'
import type { CameraStand } from './useQrCamera'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'

// Het camerabeeld met een richtkader, of een melding als de camera niet kan.
// Gedeeld door de balie en het kioskscherm (dat het beeld groot en gespiegeld toont).

interface Props {
  video: RefObject<HTMLVideoElement | null>
  stand: CameraStand
  /** Voorcamera spiegelen, zodat het lid zichzelf natuurlijk ziet. */
  gespiegeld?: boolean
  className?: string
  label: string
}

export function CameraBeeld({ video, stand, gespiegeld = false, className = '', label }: Props) {
  const t = useTekst(CHECKIN).camera
  const meldingen: Partial<Record<CameraStand, string>> = { starten: t.starten, niet_ondersteund: t.nietOndersteund, geweigerd: t.geweigerd, geen_camera: t.geenCamera }
  const melding = meldingen[stand]
  const probleem = stand === 'niet_ondersteund' || stand === 'geweigerd' || stand === 'geen_camera'
  return (
    <div className={`club-checkin-camera ${probleem ? 'club-checkin-camera--probleem' : ''} ${className}`.trim()}>
      <video ref={video} muted playsInline aria-label={label} className={gespiegeld ? 'club-checkin-camera-spiegel' : undefined} />
      {stand === 'aan' && <span className="club-checkin-camera-kader" aria-hidden />}
      {melding && (
        <p className="club-checkin-camera-melding" role={probleem ? 'alert' : 'status'}>
          {probleem && <CameraOff aria-hidden size={22} />}
          <span>{melding}</span>
        </p>
      )}
    </div>
  )
}
