'use client'

import { ChevronRight } from 'lucide-react'
import type { AppOefening, AppSchemaDag } from '@/lib/club/app/schema'
import { voorschrift } from '@/lib/club/app/schema'
import { oefeningPlekken } from '@/lib/club/app/training-modus'
import { blokken } from '@/lib/club/training/blokken'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { SCHEMA_WEERGAVE } from '@/lib/aiyourgym/taal/woorden/club/schema-weergave'
import type { KernpuntenPerNaam } from '@/components/club/training/coaching/useKernpunten'
import { OefeningBeeld } from '@/components/club/training/OefeningBeeld'
import { RenderDuim } from '@/components/club/training/repspeler/OefeningVoorbeeld'
import { TempoCurve } from '@/components/club/training/TempoCurve'

// De training van een dag als stappen onder elkaar: per oefening het beeld van
// de Blender-render groot links, de naam, het voorschrift, het tempo als curve
// en de eerste twee kernpunten. Een superset of circuit staat als een blok met
// een rail en een letter, zoals op de vloer (A, B1 en B2). Een tik opent de
// oefening met de bewegende speler en de volledige coaching.

interface SchemaStappenProps {
  dag: AppSchemaDag
  kernpunten: KernpuntenPerNaam
  onOpen: (o: AppOefening) => void
}

export function SchemaStappen({ dag, kernpunten, onOpen }: SchemaStappenProps) {
  const w = useTekst(SCHEMA_WEERGAVE).app
  const plekken = oefeningPlekken(dag)
  const stap = (o: AppOefening) => <Stap key={o.id} oefening={o} label={plekken.get(o.id)?.label ?? ''} punten={kernpunten[o.naam]} onOpen={onOpen} />
  return (
    <ol className="club-lidapp-stappen">
      {blokken(dag.oefeningen).map((b) =>
        b.items.length === 1 ? (
          stap(b.items[0])
        ) : (
          <li key={`blok-${b.items[0].id}`} className="club-lidapp-blokstap" data-soort={b.soort}>
            <p className="club-lidapp-blokstap-kop">
              <span className="club-lidapp-blokstap-letter" aria-hidden>{(plekken.get(b.items[0].id)?.label ?? '').replace(/\d+$/, '')}</span>
              <strong>{b.soort === 'circuit' ? w.blok.circuit : w.blok.superset}</strong>
              <span>{w.omEnOm}</span>
            </p>
            <ol className="club-lidapp-stappen">{b.items.map(stap)}</ol>
          </li>
        ),
      )}
    </ol>
  )
}

interface StapProps {
  oefening: AppOefening
  label: string
  punten: readonly string[] | undefined
  onOpen: (o: AppOefening) => void
}

function Stap({ oefening: o, label, punten, onOpen }: StapProps) {
  const taal = useTaal()
  const t = LEDENAPP[taal].schema
  return (
    <li className="club-lidapp-stap">
      <button type="button" className="club-lidapp-oefening" onClick={() => onOpen(o)} aria-haspopup="dialog">
        <span className="club-lidapp-stap-beeld">
          <RenderDuim naam={o.naam} anders={<OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="klein" decoratief />} />
          <span className="club-lidapp-nr" aria-hidden>{label}</span>
        </span>
        <span className="club-lidapp-oefening-tekst">
          <strong>{o.naam}</strong>
          <span>{voorschrift(o, taal) || t.volgensTrainer}</span>
          <TempoCurve tempo={o.tempo} />
          <Hint notitie={o.notitie} punten={punten} aandachtspunten={o.aandachtspunten} />
        </span>
        <ChevronRight aria-hidden size={18} className="club-lidapp-oefening-pijl" />
      </button>
    </li>
  )
}

/** Onder een oefening: de notitie van de trainer, anders de eerste twee kernpunten, anders de aandachtspunten. */
function Hint({ notitie, punten, aandachtspunten }: { notitie: string | null; punten: readonly string[] | undefined; aandachtspunten: string | null }) {
  if (notitie) return <em>{notitie}</em>
  if (punten && punten.length > 0) {
    return (
      <span className="club-lidapp-kernpunten">
        {punten.slice(0, 2).map((p, i) => (
          <span key={i}>
            <b aria-hidden>{i + 1}</b> {p}
          </span>
        ))}
      </span>
    )
  }
  return aandachtspunten ? <em>{aandachtspunten}</em> : null
}
