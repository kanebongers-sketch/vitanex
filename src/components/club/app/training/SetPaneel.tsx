'use client'

import { Check, RotateCcw } from 'lucide-react'
import type { AppOefening, OefeningHistorie } from '@/lib/club/app/schema'
import { aantalSets, metKilo, opTijd, setSleutel, setTekst, vorigeTekst, voorstelSet, type Invoer, type SetVeld } from '@/lib/club/app/training-modus'
import { Teller } from './Teller'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { TRAINING } from '@/lib/aiyourgym/taal/woorden/ledenapp/training'

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
  const taal = useTaal()
  const t = TRAINING[taal].set
  const v = invoer[k] ?? LEEG
  const voorstel = voorstelSet(o, historie, setNr)
  const vorige = vorigeTekst(historie, setNr, taal)
  const tijd = opTijd(o)
  const context = t.context(setNr, o.naam)
  return (
    <section className="club-tm-set" data-klaar={v.klaar || undefined} aria-label={t.label(setNr, aantalSets(o))}>
      <header className="club-tm-set-kop">
        <p>
          <strong>{t.set(setNr)}</strong> <span>{t.van(aantalSets(o))}</span>
        </p>
        <p className="club-tm-set-vorige">{vorige ? <>{t.vorigeKeer} <b>{vorige}</b></> : tijd ? t.eersteTijd : t.eersteGewicht}</p>
      </header>
      <div className="club-tm-tellers" data-een={!metKilo(o, historie) || undefined}>
        {metKilo(o, historie) && <Teller soort="kg" label={t.kilo} context={context} waarde={v.kg} voorstel="" onWaarde={(kg) => onVeld(k, { kg })} />}
        {tijd ? (
          <Teller soort="tijd" label={t.seconden} context={context} waarde={v.tijd} voorstel={voorstel.tijd} onWaarde={(t) => onVeld(k, { tijd: t })} />
        ) : (
          <Teller soort="herh" label={t.herhalingen} context={context} waarde={v.herh} voorstel={voorstel.herh} onWaarde={(herh) => onVeld(k, { herh })} />
        )}
      </div>
      {v.klaar ? (
        <div className="club-tm-set-gedaan">
          <span>
            <Check aria-hidden size={18} strokeWidth={3} /> {t.gedaan(setTekst(o, v, voorstel, taal))}
          </span>
          <button type="button" className="club-lidapp-tekstknop" onClick={() => onOpen(k)}>
            <RotateCcw aria-hidden size={14} /> {t.weerOpen}
          </button>
        </div>
      ) : (
        <button type="button" className="club-tm-setknop" onClick={() => onKlaar(k)}>
          <Check aria-hidden size={24} strokeWidth={3} />
          {t.klaar(setNr)}
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
  const taal = useTaal()
  const t = TRAINING[taal].set
  return (
    <ol className="club-tm-sets" aria-label={t.sets}>
      {sets.map((n) => {
        const v = invoer[setSleutel(o.id, n)]
        const voorstel = voorstelSet(o, historie, n)
        return (
          <li key={n}>
            <button type="button" className="club-tm-setrij" aria-current={n === actief ? 'step' : undefined} data-klaar={v?.klaar || undefined} onClick={() => onKies(n)}>
              <span className="club-tm-setrij-nr" aria-hidden>{v?.klaar ? <Check size={15} strokeWidth={3.2} /> : n}</span>
              <span className="club-tm-setrij-tekst">
                <span className="club-sr">{t.srSet(n)}</span>
                {n === actief && !v?.klaar ? t.nu : setTekst(o, v, voorstel, taal)}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
