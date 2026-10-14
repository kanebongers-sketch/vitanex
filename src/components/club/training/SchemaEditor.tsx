'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  hernoemDag, kopieerDag, naarPayloadRegels, nieuweDag, verplaats, verwijderDag, verwijderRegel, voegToe, wijzigRegel,
  type EditorStaat,
} from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { dagLetter, MAX_DAGEN } from '@/lib/club/training/typen'
import { toonHerhalingen } from '@/lib/club/training/weergave'
import { dosering } from '@/lib/club/training/voorstel-regels'
import { stuur } from './api'
import { EditorDag } from './EditorDag'
import { EditorKop, type KopStaat } from './EditorKop'
import { EditorWerkbalk } from './EditorWerkbalk'
import { OefeningKiezer } from './OefeningKiezer'
import { SchemaPrint } from './SchemaPrint'

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
  /** Rechterkolom, bijvoorbeeld wat het lid getraind heeft. */
  zijkant?: ReactNode
}

/** De schema-editor: dagen, oefeningen, sets en rust. Opslaan met de knop of Ctrl+S. */
export function SchemaEditor(p: SchemaEditorProps) {
  const router = useRouter()
  const [kop, setKop] = useState(p.beginKop)
  const [staat, setStaat] = useState(p.beginStaat)
  const [kiesVoor, setKiesVoor] = useState<number | null>(null)
  const [bewaard, setBewaard] = useState(() => JSON.stringify([p.beginKop, p.beginStaat]))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const teller = useRef(0)
  const perId = useMemo(() => new Map(p.oefeningen.map((o) => [o.id, o])), [p.oefeningen])
  const kiesbaar = useMemo(() => p.oefeningen.filter((o) => o.actief), [p.oefeningen])
  const gewijzigd = JSON.stringify([kop, staat]) !== bewaard
  const sleutel = () => `nieuw-${Date.now()}-${++teller.current}`
  const zetKop = (deel: Partial<KopStaat>) => setKop((k) => ({ ...k, ...deel }))
  const sluitKiezer = useCallback(() => setKiesVoor(null), [])

  const opslaan = useCallback(async () => {
    setBezig(true)
    setFout(null)
    const u = await stuur(`/schemas/${p.schemaId}`, 'PUT', {
      ...kop,
      weken: kop.weken.trim() || null,
      medewerkerId: kop.medewerkerId || null,
      dagTitels: staat.dagTitels,
      regels: naarPayloadRegels(staat),
    })
    setBezig(false)
    if (!u.ok) return setFout(u.fout)
    setBewaard(JSON.stringify([kop, staat]))
    router.refresh()
  }, [kop, staat, p.schemaId, router])

  useEffect(() => {
    function toets(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (gewijzigd && !bezig) void opslaan()
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
  }, [gewijzigd, bezig, opslaan])

  function kies(o: Oefening) {
    if (kiesVoor === null) return
    const d = dosering(kop.doel ?? 'gezondheid', o.patroon, kop.niveau)
    setStaat((s) => voegToe(s, kiesVoor, o.id, { sets: String(d.sets), herhalingen: toonHerhalingen(d.herhalingen), rustSec: String(d.rustSec) }, sleutel()))
  }

  const trainer = p.trainers.find((t) => t.id === kop.medewerkerId)?.naam ?? null

  return (
    <div className="club-training-editor">
      <EditorWerkbalk
        schemaId={p.schemaId} naam={kop.naam} isSjabloon={p.isSjabloon} vestiging={p.vestiging} gewijzigd={gewijzigd} bezig={bezig}
        onOpslaan={opslaan} editorHref={p.editorHref} terugHref={p.terugHref}
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
                onTitel={(t) => setStaat((s) => hernoemDag(s, dag, t))}
                onWijzig={(k, veld, w) => setStaat((s) => wijzigRegel(s, k, veld, w))}
                onVerplaats={(k, r) => setStaat((s) => verplaats(s, k, r))}
                onVerwijder={(k) => setStaat((s) => verwijderRegel(s, k))}
                onToevoegen={() => setKiesVoor(dag)}
                onKopieer={() => setStaat((s) => kopieerDag(s, dag, sleutel))}
                onVerwijderDag={() => window.confirm(`Dag ${dagLetter(dag)} met alle oefeningen verwijderen?`) && setStaat((s) => verwijderDag(s, dag))}
              />
            )
          })}
          {staat.dagTitels.length < MAX_DAGEN && (
            <button type="button" className="club-knop club-training-nieuwedag" onClick={() => setStaat(nieuweDag)}>
              <Plus aria-hidden size={16} /> Dag {dagLetter(staat.dagTitels.length + 1)} toevoegen
            </button>
          )}
        </div>
        <div className="club-k4 club-training-zij">
          <EditorKop kop={kop} zet={zetKop} trainers={p.trainers} isSjabloon={p.isSjabloon} />
          {p.zijkant}
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
  )
}
