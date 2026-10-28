'use client'

import { useState } from 'react'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'

// De ene levende tegel in het product: een echte schakelaar uit de check-in, groot
// en in champagne. Omzetten wisselt het woord in de kop (Binnen / Buiten) en de
// regel eronder. Werkt met muis, duim en toetsenbord (role="switch"). Zonder
// JavaScript staat hij gewoon op Binnen.

export function Inchecken() {
  const t = VOORPAGINA[useTaal()].inchecken
  const [binnen, setBinnen] = useState(true)
  return (
    <div className="vp-tegel vp-tegel-inchecken" data-binnen={binnen ? '' : undefined}>
      <div className="vp-inchecken-tekst">
        <h3 className="vp-tegel-kop">
          <em className="vp-wissel" aria-live="polite">
            {binnen ? t.titelVoor : t.titelUit}
          </em>{' '}
          {t.titelNa}
        </h3>
        <p>{t.tekst}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={binnen}
        aria-label={t.schakelaar}
        className="vp-schakelaar"
        onClick={() => setBinnen((b) => !b)}
      >
        <span className="vp-schakelaar-duim" aria-hidden />
      </button>
      <p className="vp-schakelaar-tijd" aria-hidden>
        {binnen ? t.tijd : t.tijdUit}
      </p>
    </div>
  )
}
