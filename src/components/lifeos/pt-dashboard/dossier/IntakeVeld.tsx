'use client'

import { MAX_KORT, MAX_LANG, MAX_TOELICHTING, toelichtingId, type Antwoord, type IntakeVeld as Veldschema } from '@/lib/lifeos/pt-dashboard/intake'
import { Keuzes, Veld } from '../velden'

// Eén intakevraag, naar type. Presentational: waarde in, onWijzig uit.
// Lege invoer → undefined (de vraag telt dan niet als beantwoord).

interface Props {
  veld: Veldschema
  waarde: Antwoord | undefined
  toelichting: string | undefined
  onWijzig: (id: string, w: Antwoord | undefined) => void
}

const JA_NEE = [
  { waarde: 'ja', label: 'Ja' },
  { waarde: 'nee', label: 'Nee' },
] as const

function label(v: Veldschema): string {
  return v.verplicht ? `${v.label} *` : v.label
}

function Invoer({ veld: v, waarde, onWijzig }: Omit<Props, 'toelichting'>) {
  const id = `intake-${v.id}`
  const tekst = typeof waarde === 'string' ? waarde : ''
  switch (v.type) {
    case 'tekst':
      return v.lang ? (
        <textarea id={id} className="ptd-invoer" rows={3} maxLength={MAX_LANG} value={tekst} onChange={(e) => onWijzig(v.id, e.target.value || undefined)} />
      ) : (
        <input id={id} className="ptd-invoer" maxLength={MAX_KORT} value={tekst} onChange={(e) => onWijzig(v.id, e.target.value || undefined)} autoComplete="off" />
      )
    case 'datum':
      return <input id={id} type="date" className="ptd-invoer" value={tekst} onChange={(e) => onWijzig(v.id, e.target.value || undefined)} />
    case 'getal':
      return (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="ptd-invoer"
          min={v.min}
          max={v.max}
          step="any"
          value={typeof waarde === 'number' ? waarde : ''}
          onChange={(e) => onWijzig(v.id, e.target.value === '' ? undefined : Number(e.target.value))}
        />
      )
    default:
      return null
  }
}

export function IntakeVeld({ veld: v, waarde, toelichting, onWijzig }: Props) {
  if (v.type === 'keuze') {
    return (
      <Keuzes label={label(v)} opties={v.opties} waarde={typeof waarde === 'string' ? waarde : null} onKies={(w) => onWijzig(v.id, w ?? undefined)} leegToegestaan />
    )
  }
  if (v.type === 'meerkeuze') {
    const gekozen = Array.isArray(waarde) ? (waarde as readonly string[]) : []
    const wissel = (w: string) => {
      const nieuw = gekozen.includes(w) ? gekozen.filter((x) => x !== w) : [...gekozen, w]
      onWijzig(v.id, nieuw.length > 0 ? v.opties.map((o) => o.waarde).filter((o) => nieuw.includes(o)) : undefined)
    }
    return (
      <div className="ptd-veld">
        <span>{label(v)}</span>
        <div className="ptd-keuzes" role="group" aria-label={v.label}>
          {v.opties.map((o) => (
            <button key={o.waarde} type="button" className="ptd-chip" aria-pressed={gekozen.includes(o.waarde)} onClick={() => wissel(o.waarde)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (v.type === 'ja-nee') {
    const jn = waarde === true ? 'ja' : waarde === false ? 'nee' : null
    const tid = `intake-${toelichtingId(v.id)}`
    return (
      <div className="ffdos-janee">
        <Keuzes label={label(v)} opties={JA_NEE} waarde={jn} onKies={(w) => onWijzig(v.id, w === null ? undefined : w === 'ja')} leegToegestaan />
        {v.toelichtingBijJa && waarde === true ? (
          <Veld label="Toelichting *" id={tid}>
            <textarea
              id={tid}
              className="ptd-invoer"
              rows={2}
              maxLength={MAX_TOELICHTING}
              value={toelichting ?? ''}
              onChange={(e) => onWijzig(toelichtingId(v.id), e.target.value || undefined)}
            />
          </Veld>
        ) : null}
      </div>
    )
  }
  return (
    <Veld label={label(v)} id={`intake-${v.id}`} hint={v.type === 'getal' && v.eenheid ? `In ${v.eenheid}${v.hint ? ` · ${v.hint}` : ''}` : v.hint}>
      <Invoer veld={v} waarde={waarde} onWijzig={onWijzig} />
    </Veld>
  )
}
