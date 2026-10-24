'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { toonKlok } from '@/lib/club/app/sets'

// Na de set: "Set klaar", de rust uit het schema die meteen aftelt, en (in de
// training) een knop om de set vast te leggen. Vastleggen geeft het moment
// door waarop de set klaar was: de rust onderin de training telt dan gewoon
// verder vanaf dat moment, er komt geen tweede rust bij.

interface RepNaSetProps {
  klaarOp: number
  rustSec: number | null
  setNr: number | null
  onVastleggen?: () => void
}

export function RepNaSet({ klaarOp, rustSec, setNr, onVastleggen }: RepNaSetProps) {
  const [nu, setNu] = useState(() => Date.now())
  const rust = rustSec && rustSec > 0 ? rustSec : 0
  const over = Math.max(0, rust - (nu - klaarOp) / 1000)

  useEffect(() => {
    if (rust <= 0) return
    const id = window.setInterval(() => setNu(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [rust])

  return (
    <section className="club-rep-na" aria-label="Set klaar">
      <span className="club-rep-na-vink" aria-hidden>
        <Check size={20} strokeWidth={3} />
      </span>
      <div className="club-rep-na-tekst">
        <strong>Set klaar</strong>
        {rust > 0 && (
          <span role="timer" aria-live={over <= 0 ? 'polite' : 'off'}>
            {over > 0 ? <>Rust <b>{toonKlok(over)}</b></> : 'Rust is om, ga maar'}
          </span>
        )}
      </div>
      {onVastleggen && (
        <button type="button" className="club-rep-hoofdknop club-rep-na-knop" onClick={onVastleggen}>
          <Check aria-hidden size={18} strokeWidth={3} />
          {setNr ? `Set ${setNr} vastleggen` : 'Set vastleggen'}
        </button>
      )}
    </section>
  )
}
