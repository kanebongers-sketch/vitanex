'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { GROEP_DEFS, type Groep } from '@/lib/lifeos/crm/crm'
import { GroepBord } from './GroepBord'

// Het top-level mensen-bord: drie groepen als tabs (PT-klanten, Team Budel,
// PT-team), elk een eigen kanban. De tabs komen UIT `GROEP_DEFS` — nooit
// hardgecodeerd. Volgt de WAI-ARIA tabs-pattern (pijltjes verplaatsen focus +
// activeren; alleen de actieve tab zit in de tab-volgorde).
//
// Dit is het component dat de hoofdagent op een route hangt. Het mount niets zelf.

export function MensenBord() {
  const [actief, setActief] = useState<Groep>(GROEP_DEFS[0].key)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const actiefDef = GROEP_DEFS.find((g) => g.key === actief) ?? GROEP_DEFS[0]

  function opTabToets(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const laatste = GROEP_DEFS.length - 1
    let doel = index
    if (e.key === 'ArrowRight') doel = index === laatste ? 0 : index + 1
    else if (e.key === 'ArrowLeft') doel = index === 0 ? laatste : index - 1
    else if (e.key === 'Home') doel = 0
    else if (e.key === 'End') doel = laatste
    else return

    e.preventDefault()
    const groep = GROEP_DEFS[doel].key
    setActief(groep)
    tabRefs.current[groep]?.focus()
  }

  return (
    <div className="os-crm">
      <div className="os-crm__tablijst" role="tablist" aria-label="Groepen mensen">
        {GROEP_DEFS.map((g, i) => {
          const isActief = g.key === actief
          return (
            <button
              key={g.key}
              type="button"
              role="tab"
              id={`os-crm-tab-${g.key}`}
              aria-selected={isActief}
              aria-controls={`os-crm-paneel-${g.key}`}
              tabIndex={isActief ? 0 : -1}
              ref={(el) => {
                tabRefs.current[g.key] = el
              }}
              className={`os-crm__tab${isActief ? ' os-crm__tab--actief' : ''}`}
              onClick={() => setActief(g.key)}
              onKeyDown={(e) => opTabToets(e, i)}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      <p className="os-crm__omschrijving">{actiefDef.omschrijving}</p>

      <div
        role="tabpanel"
        id={`os-crm-paneel-${actief}`}
        aria-labelledby={`os-crm-tab-${actief}`}
        tabIndex={0}
      >
        {/* key op de groep: van tab wisselen remount het bord met verse data. */}
        <GroepBord key={actief} groep={actief} />
      </div>
    </div>
  )
}
