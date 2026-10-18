'use client'

import { useState, type ReactNode } from 'react'
import { ArrowRight, BookOpen, Check } from 'lucide-react'
import type { AppOefening, OefeningHistorie } from '@/lib/club/app/schema'
import { voorschrift } from '@/lib/club/app/schema'
import { huidigeSet, type Invoer, type OefeningPlek, type SetVeld } from '@/lib/club/app/training-modus'
import { BLOK_LABEL } from '@/lib/club/training/blokken'
import { OefeningSpeler } from '@/components/club/training/coaching/OefeningSpeler'
import { SetLijst, SetPaneel } from './SetPaneel'

interface OefeningSchermProps {
  oefening: AppOefening
  plek: OefeningPlek
  historie: OefeningHistorie | undefined
  invoer: Invoer
  /** De 3 tot 5 kernpunten uit de coaching, als die er zijn. */
  kernpunten: readonly string[] | undefined
  isLaatste: boolean
  onVeld: (sleutel: string, deel: Partial<SetVeld>) => void
  onKlaar: (sleutel: string) => void
  onOpen: (sleutel: string) => void
  onInfo: () => void
  onVolgende: () => void
  /** Plek voor "Andere oefening" (los geleverd); leeg als die er niet is. */
  andereOefening?: ReactNode
}

/** Een oefening per scherm: bewegend beeld, kernpunten, en de set die aan de beurt is groot. */
export function OefeningScherm(p: OefeningSchermProps) {
  const { oefening: o, plek, invoer } = p
  const [gekozen, setGekozen] = useState<number | null>(null)
  const open = huidigeSet(o, invoer)
  const actief = gekozen ?? open
  const regel = voorschrift(o)
  const titelId = `oefening-${o.id}`

  function klaar(sleutel: string) {
    setGekozen(null)
    p.onKlaar(sleutel)
  }

  return (
    <article className="club-tm-oef" aria-labelledby={titelId}>
      <header className="club-tm-titel">
        <span className="club-tm-label" data-soort={plek.soort}>{plek.label}</span>
        <div>
          <h2 id={titelId}>{o.naam}</h2>
          {regel && <p>{regel}</p>}
        </div>
      </header>
      <div className="club-tm-top">
        <div className="club-tm-beeld" data-geen-veeg>
          <OefeningSpeler key={o.id} naam={o.naam} beeld={o.beeld} />
        </div>
        <div className="club-tm-uitleg">
          <Kernpunten punten={p.kernpunten} aandachtspunten={o.aandachtspunten} />
          <button type="button" className="club-tm-meer" onClick={p.onInfo} aria-haspopup="dialog">
            <BookOpen aria-hidden size={16} /> Meer uitleg
          </button>
        </div>
      </div>
      {p.andereOefening && <div className="club-tm-slot">{p.andereOefening}</div>}
      {plek.soort !== 'los' && (
        <p className="club-tm-blok">
          <strong>{BLOK_LABEL[plek.soort]}</strong> met {plek.samenMet.join(' en ')}. Een set van elk, dan pas rust.
        </p>
      )}
      {o.notitie && <p className="club-tm-notitie">{o.notitie.startsWith('Vandaag in plaats van') ? o.notitie : `Van je trainer: ${o.notitie}`}</p>}
      {actief !== null ? (
        <SetPaneel oefening={o} historie={p.historie} invoer={invoer} setNr={actief} onVeld={p.onVeld} onKlaar={klaar} onOpen={(k) => { setGekozen(null); p.onOpen(k) }} />
      ) : (
        <section className="club-tm-alles" aria-live="polite">
          <span className="club-tm-alles-vink" aria-hidden><Check size={22} strokeWidth={3} /></span>
          <p><strong>Alle sets gedaan</strong> Tik een set aan om hem aan te passen.</p>
          {!p.isLaatste && (
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" onClick={p.onVolgende}>
              Volgende <ArrowRight aria-hidden size={17} />
            </button>
          )}
        </section>
      )}
      <SetLijst oefening={o} historie={p.historie} invoer={invoer} actief={actief} onKies={(n) => setGekozen(n === open ? null : n)} />
    </article>
  )
}

/** De kernpunten genummerd, direct zichtbaar. Zonder coaching: de aandachtspunten uit de bibliotheek. */
function Kernpunten({ punten, aandachtspunten }: { punten: readonly string[] | undefined; aandachtspunten: string | null }) {
  if (punten && punten.length > 0) {
    return (
      <ol className="club-tm-kern" aria-label="Kernpunten">
        {punten.slice(0, 5).map((punt, i) => (
          <li key={i}>
            <b aria-hidden>{i + 1}</b>
            <span>{punt}</span>
          </li>
        ))}
      </ol>
    )
  }
  return aandachtspunten ? <p className="club-tm-notitie">{aandachtspunten}</p> : null
}
