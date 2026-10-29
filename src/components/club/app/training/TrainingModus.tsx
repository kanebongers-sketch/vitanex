'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Flag, Settings2, WifiOff, X } from 'lucide-react'
import type { AppSchema } from '@/lib/club/app/data'
import type { AppLog, AppOefening, AppSchemaDag, OefeningHistorie } from '@/lib/club/app/schema'
import { nieuweRecords, samenvatting, toonKlok, type NieuwRecord, type Samenvatting } from '@/lib/club/app/sets'
import { naarSets, oefeningPlekken, stappenVanDag, volgendeOpen, voortgang, type SetVeld } from '@/lib/club/app/training-modus'
import { conceptSleutel, verlengRust, verstreken } from '@/lib/club/app/training-sessie'
import { uitkomstVan } from '@/lib/club/app/wachtrij'
import { weekVoortgang, type WeekVoortgang } from '@/lib/club/app/week'
import { wisselOefening, type AppAlternatief } from '@/lib/club/training/alternatieven'
import type { KernpuntenPerNaam } from '@/components/club/training/coaching/useKernpunten'
import { AndereOefening } from '../AndereOefening'
import { stuur } from '../verzoek'
import { useLedenappApi } from '../LedenappApi'
import { OefeningScherm } from './OefeningScherm'
import { RustTimer } from './RustTimer'
import { TrainingSamenvatting, type OpslagStatus } from './Samenvatting'
import { TrainingMenu } from './TrainingMenu'
import { bewaarConcept, laadConcept } from './concept-opslag'
import { useSchermAan, useSignaal, useVeeg } from './toestel'
import type { Wachtrij } from './useWachtrij'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { TRAINING } from '@/lib/aiyourgym/taal/woorden/ledenapp/training'
import './training-modus.css'

interface TrainingModusProps {
  lidId: string
  schema: AppSchema
  dag: AppSchemaDag
  historie: Record<string, OefeningHistorie>
  logs: readonly AppLog[]
  kernpunten: KernpuntenPerNaam
  wachtrij: Wachtrij
  onInfo: (o: AppOefening) => void
  onStop: () => void
  onOpgeslagen: () => void
}

interface Klaar {
  telling: Samenvatting
  records: NieuwRecord[]
  duurSec: number
  week: WeekVoortgang
  status: OpslagStatus
}

const LEEG: SetVeld = { kg: '', herh: '', tijd: '', klaar: false }

/** Elke kwart seconde de tijd, en meteen als de app weer in beeld komt (scherm was uit). */
function useNu(): number {
  const [nu, setNu] = useState(() => Date.now())
  useEffect(() => {
    const tik = () => setNu(Date.now())
    const id = window.setInterval(tik, 250)
    document.addEventListener('visibilitychange', tik)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tik)
    }
  }, [])
  return nu
}

