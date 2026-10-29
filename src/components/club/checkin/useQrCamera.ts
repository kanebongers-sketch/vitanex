'use client'

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react'

// Leest QR-codes met de camera van tablet of telefoon via de ingebouwde
// BarcodeDetector van de browser (Chrome en Edge op Android, ChromeOS, Windows
// en macOS). Geen extra bibliotheek. Zonder BarcodeDetector (onder meer Safari
// op iPhone en iPad): stand 'niet_ondersteund', de balie zoekt dan op naam of
// gebruikt een scanner die als toetsenbord typt.
// Dezelfde code binnen een paar seconden telt een keer: de camera ziet hem
// tientallen keren per seconde.

interface GedetecteerdeCode {
  rawValue: string
}

interface BarcodeDetectorLike {
  detect(bron: CanvasImageSource): Promise<GedetecteerdeCode[]>
}

interface BarcodeDetectorKlasse {
  new (opties: { formats: string[] }): BarcodeDetectorLike
  getSupportedFormats?: () => Promise<string[]>
}

export type CameraStand = 'uit' | 'starten' | 'aan' | 'niet_ondersteund' | 'geweigerd' | 'geen_camera'

const SCAN_MS = 220
const ZELFDE_CODE_MS = 4000

function detectorKlasse(): BarcodeDetectorKlasse | null {
  const kandidaat: unknown = Reflect.get(globalThis, 'BarcodeDetector')
  return typeof kandidaat === 'function' ? (kandidaat as BarcodeDetectorKlasse) : null
}

async function maakDetector(): Promise<BarcodeDetectorLike | null> {
  const Klasse = detectorKlasse()
  if (!Klasse) return null
  try {
    const formaten = Klasse.getSupportedFormats ? await Klasse.getSupportedFormats() : ['qr_code']
    return formaten.includes('qr_code') ? new Klasse({ formats: ['qr_code'] }) : null
  } catch {
    return null
  }
}

function standUitFout(e: unknown): CameraStand {
  const naam = e instanceof DOMException ? e.name : ''
  if (naam === 'NotAllowedError' || naam === 'SecurityError') return 'geweigerd'
  return 'geen_camera'
}

interface Opties {
  /** Camera aan of uit. */
  actief: boolean
  /** 'environment' = achtercamera (balie), 'user' = voorcamera (kiosk). */
  kant: 'environment' | 'user'
  /** Even niet scannen (bijvoorbeeld terwijl een uitkomst in beeld staat). */
  pauze?: boolean
  onCode: (code: string) => void
}

export function useQrCamera({ actief, kant, pauze = false, onCode }: Opties): { video: RefObject<HTMLVideoElement | null>; stand: CameraStand } {
  const video = useRef<HTMLVideoElement>(null)
  const pauzeRef = useRef(pauze)
  const [stand, setStand] = useState<CameraStand>('uit')
  const gevonden = useEffectEvent((code: string) => onCode(code))

  useEffect(() => {
    pauzeRef.current = pauze
  }, [pauze])

  useEffect(() => {
    if (!actief) return
    let weg = false
    let stroom: MediaStream | null = null
    let gekoppeld: HTMLVideoElement | null = null
    let klok: number | undefined
    let laatste = { code: '', op: 0 }

    async function scan(detector: BarcodeDetectorLike) {
      const v = video.current
      if (weg || !v) return
      if (!pauzeRef.current && v.readyState >= 2) {
        try {
          const codes = await detector.detect(v)
          const code = codes[0]?.rawValue?.trim()
          const nu = Date.now()
          if (code && !(code === laatste.code && nu - laatste.op < ZELFDE_CODE_MS)) {
            laatste = { code, op: nu }
            gevonden(code)
          }
        } catch {
          // Een enkel beeld dat niet te lezen is: gewoon het volgende proberen.
        }
      }
      if (!weg) klok = window.setTimeout(() => void scan(detector), SCAN_MS)
    }

    async function start() {
      setStand('starten')
      const detector = await maakDetector()
      if (weg) return
      if (!detector) return setStand('niet_ondersteund')
      if (!navigator.mediaDevices?.getUserMedia) return setStand('geen_camera')
      try {
        stroom = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: kant }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      } catch (e) {
        if (!weg) setStand(standUitFout(e))
        return
      }
      const v = video.current
      if (weg || !v) {
        stroom.getTracks().forEach((t) => t.stop())
        return
      }
      v.srcObject = stroom
      gekoppeld = v
      await v.play().catch(() => undefined)
      setStand('aan')
      void scan(detector)
    }

    void start()
    return () => {
      weg = true
      window.clearTimeout(klok)
      stroom?.getTracks().forEach((t) => t.stop())
      if (gekoppeld) gekoppeld.srcObject = null
    }
  }, [actief, kant])

  return { video, stand: actief ? stand : 'uit' }
}
