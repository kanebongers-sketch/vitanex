'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { alternatievenVoor, materiaalVolgorde, overeenkomst } from '@/lib/club/training/alternatieven'
import type { EditorRegel } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import { TRAINING_LABELS, type TrainingLabels } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { OefeningBeeld } from '../OefeningBeeld'
import { SpierChips } from '../SpierChips'
import { Zijpaneel } from '../Zijpaneel'
import './vervang.css'

// "Vervang" in de schema-editor: alternatieven met hetzelfde bewegingspatroon
// en dezelfde hoofdspier (alternatieven.ts), met het materiaal dat dit lid en
// de club het meest gebruiken bovenaan. De editor geeft de bibliotheek en de
// regels van het schema een keer door via VervangContext.

export interface VervangBron {
  /** De actieve oefeningen van de bibliotheek. */
  oefeningen: readonly Oefening[]
  /** De regels van het schema zoals ze nu in de editor staan. */
  regels: readonly EditorRegel[]
}

export const VervangContext = createContext<VervangBron | null>(null)

interface VervangOefeningProps {
  regel: EditorRegel
  oefening: Oefening | undefined
  onVervang: (oefeningId: string) => void
}

/** Gewrichten die het alternatief extra belast ten opzichte van het origineel (voor de trainer). */
function extraBelast(origineel: Oefening, k: Oefening, l: TrainingLabels, belastOok: (zones: string) => string): string | null {
  const extra = k.belast.filter((z) => !origineel.belast.includes(z))
  return extra.length > 0 ? belastOok(extra.map((z) => l.zone[z].toLowerCase()).join(', ')) : null
}

function Lijst({ origineel, bron, dag, onKies }: { origineel: Oefening; bron: VervangBron; dag: number; onKies: (o: Oefening) => void }) {
  const t = useTekst(SCHEMA_EDITOR).vervang
  const l = useTekst(TRAINING_LABELS)
  const lijst = useMemo(() => {
    const perId = new Map(bron.oefeningen.map((o) => [o.id, o]))
    const inSchema = bron.regels.map((r) => perId.get(r.oefeningId)).filter((o): o is Oefening => o !== undefined)
    const opDag = new Set(bron.regels.filter((r) => r.dag === dag).map((r) => r.oefeningId))
    return alternatievenVoor(origineel, bron.oefeningen, { uitsluiten: opDag, volgorde: materiaalVolgorde(inSchema, bron.oefeningen), max: 12 })
  }, [origineel, bron, dag])

  if (lijst.length === 0) {
    return <p className="club-leeg">{t.geen}</p>
  }
  return (
    <ul className="club-lijst club-training-vervanglijst" aria-label={t.alternatieven(origineel.naam)}>
      {lijst.map((o) => {
        const zelfde = overeenkomst(origineel, o) === 2
        const letOp = extraBelast(origineel, o, l, t.belastOok)
        return (
          <li key={o.id}>
            <button type="button" className="club-rij club-training-kiesrij" onClick={() => onKies(o)}>
              <OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="klein" decoratief />
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{o.naam}</span>
                <SpierChips primair={o.spierenPrimair} spiergroep={o.spiergroep} />
                <span className="club-rij-sub">
                  {l.materiaal[o.materiaal]} · {l.niveau[o.niveau]}
                  {letOp && <span className="club-training-vervang-let"> · {letOp}</span>}
                </span>
              </span>
              <span className="club-training-vervang-match" data-zelfde={zelfde || undefined}>{zelfde ? t.zelfdeSpier : t.vergelijkbaar}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** Knop "Vervang" bij een oefening in de editor, met een zijpaneel vol alternatieven. */
export function VervangOefening({ regel, oefening, onVervang }: VervangOefeningProps) {
  const bron = useContext(VervangContext)
  const t = useTekst(SCHEMA_EDITOR).vervang
  const l = useTekst(TRAINING_LABELS)
  const [open, setOpen] = useState(false)
  const sluit = useCallback(() => setOpen(false), [])
  if (!bron || !oefening) return null

  function kies(o: Oefening) {
    onVervang(o.id)
    setOpen(false)
  }

  const patroon = oefening.patroon ? l.patroon[oefening.patroon].toLowerCase() : t.zelfdeSpiergroep
  return (
    <>
      <button type="button" className="club-knop club-knop--stil club-knop--klein club-training-vervangknop" onClick={() => setOpen(true)} aria-label={t.vervangen(oefening.naam)} title={t.vervangenTitel}>
        <ArrowLeftRight aria-hidden size={15} />
        <span>{t.knop}</span>
      </button>
      {open && (
        <Zijpaneel titel={oefening.naam} boventitel={t.boventitel} onSluit={sluit} breed>
          <p className="club-hint">{t.uitleg(patroon)}</p>
          <Lijst origineel={oefening} bron={bron} dag={regel.dag} onKies={kies} />
        </Zijpaneel>
      )}
    </>
  )
}
