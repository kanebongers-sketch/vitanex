'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import { bruikbaarAccent, huisstijlVariabelen, MIN_CONTRAST_VLAK, type Thema } from '@/lib/club/kern/huisstijl'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL_DEMO } from '@/lib/aiyourgym/taal/woorden/website/mockups/interactief'
import { STALEN } from './stalen'

// Probeer het zelf: kies een kleur en een thema, en de ledenapp kleurt mee.
// Dezelfde rekenregels als in Club (huisstijlVariabelen): een kleur met te weinig
// contrast schuift automatisch bij, zodat alles leesbaar blijft. Teksten en
// kleurnamen in de taal van de pagina (woordenboek HUISSTIJL_DEMO).

interface Props {
  /** De telefoon met de ledenapp, door de server getekend. */
  children: ReactNode
}

export function HuisstijlDemo({ children }: Props) {
  const t = useTekst(HUISSTIJL_DEMO)
  const [kleur, setKleur] = useState<string>(STALEN[0].hex)
  const [thema, setThema] = useState<Thema>('donker')
  const variabelen = huisstijlVariabelen(kleur, thema) as CSSProperties
  const aangepast = bruikbaarAccent(kleur, thema, MIN_CONTRAST_VLAK).aangepast
  const kleurNaam = (i: number) => t.stalen[i] ?? STALEN[i]?.naam ?? kleur
  const index = STALEN.findIndex((s) => s.hex === kleur)
  const naam = index < 0 ? kleur : kleurNaam(index)

  return (
    <div className="ayg-huisstijl">
      <div className="aygm-kiezer">
        <fieldset className="ayg-veldset">
          <legend className="ayg-label">{t.kiesKleur}</legend>
          <div className="aygm-stalen">
            {STALEN.map((s, i) => (
              <button
                key={s.hex}
                type="button"
                className="aygm-staal"
                style={{ background: s.hex }}
                aria-pressed={kleur === s.hex}
                aria-label={kleurNaam(i)}
                onClick={() => setKleur(s.hex)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="ayg-veldset">
          <legend className="ayg-label">{t.thema}</legend>
          <div className="aygm-wissel">
            {(['donker', 'licht'] as const).map((th) => (
              <button key={th} type="button" aria-pressed={thema === th} onClick={() => setThema(th)}>
                {th === 'donker' ? t.donker : t.licht}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="aygm-melding" aria-live="polite">
          {aangepast
            ? t.aangepast(naam)
            : t.goed(naam, thema === 'donker' ? t.donkerKlein : t.lichtKlein)}
        </p>
      </div>
      <div className="aygm ayg-huisstijl-toestel" style={{ ...variabelen, color: 'var(--text-1)' }}>
        {children}
      </div>
    </div>
  )
}