/** "Start training": een oefening per scherm, set voor set, met rust en een korte samenvatting. */
export function TrainingModus(p: TrainingModusProps) {
  const { schema, historie } = p
  const api = useLedenappApi()
  const taal = useTaal()
  const t = TRAINING[taal]
  const sleutel = conceptSleutel(schema.id, p.dag.dag)
  const [concept, setConcept] = useState(() => laadConcept(sleutel, p.dag, historie))
  // De dag zoals het lid hem vandaag doet: met de andere oefening als een toestel bezet was.
  const dag = useMemo(() => Object.entries(concept.wissels).reduce((d, [regel, alt]) => wisselOefening(d, regel, alt), p.dag), [p.dag, concept.wissels])
  const [menu, setMenu] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState<Klaar | null>(null)
  const [richting, setRichting] = useState<'vooruit' | 'terug'>('vooruit')
  const wortel = useRef<HTMLDivElement>(null)
  const nu = useNu()
  const signaal = useSignaal()
  const scherm = useSchermAan()
  const stappen = useMemo(() => stappenVanDag(dag), [dag])
  const plekken = useMemo(() => oefeningPlekken(dag), [dag])
  const { klaar: gedaan, totaal } = voortgang(dag, concept.invoer)
  const index = Math.min(concept.scherm, dag.oefeningen.length - 1)
  const o = dag.oefeningen[index]
  const isLaatste = index === dag.oefeningen.length - 1
  const { geef } = signaal

  useEffect(() => {
    if (!klaar) bewaarConcept(sleutel, concept)
  }, [sleutel, concept, klaar])

  // Het signaal op het einde van de rust; een rust die voorbij ging terwijl het scherm uit was, piept niet achteraf.
  useEffect(() => {
    const r = concept.rust
    if (!r) return
    const einde = r.start + r.sec * 1000
    const wacht = einde - Date.now()
    if (wacht <= 0) return
    const id = window.setTimeout(() => Date.now() - einde < 3000 && geef(), wacht)
    return () => window.clearTimeout(id)
  }, [concept.rust, geef])

  const naar = useCallback((i: number) => {
    const doel = Math.max(0, Math.min(dag.oefeningen.length - 1, i))
    if (doel === index) return
    setRichting(doel > index ? 'vooruit' : 'terug')
    setConcept((c) => ({ ...c, scherm: doel }))
    wortel.current?.scrollIntoView({ block: 'start' })
  }, [dag.oefeningen.length, index])
  const veeg = useVeeg(() => naar(index + 1), () => naar(index - 1))
  const stopRust = useCallback(() => setConcept((c) => ({ ...c, rust: null })), [])

  /** Toestel bezet: alleen voor deze training een andere oefening. Gedane sets blijven, open sets beginnen zonder gewicht. */
  function wissel(regelId: string, alt: AppAlternatief) {
    setConcept((c) => ({
      ...c,
      wissels: { ...c.wissels, [regelId]: alt },
      invoer: Object.fromEntries(Object.entries(c.invoer).map(([k, v]) => [k, k.startsWith(`${regelId}:`) && !v.klaar ? { ...v, kg: '' } : v])),
    }))
  }

  function zetVeld(k: string, deel: Partial<SetVeld>) {
    setConcept((c) => ({ ...c, invoer: { ...c.invoer, [k]: { ...(c.invoer[k] ?? LEEG), ...deel } } }))
  }

  /** Set klaar: rust starten (superset pas na de ronde) en door naar de oefening van de volgende open set. Met `rustVanaf` telt de rust vanaf dat moment. */
  function setGedaan(k: string, rustVanaf?: number) {
    signaal.ontgrendel()
    const invoer = { ...concept.invoer, [k]: { ...(concept.invoer[k] ?? LEEG), klaar: true } }
    const sec = stappen.find((s) => s.sleutel === k)?.rustNa ?? 0
    const volgende = volgendeOpen(stappen, invoer, k)
    const ander = volgende ? dag.oefeningen.findIndex((x) => x.id === volgende.regelId) : -1
    const nu = Date.now()
    const start = rustVanaf !== undefined && rustVanaf <= nu ? rustVanaf : nu
    const rust = sec > 0 && volgende ? { start, sec, volgende: t.volgendeSet(volgende.set, volgende.naam) } : null
    if (ander >= 0 && ander !== index) {
      setRichting(ander > index ? 'vooruit' : 'terug')
      wortel.current?.scrollIntoView({ block: 'start' })
    }
    setConcept((c) => ({ ...c, invoer: { ...c.invoer, [k]: invoer[k] }, scherm: ander >= 0 ? ander : c.scherm, rust }))
  }

  async function rondAf() {
    const sets = naarSets(dag, concept.invoer, historie)
    if (sets.length === 0 && !window.confirm(t.geenSets)) return
    setMenu(false)
    setBezig(true)
    setFout(null)
    const afgerondOp = Date.now()
    const duurSec = Math.min(verstreken(concept.start, afgerondOp), 21600)
    const afvink = api.trainingAfvinken(p.lidId, schema.id, dag.dag)
    // Vast id en afrondmoment: opnieuw versturen (wachtrij) slaat niets dubbel op en houdt de juiste datum.
    const body = { ...afvink.body, sets, duurSec, clientId: concept.id, afgerondOp }
    const r = p.wachtrij.online ? await stuur(afvink.url, 'POST', body) : null
    let status: OpslagStatus = 'opgeslagen'
    if (!r || !r.ok) {
      if (r && uitkomstVan(false, r.status) === 'geweigerd') {
        setBezig(false)
        return setFout(r.fout)
      }
      if (!p.wachtrij.zetErin({ url: afvink.url, body, omschrijving: t.omschrijving(dag.letter) })) {
        setBezig(false)
        return setFout(t.nietBewaard)
      }
      status = 'wacht'
    }
    bewaarConcept(sleutel, null)
    const besten = new Map(Object.entries(historie).map(([id, h]) => [id, h.beste]))
    const namen = new Map(dag.oefeningen.map((x) => [x.oefeningId, x.naam]))
    setBezig(false)
    setKlaar({
      telling: samenvatting(sets, besten, namen),
      records: nieuweRecords(sets, besten, namen),
      duurSec,
      week: weekVoortgang(p.logs, schema.dagen.length, new Date(), 1),
      status,
    })
  }

  function stop() {
    if (gedaan > 0 && !window.confirm(t.stoppenVraag)) return
    p.onStop()
  }

  if (klaar) return <TrainingSamenvatting dagLetter={dag.letter} schemaNaam={schema.naam} {...klaar} onSluit={p.onOpgeslagen} />
  if (!o) return null

  const allesGedaan = totaal > 0 && gedaan === totaal
  return (
    <div className="club-tm" ref={wortel}>
      <header className="club-tm-kop">
        <button type="button" className="club-tm-rondknop" onClick={stop} aria-label={t.kop.stoppen}>
          <X aria-hidden size={20} />
        </button>
        <p className="club-tm-kop-midden">
          <strong>{t.kop.dag(dag.letter)}</strong>
          <span aria-label={t.kop.tijd}>{toonKlok(verstreken(concept.start, nu))}</span>
        </p>
        <button type="button" className="club-tm-rondknop" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label={t.kop.instellingen}>
          <Settings2 aria-hidden size={20} />
        </button>
      </header>

      <nav className="club-tm-stappen" aria-label={t.kop.oefeningen(gedaan, totaal)}>
        {dag.oefeningen.map((x, i) => {
          const v = voortgang({ ...dag, oefeningen: [x] }, concept.invoer)
          const label = plekken.get(x.id)?.label ?? String(i + 1)
          return (
            <button
              key={x.id} type="button" className="club-tm-stap" aria-current={i === index ? 'step' : undefined} onClick={() => naar(i)}
              data-klaar={v.klaar === v.totaal || undefined} aria-label={t.kop.stap(label, x.naam, v.klaar, v.totaal)}
            >
              <span style={{ transform: `scaleX(${v.totaal ? v.klaar / v.totaal : 0})` }} aria-hidden />
            </button>
          )
        })}
      </nav>

      {!p.wachtrij.online && (
        <p className="club-tm-offline" role="status">
          <WifiOff aria-hidden size={15} /> {t.offline}
        </p>
      )}
      {menu && <TrainingMenu signaal={signaal} scherm={scherm} bezig={bezig} onAfronden={rondAf} />}

      <div key={o.id} className="club-tm-scherm" data-richting={richting} {...veeg}>
        <OefeningScherm
          oefening={o} plek={plekken.get(o.id) ?? { label: '', soort: 'los', samenMet: [] }} historie={historie[o.oefeningId]} invoer={concept.invoer}
          kernpunten={p.kernpunten[o.naam]} isLaatste={isLaatste} onVeld={zetVeld} onKlaar={setGedaan} onOpen={(k) => zetVeld(k, { klaar: false })}
          onInfo={() => p.onInfo(o)} onVolgende={() => naar(index + 1)} andereOefening={<AndereOefening lidId={p.lidId} oefening={o} onKies={(alt) => wissel(o.id, alt)} />}
        />
      </div>

      <footer className="club-tm-voet">
        {fout && <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">{fout}</p>}
        {concept.rust ? (
          <RustTimer rust={concept.rust} nu={nu} onVerleng={(s) => setConcept((c) => (c.rust ? { ...c, rust: verlengRust(c.rust, s, Date.now()) } : c))} onStop={stopRust} />
        ) : (
          <div className="club-tm-nav">
            <button type="button" className="club-tm-navknop" onClick={() => naar(index - 1)} disabled={index === 0} aria-label={t.vorigeOefening}>
              <ChevronLeft aria-hidden size={24} />
            </button>
            {isLaatste || allesGedaan ? (
              <button type="button" className="club-tm-navknop club-tm-navknop--hoofd" data-af={allesGedaan || undefined} onClick={rondAf} disabled={bezig}>
                <Flag aria-hidden size={18} /> {bezig ? t.opslaan : t.afronden}
              </button>
            ) : (
              <button type="button" className="club-tm-navknop club-tm-navknop--hoofd" onClick={() => naar(index + 1)}>
                <span className="club-tm-navknop-tekst">
                  <small>{t.volgende}</small>
                  {dag.oefeningen[index + 1]?.naam}
                </span>
                <ChevronRight aria-hidden size={22} />
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
