'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import { bruikbaarAccent, huisstijlVariabelen, MIN_CONTRAST_VLAK, type Thema } from '@/lib/club/kern/huisstijl'
import { STALEN } from './stalen'

// Probeer het zelf: kies een kleur en een thema, en de ledenapp kleurt mee.
// Dezelfde rekenregels als in Club (huisstijlVariabelen): een kleur met te weinig
// contrast schuift automatisch bij, zodat alles leesbaar blijft.

interface Props {
  /** De telefoon met de ledenapp, door de server getekend. */
  children: ReactNode
}

export function HuisstijlDemo({ children }: Props) {
  const [kleur, setKleur] = useState<string>(STALEN[0].hex)
  const [thema, setThema] = useState<Thema>('donker')
  const variabelen = huisstijlVariabelen(kleur, thema) as CSSProperties
  const aangepast = bruikbaarAccent(kleur, thema, MIN_CONTRAST_VLAK).aangepast
  const naam = STALEN.find((s) => s.hex === kleur)?.naam ?? kleur

  return (
    <div className="ayg-huisstijl">
      <div className="aygm-kiezer">
        <fieldset className="ayg-veldset">
          <legend className="ayg-label">Kies een kleur</legend>
          <div className="aygm-stalen">
            {STALEN.map((s) => (
              <button
                key={s.hex}
                type="button"
                className="aygm-staal"
                style={{ background: s.hex }}
                aria-pressed={kleur === s.hex}
                aria-label={s.naam}
                onClick={() => setKleur(s.hex)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="ayg-veldset">
          <legend className="ayg-label">Thema</legend>
          <div className="aygm-wissel">
            {(['donker', 'licht'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={thema === t} onClick={() => setThema(t)}>
                {t === 'donker' ? 'Donker' : 'Licht'}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="aygm-melding" aria-live="polite">
          {aangepast
            ? `${naam} is iets bijgesteld, zodat knoppen en tekst goed leesbaar blijven.`
            : `${naam} op ${thema === 'donker' ? 'donker' : 'licht'}: genoeg contrast, zo overgenomen.`}
        </p>
      </div>
      <div className="aygm ayg-huisstijl-toestel" style={{ ...variabelen, color: 'var(--text-1)' }}>
        {children}
      </div>
    </div>
  )
}
