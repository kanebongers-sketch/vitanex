'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type TouchEvent } from 'react'

// Wat de telefoon kan tijdens een training, steeds met een nette terugval:
// het scherm aan houden (Wake Lock), weten of er bereik is, trillen of een
// piep aan het einde van de rust (alleen als het lid dat aanzet) en vegen naar
// de volgende oefening. Niets hiervan is nodig om te kunnen trainen.

export type SchermStatus = 'aan' | 'niet-ondersteund' | 'geweigerd'

/** Houdt het scherm aan zolang de training open is; vraagt opnieuw na terugkomen in de app. */
export function useSchermAan(): SchermStatus {
  const [status, setStatus] = useState<SchermStatus>(() => (typeof navigator !== 'undefined' && 'wakeLock' in navigator ? 'aan' : 'niet-ondersteund'))

  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let slot: WakeLockSentinel | null = null
    let weg = false
    async function vraag() {
      if (document.visibilityState !== 'visible' || (slot && !slot.released)) return
      try {
        const nieuw = await navigator.wakeLock.request('screen')
        if (weg) await nieuw.release()
        else {
          slot = nieuw
          setStatus('aan')
        }
      } catch {
        // Bijvoorbeeld de batterijbesparing: dan gaat het scherm vanzelf uit, de rust telt gewoon door.
        if (!weg) setStatus('geweigerd')
      }
    }
    const zichtbaar = () => void vraag()
    void vraag()
    document.addEventListener('visibilitychange', zichtbaar)
    return () => {
      weg = true
      document.removeEventListener('visibilitychange', zichtbaar)
      slot?.release().catch(() => undefined)
    }
  }, [])

  return status
}

function abonneerOnline(melden: () => void): () => void {
  window.addEventListener('online', melden)
  window.addEventListener('offline', melden)
  return () => {
    window.removeEventListener('online', melden)
    window.removeEventListener('offline', melden)
  }
}

/** Heeft het toestel volgens de browser verbinding. Op de server: ja. */
export function useOnline(): boolean {
  return useSyncExternalStore(abonneerOnline, () => navigator.onLine, () => true)
}

export interface SignaalKeuze {
  trillen: boolean
  geluid: boolean
}

export interface Signaal {
  keuze: SignaalKeuze
  kanTrillen: boolean
  kanGeluid: boolean
  zet: (deel: Partial<SignaalKeuze>) => void
  /** Aanroepen bij een tik (set klaar): telefoons laten pas geluid toe na een aanraking. */
  ontgrendel: () => void
  /** Het signaal aan het einde van de rust, alleen wat het lid aanzette en het toestel kan. */
  geef: () => void
}

const SIGNAAL_SLEUTEL = 'club-training-signaal'

type AudioMaker = typeof AudioContext

function audioMaker(): AudioMaker | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: AudioMaker; webkitAudioContext?: AudioMaker }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

function leesKeuze(): SignaalKeuze {
  try {
    const r: unknown = JSON.parse(window.localStorage.getItem(SIGNAAL_SLEUTEL) ?? 'null')
    if (typeof r === 'object' && r !== null) {
      const k = r as Record<string, unknown>
      return { trillen: k.trillen === true, geluid: k.geluid === true }
    }
  } catch {
    // Geen opslag: alles uit, zoals de standaard.
  }
  return { trillen: false, geluid: false }
}

function piep(ctx: AudioContext) {
  const t = ctx.currentTime
  for (const [i, toon] of [880, 1175].entries()) {
    const osc = ctx.createOscillator()
    const vol = ctx.createGain()
    osc.frequency.value = toon
    vol.gain.setValueAtTime(0.0001, t + i * 0.2)
    vol.gain.exponentialRampToValueAtTime(0.25, t + i * 0.2 + 0.02)
    vol.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.2 + 0.18)
    osc.connect(vol).connect(ctx.destination)
    osc.start(t + i * 0.2)
    osc.stop(t + i * 0.2 + 0.2)
  }
}

/** Trillen en geluid aan het einde van de rust. Standaard uit; het lid zet het zelf aan. */
export function useSignaal(): Signaal {
  const [keuze, setKeuze] = useState<SignaalKeuze>(() => (typeof window === 'undefined' ? { trillen: false, geluid: false } : leesKeuze()))
  const ctx = useRef<AudioContext | null>(null)
  const kanTrillen = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  const kanGeluid = audioMaker() !== null

  const ontgrendel = useCallback(() => {
    const Maker = audioMaker()
    if (!keuze.geluid || !Maker) return
    try {
      ctx.current ??= new Maker()
      if (ctx.current.state === 'suspended') void ctx.current.resume()
    } catch {
      ctx.current = null
    }
  }, [keuze.geluid])

  const zet = useCallback((deel: Partial<SignaalKeuze>) => {
    setKeuze((k) => {
      const nieuw = { ...k, ...deel }
      try {
        window.localStorage.setItem(SIGNAAL_SLEUTEL, JSON.stringify(nieuw))
      } catch {
        // Niet bewaard: geldt dan alleen voor deze training.
      }
      return nieuw
    })
    // Aanzetten is zelf een tik: meteen proberen, dan hoort het lid hoe het klinkt.
    if (deel.trillen) navigator.vibrate?.(80)
    const Maker = audioMaker()
    if (deel.geluid && Maker) {
      try {
        ctx.current ??= new Maker()
        void ctx.current.resume().then(() => ctx.current && piep(ctx.current))
      } catch {
        ctx.current = null
      }
    }
  }, [])

  const geef = useCallback(() => {
    try {
      if (keuze.trillen && kanTrillen) navigator.vibrate([200, 100, 200])
      if (keuze.geluid && ctx.current && ctx.current.state === 'running') piep(ctx.current)
    } catch {
      // Een signaal is een extraatje; de timer in beeld zegt het ook.
    }
  }, [keuze, kanTrillen])

  return { keuze, kanTrillen, kanGeluid, zet, ontgrendel, geef }
}

/** Vegen naar links of rechts (horizontaal, duidelijk meer dan verticaal). Niet vanuit een invoerveld. */
export function useVeeg(naarLinks: () => void, naarRechts: () => void) {
  const begin = useRef<{ x: number; y: number } | null>(null)
  return {
    onTouchStart(e: TouchEvent) {
      const doel = e.target as HTMLElement
      const t = e.touches[0]
      begin.current = doel.closest('input, textarea, [data-geen-veeg]') || !t ? null : { x: t.clientX, y: t.clientY }
    },
    onTouchEnd(e: TouchEvent) {
      const b = begin.current
      const t = e.changedTouches[0]
      begin.current = null
      if (!b || !t) return
      const dx = t.clientX - b.x
      const dy = t.clientY - b.y
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return
      if (dx < 0) naarLinks()
      else naarRechts()
    },
  }
}
