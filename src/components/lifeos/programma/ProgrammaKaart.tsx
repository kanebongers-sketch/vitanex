'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Dumbbell, Apple, ShoppingCart } from 'lucide-react'
import { TRAINING } from '@/lib/lifeos/programma/programma-data'
import { TrainingWeergave } from './TrainingWeergave'
import { VoedingWeergave } from './VoedingWeergave'
import { BoodschappenWeergave } from './BoodschappenWeergave'
import { PROG_STYLE } from './programma-style'

// Mijn programma — Kane's persoonlijke trainings- en voedingsschema, leesbaar op
// z'n telefoon i.p.v. in een spreadsheet. Statische data uit `programma-data`;
// deze component leest en toont alleen. Drie weergaves via een echte tablist
// (pijltjestoetsen + roving tabindex), zodat de tab-navigatie toegankelijk is.

type TabKey = 'training' | 'voeding' | 'boodschappen'

const TABS = [
  { key: 'training', label: 'Training', icon: Dumbbell },
  { key: 'voeding', label: 'Voeding', icon: Apple },
  { key: 'boodschappen', label: 'Boodschappen', icon: ShoppingCart },
] as const

export function ProgrammaKaart() {
  const [actief, setActief] = useState<TabKey>('training')
  const baseId = useId()
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  function focusTab(key: TabKey) {
    setActief(key)
    tabRefs.current[key]?.focus()
  }

  function onTabToetsen(e: KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.findIndex((t) => t.key === actief)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusTab(TABS[(i + 1) % TABS.length].key)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusTab(TABS[(i - 1 + TABS.length) % TABS.length].key)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusTab(TABS[0].key)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusTab(TABS[TABS.length - 1].key)
    }
  }

  const tabId = (k: string) => `${baseId}-tab-${k}`
  const panelId = (k: string) => `${baseId}-panel-${k}`

  return (
    <section className="prog" aria-labelledby={`${baseId}-titel`}>
      <header className="prog-kop">
        <p className="prog-eyebrow">
          <Dumbbell size={14} strokeWidth={2.2} aria-hidden="true" /> Mijn programma
        </p>
        <h1 className="prog-titel" id={`${baseId}-titel`}>Training &amp; voeding</h1>
        <p className="prog-meta">
          Doel <b>{TRAINING.doel}</b> · fase <b>{TRAINING.fase}</b> · een 6-daagse push/pull/legs
        </p>
      </header>

      <div className="prog-tablist" role="tablist" aria-label="Onderdeel van je programma">
        {TABS.map((t) => {
          const Icon = t.icon
          const selected = actief === t.key
          return (
            <button
              key={t.key}
              ref={(el) => { tabRefs.current[t.key] = el }}
              type="button"
              role="tab"
              id={tabId(t.key)}
              aria-selected={selected}
              aria-controls={panelId(t.key)}
              // Vast toegankelijk label: op smalle schermen verbergt CSS de
              // zichtbare tekst (display:none haalt 'm óók uit de a11y-tree).
              aria-label={t.label}
              tabIndex={selected ? 0 : -1}
              className="prog-tab"
              onClick={() => setActief(t.key)}
              onKeyDown={onTabToetsen}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
              <span className="prog-tab-tekst">{t.label}</span>
            </button>
          )
        })}
      </div>

      <div
        className="prog-panel"
        role="tabpanel"
        id={panelId(actief)}
        aria-labelledby={tabId(actief)}
        tabIndex={0}
        key={actief}
      >
        {actief === 'training' && <TrainingWeergave />}
        {actief === 'voeding' && <VoedingWeergave />}
        {actief === 'boodschappen' && <BoodschappenWeergave />}
      </div>

      <style>{PROG_STYLE}</style>
    </section>
  )
}
