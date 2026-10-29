'use client'

import { MODULES, moduleTekst, type Module } from '@/lib/club/kern/organisatie'
import { ALLE_PAKKETTEN, moduleAfgenomen, type PakketSleutel } from '@/lib/club/kern/pakketten'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'

// Onderdelen aan of uit. Een sportschool zonder groepslessen zet Groepslessen
// uit: het verdwijnt uit het menu en de pagina's bestaan voor hen niet.
// Alleen onderdelen van afgenomen pakketten staan hier (kern/pakketten.ts):
// wat niet is afgenomen, kan een sportschool ook niet aanzetten.

interface ModulesBlokProps {
  /** De eigen keuze (organisatie.eigenUit). */
  uit: Module[]
  onWijzig: (uit: Module[]) => void
  /** De afgenomen pakketten; zonder: alles. */
  afgenomen?: readonly PakketSleutel[]
}

export function ModulesBlok({ uit, onWijzig, afgenomen = ALLE_PAKKETTEN }: ModulesBlokProps) {
  const lijst = MODULES.filter((m) => moduleAfgenomen(afgenomen, m))
  const aanTal = lijst.filter((m) => !uit.includes(m)).length
  const taal = useTaal()
  const t = useTekst(HUISSTIJL).modules
  function wissel(m: Module) {
    if (uit.includes(m)) return onWijzig(uit.filter((x) => x !== m))
    if (aanTal <= 1) return
    onWijzig([...uit, m])
  }
  return (
    <section className="club-huisstijl-blok" aria-labelledby="modules-kop">
      <h2 id="modules-kop" className="club-huisstijl-kop">{t.kop}</h2>
      <p className="club-hint">{t.uitleg}</p>
      <ul className="club-huisstijl-modules">
        {lijst.map((m) => {
          const aan = !uit.includes(m)
          const info = moduleTekst(m, taal)
          return (
            <li key={m}>
              <label className="club-huisstijl-module">
                <span className="club-huisstijl-moduletekst">
                  <strong>{info.label}</strong>
                  <span>{info.uitleg}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  className="club-huisstijl-schakelaar"
                  checked={aan}
                  disabled={aan && aanTal <= 1}
                  onChange={() => wissel(m)}
                />
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
