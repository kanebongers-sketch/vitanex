'use client'

import { useState, useSyncExternalStore } from 'react'
import { SquarePlus, X } from 'lucide-react'

// "Zet op je beginscherm" — een korte, wegklikbare tip op het overzicht van de
// PT'er. Alleen op een telefoon/tablet, niet als het dashboard al als app open
// staat, en niet meer na wegklikken (onthouden in localStorage, best-effort).
// Het manifest zelf staat in src/app/[pt]/manifest.webmanifest/route.ts.

const SLEUTEL = 'ptd-beginscherm-hint-weg'

type Toestel = 'verborgen' | 'ios' | 'android'

function weggeklikt(): boolean {
  try {
    return window.localStorage.getItem(SLEUTEL) === '1'
  } catch {
    return false
  }
}

function alsApp(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

function leesToestel(): Toestel {
  if (alsApp() || weggeklikt() || !window.matchMedia('(pointer: coarse)').matches) return 'verborgen'
  // iPadOS meldt zich als Mac; met touch is het een iPad.
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  return ios ? 'ios' : 'android'
}

function luister(opnieuw: () => void): () => void {
  const mq = window.matchMedia('(display-mode: standalone)')
  mq.addEventListener('change', opnieuw)
  window.addEventListener('storage', opnieuw)
  return () => {
    mq.removeEventListener('change', opnieuw)
    window.removeEventListener('storage', opnieuw)
  }
}

const UITLEG: Record<Exclude<Toestel, 'verborgen'>, string> = {
  ios: 'Tik in Safari op het deel-icoon en kies “Zet op beginscherm”. Dan open je je dashboard voortaan met één tik.',
  android: 'Open het menu van je browser (⋮) en kies “Toevoegen aan startscherm”. Dan open je je dashboard voortaan met één tik.',
}

export function BeginschermHint() {
  const toestel = useSyncExternalStore(luister, leesToestel, (): Toestel => 'verborgen')
  const [weg, setWeg] = useState(false)
  if (toestel === 'verborgen' || weg) return null

  function sluit(): void {
    setWeg(true)
    try {
      window.localStorage.setItem(SLEUTEL, '1')
    } catch {
      // Opslag geblokkeerd (privévenster): dan alleen voor nu weg.
    }
  }

  return (
    <aside
      className="ptd-kaart"
      aria-labelledby="beginscherm-kop"
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px' }}
    >
      <SquarePlus size={20} aria-hidden="true" style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ display: 'grid', gap: 4, flex: 1 }}>
        <h2 id="beginscherm-kop" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>
          Zet op je beginscherm
        </h2>
        <p className="ptd-hint">{UITLEG[toestel]}</p>
      </div>
      <button type="button" className="ptd-knop ptd-knop--klein" onClick={sluit} aria-label="Tip sluiten">
        <X size={15} aria-hidden="true" />
      </button>
    </aside>
  )
}
