'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ClipboardList, CloudUpload, MessageSquareText, Play, Undo2 } from 'lucide-react'
import type { AppSchema } from '@/lib/club/app/data'
import type { AppOefening, OefeningHistorie } from '@/lib/club/app/schema'
import { gedaanVandaag, volgendeDag, dagLetter, type AppLog } from '@/lib/club/app/schema'
import { dagSleutel } from '@/lib/club/cijfers/tijd'
import { dagKortIn } from '@/lib/club/app/regels'
import { BeeldBron, RepdbVermelding } from '@/components/club/training/OefeningBeeld'
import { bronnenVan } from '@/lib/club/training/beeld'
import { WAAROM_KOP } from '@/lib/club/training/voorstel-uitleg'
import { useKernpunten } from '@/components/club/training/coaching/useKernpunten'
import { OefeningBlad } from './OefeningBlad'
import { stuur } from './verzoek'
import { useLedenappApi } from './LedenappApi'
import { LegeStaat } from './LegeStaat'
import { TrainingModus } from './training/TrainingModus'
import { rondeDezeWeek } from '@/lib/club/ontwerp/reeks'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { SCHEMA_WEERGAVE } from '@/lib/aiyourgym/taal/woorden/club/schema-weergave'
import { DiepteRing } from '@/components/club/ontwerp/DiepteRing'
import { SchemaStappen } from './SchemaStappen'
import { useWachtrij, type Wachtrij } from './training/useWachtrij'
import { EigenSchema } from './eigen-schema/EigenSchema'

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
  // Trainingen die zonder bereik werden afgerond: gaan vanzelf de deur uit zodra er verbinding is.
  const wachtrij = useWachtrij(useCallback(() => router.refresh(), [router]))
  const taal = useTaal()
  const t = LEDENAPP[taal].schema
  const a = LEDENAPP[taal].algemeen
  const w = SCHEMA_WEERGAVE[taal].app
  const kernpunten = useKernpunten(schema?.dagen.flatMap((d) => d.oefeningen.map((o) => o.naam)) ?? [])
  if (!schema || schema.dagen.length === 0) {
    return (
      <div className="club-lidapp-tab">
        <h2 className="club-lidapp-kop">{t.kop}</h2>
        {/* In de echte ledenapp maakt het lid zelf een schema; in de voorvertoning in Club niet. */}
        {api.lidTraining ? (
          <EigenSchema maker={null} />
        ) : (
          <LegeStaat Icoon={ClipboardList} titel={t.geenSchema}>
            {t.geenSchemaUitleg}
          </LegeStaat>
        )}
      </div>
    )
  }
  const voorstel = volgendeDag(schema.dagen, logs, schema.id)
  const dagNr = gekozen ?? voorstel ?? schema.dagen[0].dag
  const dag = schema.dagen.find((d) => d.dag === dagNr) ?? schema.dagen[0]
  const nuDatum = new Date(nu)
  const gedaan = gedaanVandaag(logs, schema.id, dag.dag, nuDatum)
  const recent = logs.filter((l) => l.schemaId === schema.id).slice(0, 4)
  const ronde = rondeDezeWeek(schema.dagen, logs, schema.id, nuDatum)
  const dezeWeek = new Set(ronde.dagen.filter((d) => d.gedaan).map((d) => d.dag))
  const schemaBronnen = bronnenVan(schema.dagen.flatMap((d) => d.oefeningen.map((o) => o.beeld)))
  const setsTotaal = dag.oefeningen.reduce((som, o) => som + (o.sets ?? 0), 0)

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
          lidId={lidId} schema={schema} dag={dag} historie={historie} logs={logs} kernpunten={kernpunten} wachtrij={wachtrij}
          onInfo={setOpen} onStop={() => setTraint(false)}
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
      <h2 className="club-lidapp-kop">{t.kop}</h2>
      <p className="club-lidapp-schemanaam">
        <strong>{schema.naam}</strong>
        {schema.weken ? <span>{t.weken(schema.weken)}</span> : null}
        <span>{t.oefeningen(dag.oefeningen.length)}</span>
      </p>
      <EigenSchema maker={schema.maker} />
      {schema.notitie && <SchemaNotitie notitie={schema.notitie} vanTrainer={t.vanTrainer} waarom={t.waarom} />}
      <div className="club-lidapp-dagkeuze" role="group" aria-label={t.trainingsdag}>
        {schema.dagen.map((d) => (
          <button key={d.dag} type="button" aria-pressed={d.dag === dag.dag} onClick={() => setGekozen(d.dag)} data-week-gedaan={dezeWeek.has(d.dag) || undefined}>
            {dezeWeek.has(d.dag) && <Check aria-hidden size={14} className="club-lidapp-dagvink" />}
            {t.dag(d.letter)}
            {dezeWeek.has(d.dag) && <span className="club-sr">{t.dezeWeekGedaan}</span>}
            {d.dag === voorstel && (
              <>
                <span className="club-lidapp-stip" aria-hidden />
                <span className="club-sr">{t.volgende}</span>
              </>
            )}
          </button>
        ))}
      </div>
      <section className="club-lidapp-vandaag" aria-labelledby="vandaag-kop">
        <div className="club-lidapp-vandaag-kop">
          <div>
            <p className="club-lidapp-label">{dag.dag === voorstel ? w.volgende : t.trainingsdag}</p>
            <h3 id="vandaag-kop">{t.dag(dag.letter)}</h3>
            <p className="club-lidapp-vandaag-meta">
              {w.stappen(dag.oefeningen.length)}
              {setsTotaal > 0 && <span>{w.sets(setsTotaal)}</span>}
            </p>
          </div>
          <DiepteRing gedaan={ronde.gedaan} totaal={ronde.totaal} label={w.week(ronde.gedaan, ronde.totaal)} maat={84} />
        </div>
        {gedaan ? (
          <div className="club-lidapp-startrij">
            <button type="button" className="club-lidapp-knop club-lidapp-knop--breed club-lidapp-knop--klaar" disabled>
              <Check aria-hidden size={18} /> {t.dagGedaan(dag.letter)}
            </button>
            <button type="button" className="club-lidapp-tekstknop" onClick={vink} disabled={bezig}>
              <Undo2 aria-hidden size={14} /> {bezig ? a.bezig : t.ongedaan}
            </button>
          </div>
        ) : (
          <div className="club-lidapp-startrij">
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={() => setTraint(true)} disabled={bezig}>
              <Play aria-hidden size={18} /> {t.start(dag.letter)}
            </button>
            <button type="button" className="club-lidapp-tekstknop" onClick={vink} disabled={bezig}>
              {bezig ? a.bezig : t.alleenAfvinken}
            </button>
          </div>
        )}
      </section>
      <SchemaStappen dag={dag} kernpunten={kernpunten} onOpen={setOpen} />
      <BeeldBron className="club-lidapp-beeldbron" bronnen={bronnenVan(dag.oefeningen.map((o) => o.beeld))} />
      {fout && (
        <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">
          {fout}
        </p>
      )}
      <WachtrijStatus wachtrij={wachtrij} t={t} sluiten={a.sluiten} />
      {recent.length > 0 && (
        <section className="club-lidapp-recent" aria-label={t.laatstGedaan}>
          <h3>{t.laatstGedaan}</h3>
          <ul>
            {recent.map((l) => (
              <li key={l.id}>
                <span>{l.dag ? t.dag(dagLetter(l.dag)) : t.training}</span>
                <span>{dagKortIn(dagSleutel(new Date(l.op)), taal)}</span>
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

/** De notitie van de trainer bij het hele schema, of de uitleg "Waarom dit schema". Ingeklapt, een tik opent hem. */
function SchemaNotitie({ notitie, vanTrainer, waarom }: { notitie: string; vanTrainer: string; waarom: string }) {
  const regels = notitie.split('\n')
  const isWaarom = regels[0] === WAAROM_KOP
  const tekst = (isWaarom ? regels.slice(1) : regels).join('\n').trim()
  return (
    <details className="club-lidapp-schemanotitie">
      <summary>
        <MessageSquareText aria-hidden size={17} />
        {isWaarom ? waarom : vanTrainer}
        <ChevronDown aria-hidden size={16} className="club-lidapp-schemanotitie-pijl" />
      </summary>
      <p>{tekst}</p>
    </details>
  )
}

/** Rustig onder de startknop: een training die nog op bereik wacht, of die de server weigerde. */
function WachtrijStatus({ wachtrij, t, sluiten }: { wachtrij: Wachtrij; t: (typeof LEDENAPP)['nl']['schema']; sluiten: string }) {
  if (wachtrij.fout) {
    return (
      <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">
        {wachtrij.fout}{' '}
        <button type="button" className="club-lidapp-tekstknop" onClick={wachtrij.sluitFout}>{sluiten}</button>
      </p>
    )
  }
  if (wachtrij.aantal === 0) return null
  return (
    <p className="club-tm-wacht" role="status">
      <CloudUpload aria-hidden size={16} />
      {wachtrij.aantal === 1 ? t.wachtEen(wachtrij.online) : t.wachtMeer(wachtrij.aantal, wachtrij.online)}
    </p>
  )
}
