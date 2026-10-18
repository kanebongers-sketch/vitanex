'use client'

import { useEffect, useState } from 'react'
import { Plus, SkipForward, Timer } from 'lucide-react'
import { toonKlok } from '@/lib/club/app/sets'

export interface Rust {
  /** Tijdstip (ms) waarop de rust voorbij is. */
  einde: number
  totaal: number
  /** Wat er na de rust komt, bijvoorbeeld "Set 3 van Back squat". */
  volgende: string | null
}

interface RustTimerProps {
  rust: Rust
  onVerleng: (sec: number) => void
  onStop: () => void
}

/** Telt de rust af onderin beeld. Trilt kort als de rust voorbij is (als de telefoon dat kan). */
export function RustTimer({ rust, onVerleng, onStop }: RustTimerProps) {
  const [nu, setNu] = useState(() => Date.now())
  const over = Math.max(0, (rust.einde - nu) / 1000)
  const klaar = over <= 0

  useEffect(() => {
    const id = window.setInterval(() => setNu(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!klaar) return
    try {
      navigator.vibrate?.([120, 80, 120])
    } catch {
      // Trillen is een extraatje; zonder gaat het ook.
    }
    const id = window.setTimeout(onStop, 4000)
    return () => window.clearTimeout(id)
  }, [klaar, onStop])

  const deel = rust.totaal > 0 ? Math.min(1, over / rust.totaal) : 0
  return (
    <div className="club-lidapp-rust" data-klaar={klaar || undefined} role="timer" aria-live={klaar ? 'assertive' : 'off'}>
      <span className="club-lidapp-rust-balk" style={{ transform: `scaleX(${deel})` }} aria-hidden />
      <Timer aria-hidden size={20} />
      <span className="club-lidapp-rust-tekst">
        <strong>{klaar ? 'Ga maar' : toonKlok(over)}</strong>
        <span>{klaar ? rust.volgende ?? 'Volgende set' : `Rust${rust.volgende ? `, daarna ${rust.volgende}` : ''}`}</span>
      </span>
      {!klaar && (
        <button type="button" className="club-lidapp-rust-knop" onClick={() => onVerleng(15)} aria-label="15 seconden langer rusten">
          <Plus aria-hidden size={14} />15
        </button>
      )}
      <button type="button" className="club-lidapp-rust-knop" onClick={onStop} aria-label={klaar ? 'Sluiten' : 'Rust overslaan'}>
        <SkipForward aria-hidden size={16} />
      </button>
    </div>
  )
}
