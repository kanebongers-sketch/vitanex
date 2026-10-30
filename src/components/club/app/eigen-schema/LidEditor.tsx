'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  blokken, regelLabels,
} from '@/lib/club/training/blokken'
import {
  koppelAanVorige, naarPayloadRegels, nieuweDag, ontkoppel, verplaats, verplaatsNaar, verwijderDag, verwijderRegel, voegToe, wijzigRegel, zetMaat, type EditorStaat,
} from '@/lib/club/training/editor'
import { kanOpslaan, STANDAARD_NIEUW } from '@/lib/club/training/lid-schemas/bewerken'
import type { LidOefening } from '@/lib/club/training/lid-schemas/typen'
import { dagLetter, MAX_DAGEN, type Doel, type Niveau } from '@/lib/club/training/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import { Bibliotheek } from './Bibliotheek'
import { RegelKaart, type KaartActies } from './RegelKaart'
import { useSlepen, type SleepDoel } from './useSlepen'
import { EditorScherm } from './EditorScherm'

// De editor voor het eigen schema in de ledenapp, mobile-first: een dag per
// keer, oefeningen als kaarten, onderaan altijd de knop Opslaan. Dezelfde
// bewerkingen als de schema-editor in Club (editor.ts).

export interface EditorBegin {
  /** null: een nieuw schema. */
  id: string | null
  naam: string
  doel: Doel | null
  niveau: Niveau
  staat: EditorStaat
}

interface Props {
  begin: EditorBegin
  /** Alle bekende oefeningen (bibliotheek plus wat al in het schema stond), op id. */
  oefeningen: ReadonlyMap<string, LidOefening>
  bibliotheek: LidOefening[] | null
  bibFout: string | null
  bezig: boolean
  fout: string | null
  onOpslaan: (payload: Record<string, unknown>) => void
  onSluit: () => void
}

const sleutel = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `n${Date.now()}${Math.random()}`)

