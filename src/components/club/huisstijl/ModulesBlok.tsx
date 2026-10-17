'use client'

import { MODULES, MODULE_LABEL, type Module } from '@/lib/club/kern/organisatie'

// Onderdelen aan of uit. Een sportschool zonder groepslessen zet Groepslessen
// uit: het verdwijnt uit het menu en de pagina's bestaan voor hen niet.

interface ModulesBlokProps {
  uit: Module[]
  onWijzig: (uit: Module[]) => void
}

export function ModulesBlok({ uit, onWijzig }: ModulesBlokProps) {
  const aanTal = MODULES.length - uit.length
  function wissel(m: Module) {
    if (uit.includes(m)) return onWijzig(uit.filter((x) => x !== m))
    if (aanTal <= 1) return
    onWijzig([...uit, m])
  }
  return (
    <section className="club-huisstijl-blok" aria-labelledby="modules-kop">
      <h2 id="modules-kop" className="club-huisstijl-kop">Onderdelen</h2>
      <p className="club-hint">Zet uit wat je sportschool niet gebruikt. Vandaag, notities, agenda en instellingen staan altijd aan.</p>
      <ul className="club-huisstijl-modules">
        {MODULES.map((m) => {
          const aan = !uit.includes(m)
          return (
            <li key={m}>
              <label className="club-huisstijl-module">
                <span className="club-huisstijl-moduletekst">
                  <strong>{MODULE_LABEL[m].label}</strong>
                  <span>{MODULE_LABEL[m].uitleg}</span>
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
