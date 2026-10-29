'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { filterOefeningen, LEEG_FILTER, type OefeningFilter } from '@/lib/club/training/filter'
import type { Oefening } from '@/lib/club/training/rijen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { OefeningBeeld } from './OefeningBeeld'
import { OefeningFilters } from './OefeningFilters'
import { SpierChips } from './SpierChips'
import { Zijpaneel } from './Zijpaneel'

interface OefeningKiezerProps {
  oefeningen: Oefening[]
  dagLabel: string
  /** Oefeningen die al op deze dag staan (met een vinkje). */
  opDag: ReadonlySet<string>
  onKies: (oefening: Oefening) => void
  onSluit: () => void
}

/**
 * Oefeningen zoeken op naam, spier, materiaal en niveau, met beeld. Typen,
 * pijltjes en Enter voegen toe; het paneel blijft open voor meer.
 */
export function OefeningKiezer({ oefeningen, dagLabel, opDag, onKies, onSluit }: OefeningKiezerProps) {
  const t = useTekst(SCHEMA_EDITOR).kiezer
  const l = useTekst(TRAINING_LABELS)
  const [filter, setFilter] = useState<OefeningFilter>(LEEG_FILTER)
  const [actief, setActief] = useState(0)
  const [laatst, setLaatst] = useState<string | null>(null)
  const zoek = useRef<HTMLInputElement>(null)
  const lijstRef = useRef<HTMLUListElement>(null)
  const lijst = useMemo(() => filterOefeningen(oefeningen, filter).slice(0, 60), [oefeningen, filter])
  const index = Math.min(actief, Math.max(0, lijst.length - 1))

  useEffect(() => {
    zoek.current?.focus()
  }, [])

  useEffect(() => {
    lijstRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [index])

  function kies(o: Oefening) {
    onKies(o)
    setLaatst(o.naam)
  }

  function toets(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActief(Math.max(0, Math.min(lijst.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1))))
    } else if (e.key === 'Enter' && e.target === zoek.current && lijst[index]) {
      e.preventDefault()
      kies(lijst[index])
    }
  }

  return (
    <Zijpaneel titel={t.titel(dagLabel)} boventitel={t.boventitel} onSluit={onSluit} breed>
      <div className="club-training-kiezer" onKeyDown={toets}>
        <OefeningFilters
          ref={zoek}
          filter={filter}
          onFilter={(f) => {
            setFilter(f)
            setActief(0)
          }}
        />
        <p className="club-hint club-training-kieshint" aria-live="polite">
          {laatst ? t.toegevoegd(laatst) : t.gevonden(lijst.length)}
        </p>
        {lijst.length === 0 ? (
          <p className="club-leeg">{t.leeg}</p>
        ) : (
          <ul ref={lijstRef} className="club-lijst club-training-kieslijst" role="listbox" aria-label={t.lijst}>
            {lijst.map((o, i) => {
              const al = opDag.has(o.id)
              return (
                <li key={o.id} role="option" aria-selected={i === index} data-index={i}>
                  <button type="button" className="club-rij club-training-kiesrij" onClick={() => kies(o)} onMouseEnter={() => setActief(i)} tabIndex={-1}>
                    <OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="klein" decoratief />
                    <span className="club-rij-hoofd">
                      <span className="club-rij-titel">{o.naam}</span>
                      <SpierChips primair={o.spierenPrimair} spiergroep={o.spiergroep} />
                      <span className="club-rij-sub">{l.materiaal[o.materiaal]} · {l.niveau[o.niveau]}</span>
                    </span>
                    {al ? <Check aria-label={t.alOpDag} size={18} className="club-training-al" /> : <Plus aria-hidden size={18} />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <button type="button" className="club-knop" onClick={onSluit}>{t.klaar}</button>
    </Zijpaneel>
  )
}
