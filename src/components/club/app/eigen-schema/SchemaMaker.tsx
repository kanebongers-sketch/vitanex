'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LidVoorstel } from '@/lib/club/training/lid-schemas/voorstel'
import type { LidOefening, LidSchemaDetail } from '@/lib/club/training/lid-schemas/typen'
import type { SnelleStart } from '@/lib/club/training/lid-schemas/regels'
import { staatUit } from '@/lib/club/training/lid-schemas/bewerken'
import { dagLetter } from '@/lib/club/training/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA, dagTitelIn } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import { stuur } from '../verzoek'
import { haal, lijstUit, objectUit } from './haal'
import { EditorScherm } from './EditorScherm'
import { LidEditor, type EditorBegin } from './LidEditor'
import { SnelleStartVragen, STANDAARD_START } from './SnelleStartVragen'

// Een eigen schema maken of aanpassen in de ledenapp, in een vol scherm:
//   snel: vier vragen, dan het voorstel in de editor;
//   leeg: meteen de editor, oefeningen uit de bibliotheek;
//   bewerk: een bestaand schema laden en aanpassen.
// Pas bij Opslaan gaat er iets naar de server.

/** snel: met `begin` al ingevuld (bijvoorbeeld uit de intake van het lid). */
export type MakerStart = { soort: 'snel'; begin?: SnelleStart } | { soort: 'leeg' } | { soort: 'bewerk'; id: string }

interface Props {
  start: MakerStart
  /** Bouwt de URL naar /api/club/lid/training/<pad> (met ?voor= in de voorvertoning). */
  url: (pad: string) => string
  onKlaar: () => void
  onSluit: () => void
}

const sleutel = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `n${Date.now()}${Math.random()}`)

export function SchemaMaker({ start, url, onKlaar, onSluit }: Props) {
  const es = useTekst(EIGEN_SCHEMA)
  const [begin, setBegin] = useState<EditorBegin | null>(() =>
    start.soort === 'leeg' ? { id: null, naam: es.editor.nieuweNaam, doel: null, niveau: 1, staat: { regels: [], dagTitels: [es.editor.dag(dagLetter(1))] } } : null,
  )
  const [bib, setBib] = useState<LidOefening[] | null>(null)
  const [bibFout, setBibFout] = useState<string | null>(null)
  const [extra, setExtra] = useState<LidOefening[]>([])
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  useEffect(() => {
    const stop = new AbortController()
    void haal(url('bibliotheek'), lijstUit<LidOefening>('oefeningen'), stop.signal).then((r) => {
      if (r.ok) setBib(r.data)
      else if (r.fout) setBibFout(r.fout)
    })
    if (start.soort === 'bewerk') {
      void haal(url(`schemas/${encodeURIComponent(start.id)}`), objectUit<LidSchemaDetail>('schema'), stop.signal).then((r) => {
        if (!r.ok) return r.fout && setFout(r.fout)
        setExtra(r.data.oefeningen)
        setBegin({ id: r.data.id, naam: r.data.naam, doel: r.data.doel, niveau: r.data.niveau, staat: staatUit(r.data.regels, r.data.dagTitels, sleutel) })
      })
    }
    return () => stop.abort()
  }, [url, start])

  const oefeningen = useMemo(() => new Map([...extra, ...(bib ?? [])].map((o) => [o.id, o])), [extra, bib])

  async function maakVoorstel(keuze: SnelleStart) {
    setBezig(true)
    setFout(null)
    const r = await stuur(url('schemas/voorstel'), 'POST', keuze)
    setBezig(false)
    const v = r.ok ? (r.data.voorstel as LidVoorstel | undefined) : undefined
    if (!r.ok || !v) return setFout(r.ok ? es.fout.geenVoorstel : r.fout)
    const titels = v.dagTitels.map((titel) => dagTitelIn(titel, es))
    setBegin({ id: null, naam: es.editor.voorstelNaam(es.vragen.doelen[keuze.doel], titels.length), doel: v.doel, niveau: v.niveau, staat: staatUit(v.regels, titels, sleutel) })
  }

  async function opslaan(payload: Record<string, unknown>) {
    if (!begin) return
    setBezig(true)
    setFout(null)
    const r = begin.id ? await stuur(url(`schemas/${encodeURIComponent(begin.id)}`), 'PUT', payload) : await stuur(url('schemas'), 'POST', payload)
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    onKlaar()
  }

  if (begin) {
    return <LidEditor begin={begin} oefeningen={oefeningen} bibliotheek={bib} bibFout={bibFout} bezig={bezig} fout={fout} onOpslaan={(p) => void opslaan(p)} onSluit={onSluit} />
  }
  if (start.soort === 'snel') {
    return (
      <EditorScherm titel={es.vragen.kop} gewijzigd={false} onSluit={onSluit}>
        <SnelleStartVragen begin={start.begin ?? STANDAARD_START} bezig={bezig} fout={fout} onMaak={(k) => void maakVoorstel(k)} />
      </EditorScherm>
    )
  }
  return (
    <EditorScherm titel={es.mijn.aanpassen} gewijzigd={false} onSluit={onSluit}>
      {fout ? <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">{fout}</p> : <div className="club-lidapp-skelet club-es-skelet" aria-busy="true" />}
    </EditorScherm>
  )
}
