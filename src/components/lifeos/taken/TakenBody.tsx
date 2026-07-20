'use client'

import type { CSSProperties, ReactNode } from 'react'
import { NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import type { Project } from '@/lib/lifeos/projecten/projecten'
import { ordenTaken } from '@/lib/lifeos/taken/prioriteit'
import {
  eersteVrijePositie,
  groepeerTaken,
  takenVanDag,
  type GegroepeerdeTaken,
  type Taak,
  type TaakWijziging,
  type Top3Positie,
} from '@/lib/lifeos/taken/taken'
import { TaakDetail } from './TaakDetail'
import { TaakRij } from './TaakRij'
import { ToevoegVeld } from './ToevoegVeld'
import { Top3Sectie } from './Top3Sectie'
import type { ProjectMaakUitkomst, ProjectenBediening } from './useProjecten'
import type { TakenBediening } from './useTaken'

// De takenlijst als INBEDBAAR blok: top-3, groepen en detail — maar zónder eigen
// `Kaart`-wrapper en zónder de snelle "voor vandaag"-capture (die zit nu in de
// gedeelde "Vang op"-balk bovenaan, zie `vangop/VangOp.tsx`).
//
// Presentational: `taken`, `projecten` en `vandaag` komen als props binnen. Het
// laden en wijzigen zit in `useTaken`/`useProjecten` (die de container VangOp
// bezit), het oordelen in `prioriteit.ts`, het groeperen in `taken.ts`. Deze
// component beslist alleen wat waar staat.
//
// De "ooit, zonder datum"-capture bLIJFT hier: dat is een taken-eigen route naar
// een datumloze taak, geen kopie van de balk bovenaan (die maakt altijd een taak
// voor vándaag). Zonder dit veld zou die functie verdwijnen.

interface TakenBodyProps {
  taken: TakenBediening
  projecten: ProjectenBediening
  /** De dag volgens de browser, of `null` zolang we op de server renderen. */
  vandaag: string | null
}

export function TakenBody({ taken, projecten, vandaag }: TakenBodyProps) {
  const staat = taken.staat

  // Eén ketting, dus precies één staat tegelijk: fout wint van laden, laden van
  // inhoud. Drie losse blokken naast elkaar zouden samen kunnen renderen — dan
  // staat er een skelet ónder een foutmelding.
  if (staat.fase === 'fout') {
    return <Foutmelding bericht={staat.bericht} opnieuw={taken.opnieuw} />
  }
  if (staat.fase === 'laden' || vandaag === null) {
    return <Skelet />
  }

  return (
    <Inhoud
      groepen={groepeerTaken(staat.taken, vandaag)}
      // De top-3 wordt uit de dag zelf afgeleid, niet uit de bakken: een
      // afgevinkte top-3-taak zit in 'gedaan' maar houdt zijn plek.
      vandaagAlles={takenVanDag(staat.taken, vandaag)}
      leeg={staat.taken.length === 0}
      vandaag={vandaag}
      projecten={projecten.projecten}
      projectenMislukt={projecten.mislukt}
      nieuwProject={projecten.voegToe}
      bediening={taken}
    />
  )
}

interface InhoudProps {
  groepen: GegroepeerdeTaken
  /** Alle taken van vandaag, open én afgevinkt — de bron van de top-3. */
  vandaagAlles: Taak[]
  leeg: boolean
  vandaag: string
  projecten: Project[]
  projectenMislukt: boolean
  nieuwProject: (naam: string) => Promise<ProjectMaakUitkomst>
  bediening: TakenBediening
}

function Inhoud({
  groepen,
  vandaagAlles,
  leeg,
  vandaag,
  projecten,
  projectenMislukt,
  nieuwProject,
  bediening,
}: InhoudProps) {
  // De top-3 is een laag over de taken van vandaag, geen aparte bak: hij wordt
  // hier afgeleid en nergens bewaard.
  const vrijePositie = eersteVrijePositie(vandaagAlles)
  // In de groep 'Vandaag' staat de rest: wat al in de top-3 zit, staat hierboven
  // en hoort er niet twee keer te staan.
  const restVandaag = groepen.vandaag.filter((t) => t.top3Positie === null)

  const zetTop3 = (taak: Taak, positie: Top3Positie | null) => {
    // Eén PATCH, dus atomair: de unieke index uit migratie 020 wijst een tweede
    // claim op dezelfde plek af met een nette 409, i.p.v. twee taken op plek 1.
    void bediening.wijzig(taak, { top3Positie: positie })
  }

  const detailVoor = (taak: Taak) => (
    <TaakDetail
      taak={taak}
      projecten={projecten}
      projectenMislukt={projectenMislukt}
      onWijzig={(wijziging: TaakWijziging) => void bediening.wijzig(taak, wijziging)}
      onNieuwProject={nieuwProject}
    />
  )

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {leeg ? (
        <NogNiets
          wat="Nog geen taken"
          waarom="Wat je hierboven bij 'Vang op' als taak zet — of via Telegram naar de bot stuurt — landt op deze lijst."
        />
      ) : (
        <>
          <Top3Sectie
            vandaag={vandaagAlles}
            onVink={bediening.vink}
            onLosmaken={(taak) => zetTop3(taak, null)}
          />
          <Groep
            titel="Vandaag"
            taken={restVandaag}
            vandaag={vandaag}
            vrijePositie={vrijePositie}
            onTop3={zetTop3}
            bediening={bediening}
            detailVoor={detailVoor}
          />
          <Groep
            titel="Te laat"
            taken={groepen.teLaat}
            vandaag={vandaag}
            bediening={bediening}
            detailVoor={detailVoor}
          />
          <Groep
            titel="Later"
            taken={groepen.later}
            vandaag={vandaag}
            bediening={bediening}
            detailVoor={detailVoor}
          />
          <Groep
            titel="Ooit"
            taken={groepen.ooit}
            vandaag={vandaag}
            bediening={bediening}
            detailVoor={detailVoor}
          />
          <Groep titel="Gedaan" taken={groepen.gedaan} vandaag={vandaag} bediening={bediening} />
        </>
      )}

      {/* Alleen de datumloze route: "vandaag" gaat via de gedeelde capture-balk. */}
      <ToevoegVeld
        label="Iets voor ooit, zonder datum"
        placeholder="Ooit, geen datum"
        bezig={bediening.bezig}
        onToevoeg={(titel) => bediening.voegToe(titel, null)}
      />

      {bediening.actieFout ? <Foutmelding bericht={bediening.actieFout} /> : null}

      <p style={NOOT}>
        Taken zonder top-3-plek — ook die je via Telegram naar de bot stuurt — staan hier.
      </p>
    </div>
  )
}

