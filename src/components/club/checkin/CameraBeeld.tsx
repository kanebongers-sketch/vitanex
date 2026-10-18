'use client'

import type { RefObject } from 'react'
import { CameraOff } from 'lucide-react'
import { CAMERA_MELDING, type CameraStand } from './useQrCamera'

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
  const melding = CAMERA_MELDING[stand]
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
