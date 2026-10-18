'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, ClipboardList, Play, Undo2 } from 'lucide-react'
import type { AppSchema } from '@/lib/club/app/data'
import type { AppOefening, OefeningHistorie } from '@/lib/club/app/schema'
import { gedaanVandaag, volgendeDag, voorschrift, dagLetter, type AppLog } from '@/lib/club/app/schema'
import { dagKort, dagSleutel } from '@/lib/club/cijfers/tijd'
import { BeeldBron, OefeningBeeld, RepdbVermelding } from '@/components/club/training/OefeningBeeld'
import { bronnenVan } from '@/lib/club/training/beeld'
import { useKernpunten } from '@/components/club/training/coaching/useKernpunten'
import { OefeningBlad } from './OefeningBlad'
import { stuur } from './verzoek'
import { useLedenappApi } from './LedenappApi'
import { LegeStaat } from './LegeStaat'
import { TrainingModus } from './training/TrainingModus'

// Het schema in de ledenapp: kies dag A, B, C..., zie de oefeningen en start
// de training: per set gewicht en herhalingen invullen met de vorige keer
// ernaast, rusttimer en een samenvatting (club_trainingslog + club_set_logs).
// Alleen afvinken kan ook. Onder elke oefening
// staan de twee belangrijkste kernpunten, zodat je ze ziet tijdens het trainen;
// tik op een oefening voor de bewegende illustratie met de volledige coaching.

interface Props {
  lidId: string
  schema: AppSchema | null
  logs: AppLog[]
  /** Per oefening de vorige keer en het beste resultaat (voor de velden en records). */
  historie: Record<string, OefeningHistorie>
  nu: string
}

export function SchemaTab({ lidId, schema, logs, historie, nu }: Props) {
  const api = useLedenappApi()
  const router = useRouter()
  const [bezig, startBezig] = useTransition()
  const [fout, setFout] = useState<string | null>(null)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [open, setOpen] = useState<AppOefening | null>(null)
  const [traint, setTraint] = useState(false)
  const sluit = useCallback(() => setOpen(null), [])
  const kernpunten = useKernpunten(schema?.dagen.flatMap((d) => d.oefeningen.map((o) => o.naam)) ?? [])
  if (!schema || schema.dagen.length === 0) {
    return (
      <div className="club-lidapp-tab">
        <h2 className="club-lidapp-kop">Schema</h2>
        <LegeStaat Icoon={ClipboardList} titel="Nog geen schema">
          Je hebt nog geen actief schema. Vraag je trainer om er een voor je te maken.
        </LegeStaat>
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
      const afvink = api.trainingAfvinken(lidId, schema?.id, dag.dag)
      const r = gedaan ? await stuur(api.trainingWeg(gedaan.id), 'DELETE') : await stuur(afvink.url, 'POST', afvink.body)
      if (r.ok) router.refresh()
      else setFout(r.fout)
    })
  }

  if (traint) {
    return (
      <div className="club-lidapp-tab">
        <TrainingModus
          lidId={lidId} schema={schema} dag={dag} historie={historie} onInfo={setOpen} onStop={() => setTraint(false)}
          onOpgeslagen={() => {
            setTraint(false)
            router.refresh()
          }}
        />
        {open && <OefeningBlad oefening={open} onSluit={sluit} />}
      </div>
    )
  }

  return (
    <div className="club-lidapp-tab">
      <h2 className="club-lidapp-kop">Schema</h2>
      <p className="club-lidapp-schemanaam">
        <strong>{schema.naam}</strong>
        {schema.weken ? <span>{schema.weken} weken</span> : null}
        <span>
          {dag.oefeningen.length} {dag.oefeningen.length === 1 ? 'oefening' : 'oefeningen'}
        </span>
      </p>
      <div className="club-lidapp-dagkeuze" role="group" aria-label="Trainingsdag">
        {schema.dagen.map((d) => (
          <button key={d.dag} type="button" aria-pressed={d.dag === dag.dag} onClick={() => setGekozen(d.dag)}>
            Dag {d.letter}
            {d.dag === voorstel && (
              <>
                <span className="club-lidapp-stip" aria-hidden />
                <span className="club-sr"> (volgende)</span>
              </>
            )}
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
                <OefeningHint notitie={o.notitie} punten={kernpunten[o.naam]} aandachtspunten={o.aandachtspunten} />
              </span>
              <ChevronRight aria-hidden size={18} className="club-lidapp-oefening-pijl" />
            </button>
          </li>
        ))}
      </ol>
      <BeeldBron className="club-lidapp-beeldbron" bronnen={bronnenVan(dag.oefeningen.map((o) => o.beeld))} />
      {gedaan ? (
        <button type="button" className="club-lidapp-knop club-lidapp-knop--breed club-lidapp-knop--klaar" disabled>
          <Check aria-hidden size={18} /> Dag {dag.letter} gedaan vandaag
        </button>
      ) : (
        <div className="club-lidapp-startrij">
          <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={() => setTraint(true)} disabled={bezig}>
            <Play aria-hidden size={18} /> Start training dag {dag.letter}
          </button>
          <button type="button" className="club-lidapp-tekstknop" onClick={vink} disabled={bezig}>
            {bezig ? 'Bezig...' : 'Alleen afvinken, zonder sets'}
          </button>
        </div>
      )}
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

/** Onder een oefening: de notitie van de trainer, anders de eerste twee kernpunten, anders de aandachtspunten. */
function OefeningHint({ notitie, punten, aandachtspunten }: { notitie: string | null; punten: readonly string[] | undefined; aandachtspunten: string | null }) {
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
