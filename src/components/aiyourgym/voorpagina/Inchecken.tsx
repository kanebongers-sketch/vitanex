'use client'

import { useState } from 'react'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'

// Hoofdstuk 2 (racegroen): het ene levende ding. Een echte schakelaar uit de
// check-in, opgeblazen tot posterformaat en door de rand van het vlak afgesneden.
// Omzetten wisselt het hele vlak van racegroen naar flessengroen en een woord in de
// kop (Binnen / Buiten). Werkt met muis, duim en toetsenbord (role="switch").
// Zonder JavaScript staat hij gewoon op Binnen.

export function Inchecken() {
  const t = VOORPAGINA[useTaal()].inchecken
  const [binnen, setBinnen] = useState(true)
  return (
    <section className="vp-inchecken" data-binnen={binnen ? '' : undefined} aria-labelledby="vp-inchecken-titel">
      <div className="vp-inchecken-tekst vp-onthul">
        <h2 id="vp-inchecken-titel" className="vp-h2">
          <span className="vp-wissel" aria-live="polite">
            {binnen ? t.titelVoor : t.titelUit}
          </span>{' '}
          {t.titelNa}
        </h2>
        <p>{t.tekst}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={binnen}
        aria-label={t.schakelaar}
        className="vp-schakelaar"
        data-ui
        onClick={() => setBinnen((b) => !b)}
      >
        <span className="vp-schakelaar-woord">{binnen ? t.binnen : t.buiten}</span>
        <span className="vp-schakelaar-tijd">{binnen ? t.tijd : t.tijdUit}</span>
        <span className="vp-schakelaar-duim" aria-hidden />
      </button>
    </section>
  )
}
