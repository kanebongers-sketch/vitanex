'use client'

import { HEX } from '@/lib/club/kern/huisstijl'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'

// Een rij stalen plus een eigen kleur (kiezer en code). Voor de hoofdkleur, de
// tweede kleur en de achtergrondtint. Met `leeg` staat er vooraan een staal
// zonder kleur (Neutraal of Zelfde als hoofdkleur), die null kiest.

export interface Staal {
  kleur: string
  naam: string
}

interface KleurKiezerProps {
  id: string
  label: string
  uitleg: string
  kleur: string | null
  stalen: readonly Staal[]
  onKleur: (kleur: string | null) => void
  /** De naam van de keuze zonder eigen kleur; weglaten = altijd een kleur. */
  leeg?: string
  /** De kleur die de kiezer toont als er (nog) geen geldige is. */
  terugval: string
  meldingId?: string
}

export function KleurKiezer({ id, label, uitleg, kleur, stalen, onKleur, leeg, terugval, meldingId }: KleurKiezerProps) {
  const t = useTekst(HUISSTIJL).kleur
  const waarde = kleur ?? ''
  const geldig = kleur !== null && HEX.test(kleur)
  return (
    <fieldset className="club-huisstijl-kiezer" aria-describedby={`${id}-uitleg`}>
      <legend className="club-huisstijl-subkop">{label}</legend>
      <p id={`${id}-uitleg`} className="club-hint">{uitleg}</p>
      <div className="club-huisstijl-stalen" role="group" aria-label={label}>
        {leeg && (
          <button type="button" className="club-huisstijl-staal club-huisstijl-staal--leeg" aria-label={leeg} title={leeg} aria-pressed={kleur === null} onClick={() => onKleur(null)} />
        )}
        {stalen.map((s) => (
          <button
            key={s.kleur}
            type="button"
            className="club-huisstijl-staal"
            style={{ background: s.kleur }}
            aria-label={s.naam}
            title={s.naam}
            aria-pressed={waarde.toUpperCase() === s.kleur}
            onClick={() => onKleur(s.kleur)}
          />
        ))}
      </div>
      <div className="club-formrij club-huisstijl-eigen">
        <label className="club-veld">
          <span>{t.eigen}</span>
          <span className="club-huisstijl-kleurveld">
            <input type="color" value={geldig ? waarde : terugval} onChange={(e) => onKleur(e.target.value.toUpperCase())} aria-label={`${label}: ${t.kiezen}`} />
            <input
              className="club-invoer"
              aria-label={`${label}: ${t.code}`}
              aria-describedby={meldingId}
              value={waarde}
              placeholder={leeg}
              maxLength={7}
              spellCheck={false}
              onChange={(e) => {
                const v = e.target.value.trim().toUpperCase()
                onKleur(v === '' && leeg ? null : v)
              }}
              aria-invalid={kleur !== null && !geldig}
            />
          </span>
        </label>
      </div>
    </fieldset>
  )
}