export function LidEditor({ begin, oefeningen, bibliotheek, bibFout, bezig, fout, onOpslaan, onSluit }: Props) {
  const t = useTekst(EIGEN_SCHEMA).editor
  const [staat, setStaat] = useState<EditorStaat>(begin.staat)
  const [naam, setNaam] = useState(begin.naam)
  const [dag, setDag] = useState(1)
  const [open, setOpen] = useState<string | null>(null)
  const [bib, setBib] = useState<{ detail: string | null } | null>(null)
  const [gewijzigd, setGewijzigd] = useState(begin.id === null)
  const [melding, setMelding] = useState<string | null>(null)

  const werk = useCallback((f: (s: EditorStaat) => EditorStaat) => {
    setStaat((s) => f(s))
    setGewijzigd(true)
    setMelding(null)
  }, [])

  const slepen = useSlepen(
    useCallback((wie: string, d: SleepDoel) => {
      werk((s) => {
        const dagRegels = s.regels.filter((r) => r.dag === dag && r.sleutel !== wie)
        const i = dagRegels.findIndex((r) => r.sleutel === d.sleutel)
        if (i < 0) return s
        const voor = d.plek === 'voor' ? dagRegels[i].sleutel : (dagRegels[i + 1]?.sleutel ?? null)
        return verplaatsNaar(s, wie, dag, voor)
      })
    }, [dag, werk]),
  )

  const acties: KaartActies = useMemo(() => ({
    onWijzig: (k, veld, waarde) => werk((s) => wijzigRegel(s, k, veld, waarde)),
    onMaat: (k, maat) => werk((s) => zetMaat(s, k, maat)),
    onVerplaats: (k, richting) => werk((s) => verplaats(s, k, richting)),
    onKoppel: (k) => werk((s) => koppelAanVorige(s, k)),
    onOntkoppel: (k) => werk((s) => ontkoppel(s, k)),
    onVerwijder: (k) => {
      setOpen(null)
      werk((s) => verwijderRegel(s, k))
    },
    onInfo: (oefeningId) => setBib({ detail: oefeningId }),
    onSleep: slepen.start,
  }), [werk, slepen.start])

  const dagRegels = staat.regels.filter((r) => r.dag === dag)
  const labels = regelLabels(dagRegels)
  const inBlok = new Set(blokken(dagRegels).filter((b) => b.items.length > 1).flatMap((b) => b.items.map((r) => r.sleutel)))
  const dagLabel = t.dag(dagLetter(dag))

  function opslaan() {
    if (!kanOpslaan(staat)) return setMelding(t.geenOefening)
    onOpslaan({ naam: naam.trim() || t.nieuweNaam, doel: begin.doel, niveau: begin.niveau, dagTitels: staat.dagTitels, regels: naarPayloadRegels(staat) })
  }

  function voegOefeningToe(oefeningId: string) {
    werk((s) => voegToe(s, dag, oefeningId, STANDAARD_NIEUW, sleutel()))
  }

  return (
    <EditorScherm
      naam={naam}
      onNaam={(n) => { setNaam(n); setGewijzigd(true) }}
      gewijzigd={gewijzigd}
      onSluit={onSluit}
      voet={
        <>
          {(melding || fout) && <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">{melding ?? fout}</p>}
          <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={opslaan} disabled={bezig} aria-busy={bezig || undefined}>
            {bezig ? t.bezig : begin.id ? t.opslaan : t.opslaanStart}
          </button>
        </>
      }
    >
      <div className="club-es-dagen" role="tablist" aria-label={t.dagen}>
        {staat.dagTitels.map((titel, i) => (
          <button key={i} type="button" role="tab" aria-selected={dag === i + 1} onClick={() => { setDag(i + 1); setOpen(null) }} title={titel}>
            <span>{t.dag(dagLetter(i + 1))}</span>
            <small>{staat.regels.filter((r) => r.dag === i + 1).length}</small>
          </button>
        ))}
        {staat.dagTitels.length < MAX_DAGEN && (
          <button type="button" className="club-es-dag-plus" onClick={() => { werk(nieuweDag); setDag(staat.dagTitels.length + 1) }} aria-label={t.dagToevoegen}>
            <Plus aria-hidden size={18} />
          </button>
        )}
      </div>

      <p className="club-es-dagtitel">{staat.dagTitels[dag - 1]}</p>

      {dagRegels.length === 0 ? (
        <p className="club-lidapp-leeg">{t.leegDag}</p>
      ) : (
        <ol className="club-es-lijst" data-sleept={slepen.sleept ? true : undefined}>
          {dagRegels.map((r, i) => (
            <RegelKaart
              key={r.sleutel} regel={r} oefening={oefeningen.get(r.oefeningId)} label={labels.get(r.sleutel) ?? String(i + 1)}
              isEerste={i === 0} isLaatste={i === dagRegels.length - 1} inBlok={inBlok.has(r.sleutel)}
              open={open === r.sleutel} onOpen={setOpen} sleept={slepen.sleept === r.sleutel}
              doel={slepen.doel?.sleutel === r.sleutel ? slepen.doel.plek : null} acties={acties}
            />
          ))}
        </ol>
      )}

      <div className="club-es-onder">
        <button type="button" className="club-lidapp-knop club-es-toevoegen" onClick={() => setBib({ detail: null })}>
          <Plus aria-hidden size={18} /> {t.toevoegen}
        </button>
        {staat.dagTitels.length > 1 && (
          <button type="button" className="club-lidapp-tekstknop" onClick={() => { werk((s) => verwijderDag(s, dag)); setDag(Math.max(1, dag - 1)) }}>
            <Trash2 aria-hidden size={14} /> {t.dagWeg}
          </button>
        )}
      </div>

      {bib && (
        <Bibliotheek oefeningen={bibliotheek} fout={bibFout} dagLabel={dagLabel} detailId={bib.detail} onToevoegen={voegOefeningToe} onSluit={() => setBib(null)} />
      )}
    </EditorScherm>
  )
}
