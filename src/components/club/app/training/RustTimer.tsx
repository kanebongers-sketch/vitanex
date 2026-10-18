'use client'

import { useEffect } from 'react'
import { SkipForward } from 'lucide-react'
import { toonKlok } from '@/lib/club/app/sets'
import { rustOver, type RustStaat } from '@/lib/club/app/training-sessie'

interface RustTimerProps {
  rust: RustStaat
  /** Nu, in ms (de training tikt elke kwart seconde, en meteen bij terugkomen in de app). */
  nu: number
  onVerleng: (sec: number) => void
  onStop: () => void
}

/** De rust onderin: groot de tijd die over is, min of plus 15 seconden, of overslaan. Telt vanaf de starttijd. */
export function RustTimer({ rust, nu, onVerleng, onStop }: RustTimerProps) {
  const over = rustOver(rust, nu)
  const klaar = over <= 0

  useEffect(() => {
    if (!klaar) return
    const id = window.setTimeout(onStop, 5000)
    return () => window.clearTimeout(id)
  }, [klaar, onStop])

  const deel = rust.sec > 0 ? Math.min(1, over / rust.sec) : 0
  return (
    <div className="club-tm-rust" data-klaar={klaar || undefined} role="timer" aria-live={klaar ? 'assertive' : 'off'} aria-label="Rust">
      <span className="club-tm-rust-balk" style={{ transform: `scaleX(${deel})` }} aria-hidden />
      <p className="club-tm-rust-tekst">
        <span>{klaar ? 'Ga maar' : 'Rust'}</span>
        <strong>{klaar ? '0:00' : toonKlok(over)}</strong>
        {rust.volgende && <small>{klaar ? 'Nu ' : 'Daarna '}{rust.volgende}</small>}
      </p>
      {!klaar && (
        <span className="club-tm-rust-knoppen">
          <button type="button" className="club-tm-rust-knop" onClick={() => onVerleng(-15)} aria-label="15 seconden korter rusten">
            −15
          </button>
          <button type="button" className="club-tm-rust-knop" onClick={() => onVerleng(15)} aria-label="15 seconden langer rusten">
            +15
          </button>
        </span>
      )}
      <button type="button" className="club-tm-rust-knop club-tm-rust-knop--door" onClick={onStop} aria-label={klaar ? 'Sluiten' : 'Rust overslaan'}>
        <SkipForward aria-hidden size={18} />
      </button>
    </div>
  )
}