interface GroepProps {
  titel: string
  taken: Taak[]
  vandaag: string
  vrijePositie?: Top3Positie | null
  onTop3?: (taak: Taak, positie: Top3Positie | null) => void
  bediening: TakenBediening
  detailVoor?: (taak: Taak) => ReactNode
}

/**
 * Eén bak van de lijst, geordend door `ordenTaken`: top-3 eerst, dan op score,
 * en taken zonder oordeel apart achteraan — niet omdat ze onbelangrijk zijn maar
 * omdat er niets over te zeggen valt tot je één feit invult.
 */
function Groep({ titel, taken, vandaag, vrijePositie, onTop3, bediening, detailVoor }: GroepProps) {
  if (taken.length === 0) return null

  return (
    <section>
      <h3 style={KOP}>
        {titel}
        <span className="os-cijfer" style={{ color: 'var(--text-4)', fontWeight: 600 }}>
          {taken.length}
        </span>
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {ordenTaken(taken, vandaag).map((oordeel) => (
          <TaakRij
            key={oordeel.taak.id}
            oordeel={oordeel}
            onVink={bediening.vink}
            onVerwijder={bediening.verwijder}
            vrijePositie={vrijePositie}
            onTop3={onTop3}
            detail={detailVoor?.(oordeel.taak)}
          />
        ))}
      </ul>
    </section>
  )
}

const KOP: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  margin: '0 0 4px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
}

const NOOT: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--text-4)',
}

/** Rustige placeholder in navy. Geen spinner-spektakel. */
function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[58, 72, 44, 66].map((breedte, i) => (
        <div
          key={i}
          style={{ height: 14, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }}
        />
      ))}
    </div>
  )
}
