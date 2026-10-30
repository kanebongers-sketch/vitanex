'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, SwitchCamera } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PROFIELFOTO } from '@/lib/aiyourgym/taal/woorden/club/profielfoto'

// Een profielfoto maken met de webcam of de camera van telefoon en tablet,
// in de pagina zelf (getUserMedia). Het beeld blijft in de browser: de foto
// gaat daarna door hetzelfde bijsnijden als een gekozen bestand. De camera
// gaat uit zodra de foto genomen is, bij Annuleren en bij weggaan.

type Stand = 'starten' | 'aan' | 'geweigerd' | 'geen_camera'
type Kant = 'user' | 'environment'

interface WebcamOpnameProps {
  onFoto: (foto: Blob) => void
  onStop: () => void
  /** Geen camera of geweigerd: dan een bestand kiezen. */
  onKiesBestand: () => void
}

export function webcamMogelijk(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
}

function standVanFout(fout: unknown): Stand {
  const naam = fout instanceof DOMException ? fout.name : ''
  return naam === 'NotAllowedError' || naam === 'SecurityError' ? 'geweigerd' : 'geen_camera'
}

export function WebcamOpname({ onFoto, onStop, onKiesBestand }: WebcamOpnameProps) {
  const t = useTekst(PROFIELFOTO)
  const video = useRef<HTMLVideoElement>(null)
  const stroom = useRef<MediaStream | null>(null)
  const [stand, setStand] = useState<Stand>('starten')
  const [kant, setKant] = useState<Kant>('user')
  const [meerCameras, setMeerCameras] = useState(false)

  useEffect(() => {
    let weg = false
    async function start() {
      setStand('starten')
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: kant }, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        })
        if (weg) return s.getTracks().forEach((spoor) => spoor.stop())
        stroom.current = s
        if (video.current) {
          video.current.srcObject = s
          await video.current.play().catch(() => undefined)
        }
        setStand('aan')
        const apparaten = await navigator.mediaDevices.enumerateDevices().catch(() => [])
        if (!weg) setMeerCameras(apparaten.filter((a) => a.kind === 'videoinput').length > 1)
      } catch (fout) {
        if (!weg) setStand(standVanFout(fout))
      }
    }
    void start()
    return () => {
      weg = true
      stroom.current?.getTracks().forEach((spoor) => spoor.stop())
      stroom.current = null
    }
  }, [kant])

  function neem() {
    const v = video.current
    if (!v || stand !== 'aan' || !v.videoWidth) return
    const doek = document.createElement('canvas')
    doek.width = v.videoWidth
    doek.height = v.videoHeight
    const ctx = doek.getContext('2d')
    if (!ctx) return
    // De voorcamera toont een spiegelbeeld; de foto wordt precies wat je zag.
    if (kant === 'user') {
      ctx.translate(doek.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, 0, 0)
    doek.toBlob((blob) => {
      if (!blob) return
      stroom.current?.getTracks().forEach((spoor) => spoor.stop())
      stroom.current = null
      onFoto(blob)
    }, 'image/jpeg', 0.92)
  }

  const fout = stand === 'geweigerd' ? t.webcam.geweigerd : stand === 'geen_camera' ? t.webcam.geenCamera : null
  return (
    <div className="club-fotokiezer-snij">
      {fout ? (
        <p className="club-fotokiezer-melding" data-soort="fout" role="alert">{fout}</p>
      ) : (
        <div className="club-fotokiezer-venster club-fotokiezer-venster--webcam" data-kant={kant} aria-busy={stand === 'starten'}>
          <video ref={video} playsInline muted aria-label={t.webcam.beeld} />
          {stand === 'starten' ? <span className="club-fotokiezer-webcam-start">{t.webcam.starten}</span> : null}
        </div>
      )}
      {fout ? null : <p className="club-fotokiezer-uitleg">{t.webcam.uitleg}</p>}
      <div className="club-fotokiezer-knoppen">
        {fout ? (
          <button type="button" className="club-knop club-knop--primair" onClick={onKiesBestand}>
            <ImagePlus aria-hidden size={16} /> {t.kiezen}
          </button>
        ) : (
          <button type="button" className="club-knop club-knop--primair" onClick={neem} disabled={stand !== 'aan'}>
            <Camera aria-hidden size={16} /> {t.webcam.nemen}
          </button>
        )}
        {meerCameras && !fout ? (
          <button type="button" className="club-knop club-knop--stil" onClick={() => setKant((k) => (k === 'user' ? 'environment' : 'user'))}>
            <SwitchCamera aria-hidden size={16} /> {t.webcam.wissel}
          </button>
        ) : null}
        <button type="button" className="club-knop club-knop--stil" onClick={onStop}>
          {t.annuleren}
        </button>
      </div>
    </div>
  )
}
