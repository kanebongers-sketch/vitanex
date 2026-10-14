'use client'

import { useMemo } from 'react'
import type { Afsluitronde as Ronde, DagNotitie, Taak, Takenlijst } from '@/lib/club/taken/typen'
import { MOMENT_LABEL } from '@/lib/club/taken/typen'
import { nogOpen, perMoment, takenVanVandaag, type VandaagTaak } from '@/lib/club/taken/voortgang'
import { useAfvinken } from './AfvinkContext'
import { Afsluitronde } from './Afsluitronde'
import { DagNotities } from './DagNotities'
import { TaakTegel } from './TaakTegel'

// Tabletmodus voor aan de balie: alleen wat vandaag moet, groot en per moment
// van de dag. Weektaken uit het poetsrooster staan erbij zolang hun minimum nog
// niet gehaald is. Onderaan de afsluitronde en de taken voor als er tijd is.

interface BordProps {
  lijsten: Takenlijst[]
  taken: Taak[]
  dagen: string[]
  ronde: Ronde | null
  notities: DagNotitie[]
}

function Groep({ titel, items, bron }: { titel: string; items: VandaagTaak[]; bron: Record<string, string> }) {
  const klaar = items.filter((i) => i.afgevinkt).length
  const id = `club-taken-moment-${titel.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section className="club-taken-moment" aria-labelledby={id} data-af={klaar === items.length ? '' : undefined}>
      <header className="club-taken-moment-kop">
        <h2 id={id}>{titel}</h2>
        <span className="club-getal">
          {klaar} van {items.length}
        </span>
      </header>
      <ul className="club-taken-tegels">
        {items.map((i) => (
          <TaakTegel key={i.taak.id} item={i} bron={bron[i.taak.lijstId] ?? ''} />
        ))}
      </ul>
    </section>
  )
}

export function VandaagBord({ lijsten, taken, dagen, ronde, notities }: BordProps) {
  const { afvinkingen, vandaag } = useAfvinken()
  const items = useMemo(() => takenVanVandaag(taken, afvinkingen, dagen, vandaag), [taken, afvinkingen, dagen, vandaag])
  const bron = useMemo(() => Object.fromEntries(lijsten.map((l) => [l.id, l.naam])), [lijsten])
  const verplicht = items.filter((i) => i.soort === 'verplicht')
  const groepen = perMoment(verplicht).filter((g) => g.moment !== 'afsluiten')
  const afsluiten = verplicht.filter((i) => i.taak.moment === 'afsluiten')
  const optioneel = items.filter((i) => i.soort === 'optioneel')
  const open = nogOpen(items)

  return (
    <div className="club-taken-bord">
      <p className="club-taken-bord-stand" aria-live="polite">
        {open === 0 ? (
          <strong>Alles van vandaag is gedaan.</strong>
        ) : (
          <>
            Nog <strong className="club-getal">{open}</strong> van {verplicht.length} open vandaag
          </>
        )}
      </p>
      {groepen.map((g) => (
        <Groep key={g.moment} titel={MOMENT_LABEL[g.moment]} items={g.items} bron={bron} />
      ))}
      {afsluiten.length > 0 && <Afsluitronde items={afsluiten} bron={bron} begin={ronde} />}
      {optioneel.length > 0 && (
        <details className="club-taken-extra">
          <summary>Als er tijd is ({optioneel.length})</summary>
          <ul className="club-taken-tegels">
            {optioneel.map((i) => (
              <TaakTegel key={i.taak.id} item={i} bron={i.taak.groep ?? bron[i.taak.lijstId] ?? ''} />
            ))}
          </ul>
        </details>
      )}
      <section className="club-taken-moment" aria-labelledby="club-taken-vandaag-notitie">
        <header className="club-taken-moment-kop">
          <h2 id="club-taken-vandaag-notitie">Iets anders gedaan?</h2>
        </header>
        <DagNotities datum={vandaag} begin={notities} zonderKop />
      </section>
    </div>
  )
}
