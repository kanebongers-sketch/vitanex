import { useCallback, useEffect, useState } from 'react'

// Rust-afteltimer voor tussen de sets: start bij het afvinken van een set, telt af
// en geeft een korte piep + trilling als de rust om is. Los gehouden van de pagina
// zodat de logger niet verder uitdijt.

function piepEnTril(): void {
  try {
    navigator.vibrate?.([180, 80, 180])
  } catch {
    /* trillen niet ondersteund — geen probleem */
  }
  try {
    const metWebkit = window as unknown as { webkitAudioContext?: typeof AudioContext }
    const AudioCtx = window.AudioContext ?? metWebkit.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.14, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.18)
    window.setTimeout(() => { void ctx.close() }, 300)
  } catch {
    /* geen audio — stil doorgaan */
  }
}

export interface RustTimer {
  rustSec: number
  totaal: number
  actief: boolean
  start: (sec: number) => void
  slaOver: () => void
  verleng: (sec: number) => void
}

export function useRustTimer(): RustTimer {
  const [rustSec, setRustSec] = useState(0)
  const [totaal, setTotaal] = useState(0)

  // Eén setTimeout per seconde. De piep vuurt in de timeout-callback (niet in een
  // state-updater), zodat hij precies één keer klinkt — ook onder React strict mode.
  useEffect(() => {
    if (rustSec <= 0) return
    if (rustSec === 1) {
      const t = window.setTimeout(() => { setRustSec(0); piepEnTril() }, 1000)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setRustSec((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [rustSec])

  const start = useCallback((sec: number) => {
    const s = Number.isFinite(sec) && sec > 0 ? Math.round(sec) : 90
    setTotaal(s)
    setRustSec(s)
  }, [])

  const slaOver = useCallback(() => setRustSec(0), [])

  const verleng = useCallback((sec: number) => {
    setRustSec((s) => Math.max(0, s + sec))
    setTotaal((t) => t + sec)
  }, [])

  return { rustSec, totaal, actief: rustSec > 0, start, slaOver, verleng }
}
