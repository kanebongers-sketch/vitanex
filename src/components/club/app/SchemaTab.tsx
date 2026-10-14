'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Undo2 } from 'lucide-react'
import type { AppSchema } from '@/lib/club/app/data'
import type { AppOefening } from '@/lib/club/app/schema'
import { gedaanVandaag, volgendeDag, voorschrift, dagLetter, type AppLog } from '@/lib/club/app/schema'
import { dagKort, dagSleutel } from '@/lib/club/cijfers/tijd'
import { BeeldBron, OefeningBeeld, RepdbVermelding } from '@/components/club/training/OefeningBeeld'
import { bronnenVan } from '@/lib/club/training/beeld'
import { OefeningBlad } from './OefeningBlad'
import { stuur } from './verzoek'

// Het schema in de ledenapp: kies dag A, B, C..., zie de oefeningen en vink
// af dat je de training gedaan hebt (club_trainingslog). Tik op een oefening
// voor de bewegende tekening met uitleg.

interface Props {
  lidId: string
  schema: AppSchema | null
  logs: AppLog[]
  nu: string
}

export function SchemaTab({ lidId, schema, logs, nu }: Props) {
  const router = useRouter()
  const [bezig, startBezig] = useTransition()
  const [fout, setFout] = useState<string | null>(null)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [open, setOpen] = useState<AppOefening | null>(null)
  const sluit = useCallback(() => setOpen(null), [])
  if (!schema || schema.dagen.length === 0) {
    return (
      <div className="club-lidapp-tab">
        <h2 className="club-lidapp-kop">Schema</h2>
        <p className="club-lidapp-leeg">Je hebt nog geen actief schema. Vraag je trainer om er een voor je te maken.</p>
      </div>
    )
  }
  const voorstel = volgendeDag(schema.dagen, logs, schema.id)
  const dagNr = gekozen ?? voorstel ?? schema.dagen[0].dag
  const dag = schema.dagen.find((d) => d.dag === dagNr) ?? schema.dagen[0]
  const nuDatum = new Date(nu)
  const gedaan = gedaanVandaag(logs, schema.id, dag.dag, nuDatum)
  const recent = logs.filter((l) => l.schemaId === schema.id).slice(0, 4)
  const schemaBronnen = bronnenVan(schema.dagen.flatMap((d) => d.oefeningen.map((o) => o.beeld)))

  function vink() {
    setFout(null)
    startBezig(async () => {
      const r = gedaan ? await stuur(`/api/club/app/training/${gedaan.id}`, 'DELETE') : await stuur('/api/club/app/training', 'POST', { lidId, schemaId: schema?.id, dag: dag.dag })
      if (r.ok) router.refresh()
      else setFout(r.fout)
    })
  }

  return (
    <div className="club-lidapp-tab">
      <h2 className="club-lidapp-kop">Schema</h2>
      <p className="club-lidapp-schemanaam">
        {schema.naam}
        {schema.weken ? <span> · {schema.weken} weken</span> : null}
      </p>
      <div className="club-lidapp-dagkeuze" role="group" aria-label="Trainingsdag">
        {schema.dagen.map((d) => (
          <button key={d.dag} type="button" aria-pressed={d.dag === dag.dag} onClick={() => setGekozen(d.dag)}>
            Dag {d.letter}
            {d.dag === voorstel && <span className="club-lidapp-stip" aria-label="volgende" />}
          </button>
        ))}
      </div>
      <ol className="club-lidapp-oefeningen">
        {dag.oefeningen.map((o, i) => (
          <li key={o.id}>
            <button type="button" className="club-lidapp-oefening" onClick={() => setOpen(o)} aria-haspopup="dialog">
              <span className="club-lidapp-nr" aria-hidden>
                {i + 1}
              </span>
              <OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="klein" decoratief />
              <span className="club-lidapp-oefening-tekst">
                <strong>{o.naam}</strong>
                <span>{voorschrift(o) || 'Volgens je trainer'}</span>
                {(o.notitie ?? o.aandachtspunten) && <em>{o.notitie ?? o.aandachtspunten}</em>}
              </span>
              <ChevronRight aria-hidden size={18} className="club-lidapp-oefening-pijl" />
            </button>
          </li>
        ))}
      </ol>
      <BeeldBron className="club-lidapp-beeldbron" bronnen={bronnenVan(dag.oefeningen.map((o) => o.beeld))} />
      <button type="button" className={`club-lidapp-knop club-lidapp-knop--breed ${gedaan ? 'club-lidapp-knop--klaar' : 'club-lidapp-knop--primair'}`} onClick={vink} disabled={bezig || gedaan !== null}>
        {gedaan ? <Check aria-hidden size={18} /> : null}
        {bezig ? 'Bezig...' : gedaan ? `Dag ${dag.letter} gedaan vandaag` : `Training dag ${dag.letter} gedaan`}
      </button>
      {gedaan && (
        <button type="button" className="club-lidapp-tekstknop" onClick={vink} disabled={bezig}>
          <Undo2 aria-hidden size={14} /> Ongedaan maken
        </button>
      )}
      {fout && (
        <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">
          {fout}
        </p>
      )}
      {recent.length > 0 && (
        <section className="club-lidapp-recent" aria-label="Laatst gedaan">
          <h3>Laatst gedaan</h3>
          <ul>
            {recent.map((l) => (
              <li key={l.id}>
                <span>{l.dag ? `Dag ${dagLetter(l.dag)}` : 'Training'}</span>
                <span>{dagKort(dagSleutel(new Date(l.op)))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {schemaBronnen.includes('repdb') && <RepdbVermelding className="club-lidapp-beeldbron" />}
      {open && <OefeningBlad oefening={open} onSluit={sluit} />}
    </div>
  )
}
