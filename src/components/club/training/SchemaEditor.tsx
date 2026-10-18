'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  hernoemDag, koppelAanVorige, kopieerDag, naarPayloadRegels, nieuweDag, ontkoppel, verplaats, verplaatsNaar, verwijderDag, verwijderRegel, vervangOefening,
  voegToe, wijzigRegel, zetGewicht, zetInspanning, zetMaat, type EditorStaat,
} from '@/lib/club/training/editor'
import { bronnenVan } from '@/lib/club/training/beeld'
import type { ProgressieRegel } from '@/lib/club/training/progressie'
import type { Oefening } from '@/lib/club/training/rijen'
import { dagLetter, MAX_DAGEN } from '@/lib/club/training/typen'
import { toonHerhalingen } from '@/lib/club/training/weergave'
import { dosering } from '@/lib/club/training/voorstel-regels'
import { stuur } from './api'
import { EditorDag } from './EditorDag'
import { EditorKop, type KopStaat } from './EditorKop'
import { VervangContext } from './editor/VervangOefening'
import { WaaromSchema } from './editor/WaaromSchema'
import { EditorWerkbalk } from './EditorWerkbalk'
import type { RegelActies } from './editor/EditorRegelRij'
import { ProgressieKaart } from './editor/ProgressieKaart'
import { useEditorStaat } from './editor/useEditorStaat'
import { BeeldBron } from './OefeningBeeld'
import { OefeningKiezer } from './OefeningKiezer'
import { SchemaPrint } from './SchemaPrint'
import { SpierOverzicht } from './SpierOverzicht'
import './schemas.css'

interface SchemaEditorProps {
  schemaId: string
  isSjabloon: boolean
  lidNaam: string | null
  vestiging: string
  beginKop: KopStaat
  beginStaat: EditorStaat
  oefeningen: Oefening[]
  trainers: { id: string; naam: string }[]
  editorHref: string
  terugHref: string
  /** Verloop en suggestie per oefening (alleen bij het schema van een lid). */
  progressie: ProgressieRegel[] | null
  /** Rechterkolom, bijvoorbeeld wat het lid getraind heeft. */
  zijkant?: ReactNode
}

/** De dag van het element met de focus (via de sectie van de dag), anders dag 1. */
function dagVanFocus(): number {
  const sectie = document.activeElement?.closest('[aria-labelledby^="dag-"]')
  const n = Number(sectie?.getAttribute('aria-labelledby')?.slice(4))
  return Number.isInteger(n) && n > 0 ? n : 1
}

