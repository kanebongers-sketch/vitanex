'use client'

import { useState, type ReactNode } from 'react'
import { ArrowRight, BookOpen, Check } from 'lucide-react'
import type { AppOefening, OefeningHistorie } from '@/lib/club/app/schema'
import { voorschrift } from '@/lib/club/app/schema'
import { aantalSets, huidigeSet, setSleutel, type Invoer, type OefeningPlek, type SetVeld } from '@/lib/club/app/training-modus'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { TRAINING } from '@/lib/aiyourgym/taal/woorden/ledenapp/training'
import { OefeningSpeler } from '@/components/club/training/coaching/OefeningSpeler'
import { RepCoaching } from '@/components/club/training/repspeler/RepCoaching'
import { RepSpeler } from '@/components/club/training/repspeler/RepSpeler'
import { repRenderVoor } from '@/components/club/training/repspeler/render-bron'
import { TempoCurve } from '@/components/club/training/TempoCurve'
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
  /** Set klaar; met `rustVanaf` (ms) telt de rust vanaf dat moment (de rep-speler was eerder klaar dan de tik). */
  onKlaar: (sleutel: string, rustVanaf?: number) => void
  onOpen: (sleutel: string) => void
  onInfo: () => void
  onVolgende: () => void
  /** Plek voor "Andere oefening" (los geleverd); leeg als die er niet is. */
  andereOefening?: ReactNode
}

/**
 * Een oefening per scherm: bewegend beeld, kernpunten, en de set die aan de beurt is groot.
 * Met een Blender-render (besluit Kane 24-10-2026) de rep-speler over de volle breedte,
 * altijd op 1 seconde heen en 1 terug (besluit Kane 29-10-2026), met de coaching er direct onder.
 */
export function OefeningScherm(p: OefeningSchermProps) {
  const { oefening: o, plek, invoer } = p
  const [gekozen, setGekozen] = useState<number | null>(null)
  const taal = useTaal()
  const t = TRAINING[taal].oefening
  const open = huidigeSet(o, invoer)
  const actief = gekozen ?? open
  const regel = voorschrift(o, taal)
  const titelId = `oefening-${o.id}`
  const render = repRenderVoor(o.naam)

  function klaar(sleutel: string, rustVanaf?: number) {
    setGekozen(null)
    p.onKlaar(sleutel, rustVanaf)
  }

  return (
    <article className="club-tm-oef" aria-labelledby={titelId}>
      <header className="club-tm-titel">
        <span className="club-tm-label" data-soort={plek.soort}>{plek.label}</span>
        <div>
          <h2 id={titelId}>{o.naam}</h2>
          {regel && <p>{regel}</p>}
          <TempoCurve tempo={o.tempo} className="club-tm-tempo" />
        </div>
      </header>
      <div className="club-tm-top" data-rep={render ? true : undefined}>
        {render ? (
          <div className="club-tm-rep" data-geen-veeg>
            <RepSpeler
              key={`${o.id}:${actief ?? 'af'}`} render={render} naam={o.naam} herhalingen={o.herhalingen} tijdSec={o.tijdSec} tempo={o.tempo} rustSec={o.rustSec}
              sets={aantalSets(o)} setNr={actief} onSetKlaar={actief !== null ? (vanaf) => klaar(setSleutel(o.id, actief), vanaf) : undefined}
            />
          </div>
        ) : (
          <div className="club-tm-beeld" data-geen-veeg>
            <OefeningSpeler key={o.id} naam={o.naam} beeld={o.beeld} />
          </div>
        )}
        <div className="club-tm-uitleg">
          {render ? (
            <RepCoaching naam={o.naam} kernpunten={p.kernpunten} aandachtspunten={o.aandachtspunten} />
          ) : (
            <Kernpunten punten={p.kernpunten} aandachtspunten={o.aandachtspunten} label={t.kernpunten} />
          )}
          <button type="button" className="club-tm-meer" onClick={p.onInfo} aria-haspopup="dialog">
            <BookOpen aria-hidden size={16} /> {t.meerUitleg}
          </button>
        </div>
      </div>
      {p.andereOefening && <div className="club-tm-slot">{p.andereOefening}</div>}
      {plek.soort !== 'los' && (
        <p className="club-tm-blok">
          <strong>{t.blok[plek.soort]}</strong> {t.blokMet(plek.samenMet.join(` ${t.en} `))}
        </p>
      )}
      {o.notitie && <p className="club-tm-notitie">{notitieTekst(o.notitie, t)}</p>}
      {actief !== null ? (
        <SetPaneel oefening={o} historie={p.historie} invoer={invoer} setNr={actief} onVeld={p.onVeld} onKlaar={klaar} onOpen={(k) => { setGekozen(null); p.onOpen(k) }} />
      ) : (
        <section className="club-tm-alles" aria-live="polite">
          <span className="club-tm-alles-vink" aria-hidden><Check size={22} strokeWidth={3} /></span>
          <p><strong>{t.allesGedaan}</strong> {t.aanpassen}</p>
          {!p.isLaatste && (
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" onClick={p.onVolgende}>
              {TRAINING[taal].volgende} <ArrowRight aria-hidden size={17} />
            </button>
          )}
        </section>
      )}
      <SetLijst oefening={o} historie={p.historie} invoer={invoer} actief={actief} onKies={(n) => setGekozen(n === open ? null : n)} />
    </article>
  )
}

/** Zo zet wisselOefening (alternatieven.ts) de andere oefening in de notitie; in de taal van de app tonen. */
const WISSEL_NOTITIE = /^Vandaag in plaats van (.+)\.$/

function notitieTekst(notitie: string, t: (typeof TRAINING)['nl']['oefening']): string {
  const wissel = WISSEL_NOTITIE.exec(notitie)
  return wissel ? t.inPlaatsVan(wissel[1]) : t.vanTrainer(notitie)
}

/** De kernpunten genummerd, direct zichtbaar. Zonder coaching: de aandachtspunten uit de bibliotheek. */
function Kernpunten({ punten, aandachtspunten, label }: { punten: readonly string[] | undefined; aandachtspunten: string | null; label: string }) {
  if (punten && punten.length > 0) {
    return (
      <ol className="club-tm-kern" aria-label={label}>
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
