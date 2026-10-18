'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { AppSchema } from '@/lib/club/app/data'
import type { AppOefening, AppSchemaDag, OefeningHistorie } from '@/lib/club/app/schema'
import { samenvatting, type Samenvatting } from '@/lib/club/app/sets'
import { beginInvoer, naarSets, stappenVanDag, volgendeSet, voortgang, type Invoer, type SetVeld } from '@/lib/club/app/training-modus'
import { BLOK_LABEL, blokken, regelLabels } from '@/lib/club/training/blokken'
import { stuur } from '../verzoek'
import { useLedenappApi } from '../LedenappApi'
import { OefeningSets } from './OefeningSets'
import { RustTimer, type Rust } from './RustTimer'
import { TrainingSamenvatting } from './Samenvatting'
import './training-modus.css'

interface TrainingModusProps {
  lidId: string
  schema: AppSchema
  dag: AppSchemaDag
  historie: Record<string, OefeningHistorie>
  onInfo: (o: AppOefening) => void
  onStop: () => void
  onOpgeslagen: () => void
}

interface Concept {
  invoer: Invoer
  start: number
}

const conceptSleutel = (schemaId: string, dag: number) => `club-training-${schemaId}-${dag}`

/** Een onafgemaakte training blijft bewaard op dit toestel (handig als de app even dicht gaat). */
function leesConcept(sleutel: string): Concept | null {
  try {
    const ruw = window.localStorage.getItem(sleutel)
    const c = ruw ? (JSON.parse(ruw) as Partial<Concept>) : null
    if (!c || typeof c.start !== 'number' || typeof c.invoer !== 'object' || c.invoer === null) return null
    // Ouder dan zes uur: een nieuwe training.
    return Date.now() - c.start < 6 * 3600_000 ? { invoer: c.invoer, start: c.start } : null
  } catch {
    return null
  }
}

function bewaar(sleutel: string, c: Concept | null) {
  try {
    if (c) window.localStorage.setItem(sleutel, JSON.stringify(c))
    else window.localStorage.removeItem(sleutel)
  } catch {
    // Opslag op het toestel is een gemak; zonder werkt de training ook.
  }
}

/** "Start training": set voor set invullen, rusttimer, en een samenvatting na "training klaar". */
export function TrainingModus({ lidId, schema, dag, historie, onInfo, onStop, onOpgeslagen }: TrainingModusProps) {
  const api = useLedenappApi()
  const sleutel = conceptSleutel(schema.id, dag.dag)
  const [concept, setConcept] = useState<Concept>(() => leesConcept(sleutel) ?? { invoer: beginInvoer(dag, historie), start: Date.now() })
  const [rust, setRust] = useState<Rust | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState<{ telling: Samenvatting; duur: number } | null>(null)
  const stappen = useMemo(() => stappenVanDag(dag), [dag])
  const labels = useMemo(() => regelLabels(dag.oefeningen.map((o) => ({ ...o, sleutel: o.id }))), [dag])
  const { klaar: gedaan, totaal } = voortgang(dag, concept.invoer)
  const stopRust = useCallback(() => setRust(null), [])

  useEffect(() => {
    if (!klaar) bewaar(sleutel, concept)
  }, [sleutel, concept, klaar])

  function zetVeld(k: string, deel: Partial<SetVeld>) {
    setConcept((c) => ({ ...c, invoer: { ...c.invoer, [k]: { ...c.invoer[k], ...deel } } }))
  }

  function setGedaan(k: string) {
    const nieuw = { ...concept.invoer, [k]: { ...concept.invoer[k], klaar: true } }
    setConcept((c) => ({ ...c, invoer: nieuw }))
    const sec = stappen.find((s) => s.sleutel === k)?.rustNa ?? 0
    const volgende = volgendeSet(stappen, nieuw, k)
    setRust(sec > 0 && volgende ? { einde: Date.now() + sec * 1000, totaal: sec, volgende } : null)
  }

  async function rondAf() {
    const sets = naarSets(dag, concept.invoer, historie)
    if (sets.length === 0 && !window.confirm('Je hebt nog geen sets afgevinkt. Toch afronden als gedaan?')) return
    setBezig(true)
    setFout(null)
    const duur = Math.round((Date.now() - concept.start) / 1000)
    const afvink = api.trainingAfvinken(lidId, schema.id, dag.dag)
    const r = await stuur(afvink.url, 'POST', { ...afvink.body, sets, duurSec: Math.min(duur, 21600) })
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    bewaar(sleutel, null)
    setRust(null)
    const besten = new Map(Object.entries(historie).map(([id, h]) => [id, h.beste]))
    const namen = new Map(dag.oefeningen.map((o) => [o.oefeningId, o.naam]))
    setKlaar({ telling: samenvatting(sets, besten, namen), duur })
  }

  function stop() {
    if (gedaan > 0 && !window.confirm('Stoppen zonder op te slaan? Je ingevulde sets blijven op dit toestel bewaard.')) return
    onStop()
  }

  if (klaar) return <TrainingSamenvatting dagLetter={dag.letter} telling={klaar.telling} duurSec={klaar.duur} onSluit={onOpgeslagen} />

  const set = (o: AppOefening) => (
    <OefeningSets
      key={o.id} oefening={o} label={labels.get(o.id) ?? ''} historie={historie[o.oefeningId]} invoer={concept.invoer}
      onVeld={zetVeld} onKlaar={setGedaan} onInfo={() => onInfo(o)}
    />
  )

  return (
    <div className="club-lidapp-training">
      <header className="club-lidapp-training-kop">
        <div>
          <p className="club-lidapp-training-boven">{schema.naam}</p>
          <h2 className="club-lidapp-kop">Dag {dag.letter}</h2>
        </div>
        <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={stop} aria-label="Training stoppen">
          <X aria-hidden size={18} />
        </button>
      </header>
      <div className="club-lidapp-training-voortgang" role="progressbar" aria-valuemin={0} aria-valuemax={totaal} aria-valuenow={gedaan} aria-label="Sets gedaan">
        <span style={{ transform: `scaleX(${totaal > 0 ? gedaan / totaal : 0})` }} />
        <small>{gedaan} van {totaal} sets gedaan</small>
      </div>
      {blokken(dag.oefeningen).map((b) =>
        b.items.length === 1 ? (
          set(b.items[0])
        ) : (
          <section key={`blok-${b.items[0].id}`} className="club-lidapp-superset" aria-label={BLOK_LABEL[b.soort]}>
            <p className="club-lidapp-superset-kop">
              <strong>{BLOK_LABEL[b.soort]}</strong> Wissel af: een set van elke oefening, dan pas rust.
            </p>
            {b.items.map(set)}
          </section>
        ),
      )}
      {fout && <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">{fout}</p>}
      <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={rondAf} disabled={bezig}>
        {bezig ? 'Opslaan...' : 'Training klaar'}
      </button>
      {rust && <RustTimer rust={rust} onVerleng={(s) => setRust((r) => (r ? { ...r, einde: r.einde + s * 1000, totaal: r.totaal + s } : r))} onStop={stopRust} />}
    </div>
  )
}
