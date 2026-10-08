'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import type { PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { voortgang, type Intake } from '@/lib/lifeos/pt-dashboard/intake'
import type { Meting } from '@/lib/lifeos/pt-dashboard/metingen'
import { DossierKop } from './DossierKop'
import { TrajectTijdlijn } from './TrajectTijdlijn'
import { IntakeFormulier } from './IntakeFormulier'
import { MetingenPaneel } from './MetingenPaneel'
import { NotitiesPaneel } from './NotitiesPaneel'
import { DOSSIER_TABS, type DossierTab } from './tabs'

// Container: het dossier van één PT-klant. Kop en traject altijd zichtbaar,
// daaronder tabbladen Intake / Metingen / Notities. Het actieve tabblad staat
// in de URL (?tab=…), zodat terugkomen en delen op dezelfde plek uitkomt. Alle
// panelen blijven gemonteerd (hidden), zodat een half ingevulde intake niet
// verdwijnt als je even naar de metingen kijkt.

const LABEL: Record<DossierTab, string> = { intake: 'Intake', metingen: 'Metingen', notities: 'Notities' }

interface Props {
  code: string
  vandaag: string
  klant: PtKlant
  intake: Intake | null
  metingen: Meting[]
  startTab: DossierTab
  /** Meekijken (eigenaar): het hele dossier zonder bewerken. */
  alleenLezen?: boolean
}

export function Dossier({ code, vandaag, klant: beginKlant, intake: beginIntake, metingen: beginMetingen, startTab, alleenLezen = false }: Props) {
  const [klant, setKlant] = useState(beginKlant)
  const [intake, setIntake] = useState(beginIntake)
  const [metingen, setMetingen] = useState(beginMetingen)
  const [tab, setTab] = useState<DossierTab>(startTab)
  const knoppen = useRef<Partial<Record<DossierTab, HTMLButtonElement | null>>>({})
  const v = voortgang(intake?.antwoorden ?? {})

  function kies(t: DossierTab, focus = false) {
    setTab(t)
    window.history.replaceState(null, '', `?tab=${t}`)
    if (focus) knoppen.current[t]?.focus()
  }

  function toets(e: KeyboardEvent<HTMLDivElement>) {
    const i = DOSSIER_TABS.indexOf(tab)
    const naar =
      e.key === 'ArrowRight' ? DOSSIER_TABS[(i + 1) % DOSSIER_TABS.length]
      : e.key === 'ArrowLeft' ? DOSSIER_TABS[(i + DOSSIER_TABS.length - 1) % DOSSIER_TABS.length]
      : e.key === 'Home' ? DOSSIER_TABS[0]
      : e.key === 'End' ? DOSSIER_TABS[DOSSIER_TABS.length - 1]
      : null
    if (!naar) return
    e.preventDefault()
    kies(naar, true)
  }

  const telling: Record<DossierTab, string> = {
    intake: `${v.beantwoord}/${v.totaal}`,
    metingen: String(metingen.length),
    notities: klant.notitie ? '•' : '',
  }

  return (
    <div className="ptd-sectie ffdos">
      <DossierKop code={code} klant={klant} vandaag={vandaag} />
      <TrajectTijdlijn startdatum={klant.startdatum} vandaag={vandaag} />

      <div className="ffdos-tabs" role="tablist" aria-label="Dossier" onKeyDown={toets}>
        {DOSSIER_TABS.map((t) => (
          <button
            key={t}
            ref={(el) => {
              knoppen.current[t] = el
            }}
            type="button"
            role="tab"
            id={`ffdos-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`ffdos-paneel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            className="ffdos-tab"
            onClick={() => kies(t)}
          >
            {LABEL[t]}
            {telling[t] ? <small aria-hidden={t === 'notities'}>{telling[t]}</small> : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="ffdos-paneel-intake" aria-labelledby="ffdos-tab-intake" hidden={tab !== 'intake'}>
        <IntakeFormulier code={code} klantId={klant.id} begin={intake} onOpgeslagen={setIntake} alleenLezen={alleenLezen} />
      </div>
      <div role="tabpanel" id="ffdos-paneel-metingen" aria-labelledby="ffdos-tab-metingen" hidden={tab !== 'metingen'}>
        <MetingenPaneel code={code} klantId={klant.id} startdatum={klant.startdatum} vandaag={vandaag} metingen={metingen} onWijzig={setMetingen} alleenLezen={alleenLezen} />
      </div>
      <div role="tabpanel" id="ffdos-paneel-notities" aria-labelledby="ffdos-tab-notities" hidden={tab !== 'notities'}>
        <NotitiesPaneel code={code} klant={klant} onOpgeslagen={setKlant} alleenLezen={alleenLezen} />
      </div>
    </div>
  )
}
