'use client'

import { Check, RotateCcw } from 'lucide-react'
import type { AppOefening, OefeningHistorie } from '@/lib/club/app/schema'
import { aantalSets, metKilo, opTijd, setSleutel, setTekst, vorigeTekst, voorstelSet, type Invoer, type SetVeld } from '@/lib/club/app/training-modus'
import { Teller } from './Teller'

interface SetPaneelProps {
  oefening: AppOefening
  historie: OefeningHistorie | undefined
  invoer: Invoer
  /** De set die nu groot staat. */
  setNr: number
  onVeld: (sleutel: string, deel: Partial<SetVeld>) => void
  onKlaar: (sleutel: string) => void
  onOpen: (sleutel: string) => void
}

const LEEG: SetVeld = { kg: '', herh: '', tijd: '', klaar: false }

/** De set die aan de beurt is, groot: kilo en herhalingen (of seconden) met min en plus, de vorige keer ernaast. */
export function SetPaneel({ oefening: o, historie, invoer, setNr, onVeld, onKlaar, onOpen }: SetPaneelProps) {
  const k = setSleutel(o.id, setNr)
  const v = invoer[k] ?? LEEG
  const voorstel = voorstelSet(o, historie, setNr)
  const vorige = vorigeTekst(historie, setNr)
  const tijd = opTijd(o)
  const context = `set ${setNr} ${o.naam}`
  return (
    <section className="club-tm-set" data-klaar={v.klaar || undefined} aria-label={`Set ${setNr} van ${aantalSets(o)}`}>
      <header className="club-tm-set-kop">
        <p>
          <strong>Set {setNr}</strong> <span>van {aantalSets(o)}</span>
        </p>
        <p className="club-tm-set-vorige">{vorige ? <>Vorige keer <b>{vorige}</b></> : tijd ? 'Eerste keer: houd vol zolang het netjes gaat.' : 'Eerste keer: kies een gewicht waarmee je alle herhalingen netjes haalt.'}</p>
      </header>
      <div className="club-tm-tellers" data-een={!metKilo(o, historie) || undefined}>
        {metKilo(o, historie) && <Teller soort="kg" label="Kilo" context={context} waarde={v.kg} voorstel="" onWaarde={(kg) => onVeld(k, { kg })} />}
        {tijd ? (
          <Teller soort="tijd" label="Seconden" context={context} waarde={v.tijd} voorstel={voorstel.tijd} onWaarde={(t) => onVeld(k, { tijd: t })} />
        ) : (
          <Teller soort="herh" label="Herhalingen" context={context} waarde={v.herh} voorstel={voorstel.herh} onWaarde={(herh) => onVeld(k, { herh })} />
        )}
      </div>
      {v.klaar ? (
        <div className="club-tm-set-gedaan">
          <span>
            <Check aria-hidden size={18} strokeWidth={3} /> Gedaan: {setTekst(o, v, voorstel)}
          </span>
          <button type="button" className="club-lidapp-tekstknop" onClick={() => onOpen(k)}>
            <RotateCcw aria-hidden size={14} /> Weer open zetten
          </button>
        </div>
      ) : (
        <button type="button" className="club-tm-setknop" onClick={() => onKlaar(k)}>
          <Check aria-hidden size={24} strokeWidth={3} />
          Set {setNr} klaar
        </button>
      )}
    </section>
  )
}

interface SetLijstProps {
  oefening: AppOefening
  historie: OefeningHistorie | undefined
  invoer: Invoer
  actief: number | null
  onKies: (setNr: number) => void
}

/** Alle sets van de oefening klein onder elkaar; tik er een aan om hem groot te zetten. */
export function SetLijst({ oefening: o, historie, invoer, actief, onKies }: SetLijstProps) {
  const sets = Array.from({ length: aantalSets(o) }, (_, i) => i + 1)
  return (
    <ol className="club-tm-sets" aria-label="Sets">
      {sets.map((n) => {
        const v = invoer[setSleutel(o.id, n)]
        const voorstel = voorstelSet(o, historie, n)
        return (
          <li key={n}>
            <button type="button" className="club-tm-setrij" aria-current={n === actief ? 'step' : undefined} data-klaar={v?.klaar || undefined} onClick={() => onKies(n)}>
              <span className="club-tm-setrij-nr" aria-hidden>{v?.klaar ? <Check size={15} strokeWidth={3.2} /> : n}</span>
              <span className="club-tm-setrij-tekst">
                <span className="club-sr">Set {n}: </span>
                {n === actief && !v?.klaar ? 'Nu' : setTekst(o, v, voorstel)}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