/** De schema-editor: dagen, blokken, oefeningen en alles per set. Toetsenbord: zie de werkbalk. */
export function SchemaEditor(p: SchemaEditorProps) {
  const router = useRouter()
  const [kop, setKop] = useState(p.beginKop)
  const ed = useEditorStaat(p.beginStaat)
  const { staat, wijzig } = ed
  const [kiesVoor, setKiesVoor] = useState<number | null>(null)
  const [bewaard, setBewaard] = useState(() => JSON.stringify([p.beginKop, p.beginStaat]))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [sleepDoel, setSleepDoel] = useState<string | null>(null)
  const sleep = useRef<string | null>(null)
  const teller = useRef(0)
  const perId = useMemo(() => new Map(p.oefeningen.map((o) => [o.id, o])), [p.oefeningen])
  const kiesbaar = useMemo(() => p.oefeningen.filter((o) => o.actief), [p.oefeningen])
  const gewijzigd = JSON.stringify([kop, staat]) !== bewaard
  const sleutel = useCallback(() => `nieuw-${Date.now()}-${++teller.current}`, [])
  const zetKop = (deel: Partial<KopStaat>) => setKop((k) => ({ ...k, ...deel }))
  const sluitKiezer = useCallback(() => setKiesVoor(null), [])

  // Opslaan; met `extra` wijzigt er eerst iets aan de kop (Activeren zet de status op actief).
  const opslaan = useCallback(async (extra: Partial<KopStaat> = {}) => {
    const nieuw = { ...kop, ...extra }
    setBezig(true)
    setFout(null)
    const u = await stuur(`/schemas/${p.schemaId}`, 'PUT', {
      ...nieuw,
      weken: nieuw.weken.trim() || null,
      medewerkerId: nieuw.medewerkerId || null,
      dagTitels: staat.dagTitels,
      regels: naarPayloadRegels(staat),
    })
    setBezig(false)
    if (!u.ok) return setFout(u.fout)
    setKop(nieuw)
    setBewaard(JSON.stringify([nieuw, staat]))
    router.refresh()
  }, [kop, staat, p.schemaId, router])

  useEffect(() => {
    function toets(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      // In de gegevens van het schema (naam, notitie) werkt gewoon het ongedaan maken van de browser.
      const inKop = e.target instanceof Element && e.target.closest('.club-training-kopvelden') !== null
      if (ctrl && k === 's') {
        e.preventDefault()
        if (gewijzigd && !bezig) void opslaan()
      } else if (ctrl && !inKop && ((k === 'z' && e.shiftKey) || k === 'y')) {
        e.preventDefault()
        ed.opnieuw()
      } else if (ctrl && !inKop && k === 'z') {
        e.preventDefault()
        ed.ongedaan()
      } else if (e.altKey && e.code === 'KeyN' && kiesVoor === null) {
        e.preventDefault()
        setKiesVoor(dagVanFocus())
      }
    }
    function weg(e: BeforeUnloadEvent) {
      if (gewijzigd) e.preventDefault()
    }
    window.addEventListener('keydown', toets)
    window.addEventListener('beforeunload', weg)
    return () => {
      window.removeEventListener('keydown', toets)
      window.removeEventListener('beforeunload', weg)
    }
  }, [gewijzigd, bezig, opslaan, ed, kiesVoor])

  const acties: RegelActies = useMemo(
    () => ({
      onWijzig: (k, veld, w) => wijzig((s) => wijzigRegel(s, k, veld, w), `veld:${k}:${veld}`),
      onMaat: (k, m) => wijzig((s) => zetMaat(s, k, m)),
      onInspanning: (k, i) => wijzig((s) => zetInspanning(s, k, i)),
      onVerplaats: (k, r) => wijzig((s) => verplaats(s, k, r)),
      onKoppel: (k) => wijzig((s) => koppelAanVorige(s, k)),
      onOntkoppel: (k) => wijzig((s) => ontkoppel(s, k)),
      onVerwijder: (k) => wijzig((s) => verwijderRegel(s, k)),
      onVervang: (k, id) => wijzig((s) => vervangOefening(s, k, id)),
      onSleepStart: (k) => {
        sleep.current = k
      },
      onSleepEinde: () => {
        sleep.current = null
        setSleepDoel(null)
      },
      onSleepOver: (k) => setSleepDoel(k),
      onLaatVallen: (voor) => {
        const k = sleep.current
        const dag = staat.regels.find((r) => r.sleutel === voor)?.dag
        if (k && dag) wijzig((s) => verplaatsNaar(s, k, dag, voor))
        sleep.current = null
        setSleepDoel(null)
      },
    }),
    [wijzig, staat.regels],
  )

  function laatVallenAchteraan(dag: number) {
    const k = sleep.current
    if (k) wijzig((s) => verplaatsNaar(s, k, dag, null))
    sleep.current = null
    setSleepDoel(null)
  }

  function kies(o: Oefening) {
    if (kiesVoor === null) return
    const d = dosering(kop.doel ?? 'gezondheid', o.patroon, kop.niveau)
    wijzig((s) => voegToe(s, kiesVoor, o.id, { sets: String(d.sets), herhalingen: toonHerhalingen(d.herhalingen), rustSec: String(d.rustSec) }, sleutel()))
  }

  const trainer = p.trainers.find((t) => t.id === kop.medewerkerId)?.naam ?? null
  const vervangBron = useMemo(() => ({ oefeningen: kiesbaar, regels: staat.regels }), [kiesbaar, staat.regels])
  const huidigGewicht = useMemo(() => new Map(staat.regels.map((r) => [r.oefeningId, r.gewichtKg])), [staat.regels])

  return (
    <VervangContext.Provider value={vervangBron}>
    <div className="club-training-editor">
      <EditorWerkbalk
        schemaId={p.schemaId} naam={kop.naam} isSjabloon={p.isSjabloon} status={kop.status} vestiging={p.vestiging} gewijzigd={gewijzigd} bezig={bezig}
        onOpslaan={() => void opslaan()} onActiveren={() => void opslaan({ status: 'actief' })} editorHref={p.editorHref} terugHref={p.terugHref}
        kanOngedaan={ed.kanOngedaan} kanOpnieuw={ed.kanOpnieuw} onOngedaan={ed.ongedaan} onOpnieuw={ed.opnieuw}
      />
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <div className="club-raster">
        <div className="club-k8 club-training-dagen">
          {staat.dagTitels.map((titel, i) => {
            const dag = i + 1
            return (
              <EditorDag
                key={dag}
                dag={dag}
                titel={titel}
                regels={staat.regels.filter((r) => r.dag === dag)}
                oefeningen={perId}
                magKopieren={staat.dagTitels.length < MAX_DAGEN}
                magVerwijderen={staat.dagTitels.length > 1}
                sleepDoel={sleepDoel}
                acties={acties}
                onSleepEind={() => setSleepDoel(`eind:${dag}`)}
                onLaatVallenEind={() => laatVallenAchteraan(dag)}
                onTitel={(t) => wijzig((s) => hernoemDag(s, dag, t), `titel:${dag}`)}
                onToevoegen={() => setKiesVoor(dag)}
                onKopieer={() => wijzig((s) => kopieerDag(s, dag, sleutel))}
                onVerwijderDag={() => window.confirm(`Dag ${dagLetter(dag)} met alle oefeningen verwijderen?`) && wijzig((s) => verwijderDag(s, dag))}
              />
            )
          })}
          {staat.dagTitels.length < MAX_DAGEN && (
            <button type="button" className="club-knop club-training-nieuwedag" onClick={() => wijzig(nieuweDag)}>
              <Plus aria-hidden size={16} /> Dag {dagLetter(staat.dagTitels.length + 1)} toevoegen
            </button>
          )}
          <BeeldBron bronnen={bronnenVan(staat.regels.map((r) => perId.get(r.oefeningId)?.beeld))} />
        </div>
        <div className="club-k4 club-training-zij">
          <EditorKop kop={kop} zet={zetKop} trainers={p.trainers} isSjabloon={p.isSjabloon} />
          <WaaromSchema notitie={kop.notitie} />
          {p.progressie && <ProgressieKaart regels={p.progressie} huidig={huidigGewicht} onOvernemen={(id, kg) => wijzig((s) => zetGewicht(s, id, kg))} />}
          {p.zijkant}
          <SpierOverzicht staat={staat} oefeningen={perId} />
        </div>
      </div>
      {kiesVoor !== null && (
        <OefeningKiezer
          oefeningen={kiesbaar}
          dagLabel={`dag ${dagLetter(kiesVoor)}`}
          opDag={new Set(staat.regels.filter((r) => r.dag === kiesVoor).map((r) => r.oefeningId))}
          onKies={kies}
          onSluit={sluitKiezer}
        />
      )}
      <SchemaPrint naam={kop.naam} lidNaam={p.lidNaam} doel={kop.doel} weken={kop.weken} trainer={trainer} notitie={kop.notitie} staat={staat} oefeningen={perId} />
    </div>
    </VervangContext.Provider>
  )
}
