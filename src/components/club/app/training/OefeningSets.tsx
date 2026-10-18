'use client'

import { Check, Info } from 'lucide-react'
import type { AppOefening, OefeningHistorie } from '@/lib/club/app/schema'
import { voorschrift } from '@/lib/club/app/schema'
import { aantalSets, opTijd, setSleutel, vorigeTekst, voorstelSet, type Invoer, type SetVeld } from '@/lib/club/app/training-modus'
import { OefeningBeeld } from '@/components/club/training/OefeningBeeld'

interface OefeningSetsProps {
  oefening: AppOefening
  label: string
  historie: OefeningHistorie | undefined
  invoer: Invoer
  onVeld: (sleutel: string, deel: Partial<SetVeld>) => void
  onKlaar: (sleutel: string, setNr: number) => void
  onInfo: () => void
}

/** Een oefening tijdens de training: per set grote velden voor kg en herhalingen (of tijd), de vorige keer ernaast. */
export function OefeningSets({ oefening: o, label, historie, invoer, onVeld, onKlaar, onInfo }: OefeningSetsProps) {
  const tijd = opTijd(o)
  const sets = Array.from({ length: aantalSets(o) }, (_, i) => i + 1)
  const alles = sets.every((n) => invoer[setSleutel(o.id, n)]?.klaar)
  return (
    <article className="club-lidapp-sets" data-klaar={alles || undefined} aria-label={o.naam}>
      <header className="club-lidapp-sets-kop">
        <span className="club-lidapp-nr" aria-hidden>{label}</span>
        <OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="klein" decoratief />
        <span className="club-lidapp-oefening-tekst">
          <strong>{o.naam}</strong>
          <span>{voorschrift(o) || 'Volgens je trainer'}</span>
          {o.notitie && <em>{o.notitie}</em>}
        </span>
        <button type="button" className="club-lidapp-sets-info" onClick={onInfo} aria-label={`Uitleg en coaching bij ${o.naam}`}>
          <Info aria-hidden size={18} />
        </button>
      </header>
      <div className="club-lidapp-sets-titels" aria-hidden>
        <span>Set</span>
        <span>Kg</span>
        <span>{tijd ? 'Sec' : 'Herh.'}</span>
        <span />
      </div>
      <ol className="club-lidapp-sets-lijst">
        {sets.map((n) => {
          const k = setSleutel(o.id, n)
          const v = invoer[k] ?? { kg: '', herh: '', tijd: '', klaar: false }
          const voorstel = voorstelSet(o, historie, n)
          const vorige = vorigeTekst(historie, n)
          return (
            <li key={k} className="club-lidapp-set" data-klaar={v.klaar || undefined}>
              <span className="club-lidapp-set-nr">{n}</span>
              <input
                className="club-lidapp-set-veld" inputMode="decimal" enterKeyHint="next" value={v.kg} placeholder="0"
                onChange={(e) => onVeld(k, { kg: e.target.value })} aria-label={`Set ${n} ${o.naam}: kilo`}
              />
              {tijd ? (
                <input
                  className="club-lidapp-set-veld" inputMode="numeric" enterKeyHint="done" value={v.tijd} placeholder={voorstel.tijd || 'sec'}
                  onChange={(e) => onVeld(k, { tijd: e.target.value })} aria-label={`Set ${n} ${o.naam}: seconden`}
                />
              ) : (
                <input
                  className="club-lidapp-set-veld" inputMode="numeric" enterKeyHint="done" value={v.herh} placeholder={voorstel.herh || 'herh.'}
                  onChange={(e) => onVeld(k, { herh: e.target.value })} aria-label={`Set ${n} ${o.naam}: herhalingen`}
                />
              )}
              <button
                type="button" className="club-lidapp-set-vink" aria-pressed={v.klaar} onClick={() => (v.klaar ? onVeld(k, { klaar: false }) : onKlaar(k, n))}
                aria-label={v.klaar ? `Set ${n} weer open zetten` : `Set ${n} gedaan`}
              >
                <Check aria-hidden size={22} strokeWidth={3} />
              </button>
              {vorige && <span className="club-lidapp-set-vorige">Vorige keer {vorige}</span>}
            </li>
          )
        })}
      </ol>
    </article>
  )
}
