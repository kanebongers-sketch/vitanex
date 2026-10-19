'use client'

import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import {
  EXTRA_GROEP_LABEL, EXTRA_VELDEN, extraInvoerLabel, extraVeld, type ExtraGroep, type ExtraSleutel,
} from '@/lib/lifeos/pt-dashboard/meting-extra'

// Extra meetopties bij een weging of meting. De PT'er voegt ze toe met
// "+ Meting toevoegen"; wat bij deze klant eerder gemeten is, staat al klaar
// (voorselectie door de ouder). Een leeg veld wordt niet opgeslagen.

interface Props {
  idPrefix: string
  gekozen: readonly ExtraSleutel[]
  waarden: Readonly<Record<string, string>>
  onGekozen: (s: ExtraSleutel[]) => void
  onWaarde: (s: ExtraSleutel, w: string) => void
}

const GROEPEN = Object.keys(EXTRA_GROEP_LABEL) as ExtraGroep[]

export function ExtraVelden({ idPrefix, gekozen, waarden, onGekozen, onWaarde }: Props) {
  const [open, setOpen] = useState(false)
  // Het net toegevoegde veld krijgt de focus (autoFocus bij het verschijnen).
  const [nieuw, setNieuw] = useState<ExtraSleutel | null>(null)
  const vrij = EXTRA_VELDEN.filter((v) => !gekozen.includes(v.sleutel))
  const veldId = (s: ExtraSleutel) => `${idPrefix}-extra-${s}`
  const knopId = `${idPrefix}-extra-knop`

  function voegToe(s: ExtraSleutel) {
    // Op de vaste volgorde, zodat de velden bij elke weging op dezelfde plek staan.
    onGekozen(EXTRA_VELDEN.map((v) => v.sleutel).filter((x) => x === s || gekozen.includes(x)))
    setOpen(false)
    setNieuw(s)
  }

  function haalWeg(s: ExtraSleutel) {
    onGekozen(gekozen.filter((x) => x !== s))
    onWaarde(s, '')
  }

  function toets(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    setOpen(false)
    document.getElementById(knopId)?.focus()
  }

  return (
    <div className="ffdos-extra">
      {gekozen.length > 0 ? (
        <div className="ffdos-extra-velden">
          {gekozen.map((s) => {
            const v = extraVeld(s)
            return (
              <div key={s} className="ptd-veld ffdos-extra-veld">
                <label htmlFor={veldId(s)}>{extraInvoerLabel(v)}</label>
                <div className="ffdos-extra-invoer">
                  <input
                    id={veldId(s)}
                    className="ptd-invoer"
                    inputMode={v.decimalen === 0 ? 'numeric' : 'decimal'}
                    autoComplete="off"
                    autoFocus={s === nieuw}
                    value={waarden[s] ?? ''}
                    onChange={(e) => onWaarde(s, e.target.value)}
                  />
                  <button type="button" className="ffdos-extra-weg" onClick={() => haalWeg(s)} aria-label={`${v.label} weghalen`}>
                    <X size={16} aria-hidden />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {vrij.length > 0 ? (
        <button
          id={knopId}
          type="button"
          className="ptd-knop ptd-knop--klein ffdos-extra-knop"
          aria-expanded={open}
          aria-controls={`${idPrefix}-extra-lijst`}
          onClick={() => setOpen((x) => !x)}
        >
          <Plus size={15} aria-hidden /> Meting toevoegen
        </button>
      ) : null}

      {open ? (
        <div id={`${idPrefix}-extra-lijst`} className="ffdos-extra-kies" role="group" aria-label="Kies een meting" onKeyDown={toets}>
          {GROEPEN.map((g) => {
            const opties = vrij.filter((v) => v.groep === g)
            if (opties.length === 0) return null
            return (
              <div key={g} className="ffdos-extra-groep">
                <span className="ptd-label">{EXTRA_GROEP_LABEL[g]}</span>
                <div className="ptd-keuzes">
                  {opties.map((v) => (
                    <button key={v.sleutel} type="button" className="ptd-chip" onClick={() => voegToe(v.sleutel)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
