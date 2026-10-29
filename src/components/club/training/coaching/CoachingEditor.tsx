'use client'

import { useState } from 'react'
import { Plus, RotateCcw, X } from 'lucide-react'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import { GRENZEN, leesCoaching } from '@/lib/club/training/coaching/invoer'
import { stuur } from '@/components/club/leden/stuur'
import { LijstVeld } from './LijstVeld'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

// Coaching van een oefening zelf schrijven of aanpassen. Begint met wat er nu
// staat (de eigen tekst of de standaard). Dezelfde regels als de standaard:
// de controle staat in leesCoaching en draait ook op de server.

interface CoachingEditorProps {
  oefeningId: string
  begin: Coaching
  eigen: boolean
  onKlaar: () => void
  onAnnuleer: () => void
}

type Paar = { a: string; b: string }

const leegPaar: Paar = { a: '', b: '' }

export function CoachingEditor({ oefeningId, begin, eigen, onKlaar, onAnnuleer }: CoachingEditorProps) {
  const [kern, setKern] = useState<Paar[]>(begin.kernpunten.map((k) => ({ a: k.punt, b: k.uitleg })))
  const [opstelling, setOpstelling] = useState<string[]>(begin.opstelling)
  const [stappen, setStappen] = useState<string[]>(begin.stappen)
  const [fouten, setFouten] = useState<Paar[]>(begin.fouten.map((f) => ({ a: f.fout, b: f.beter })))
  const [ademhaling, setAdemhaling] = useState(begin.ademhaling)
  const [tempo, setTempo] = useState(begin.tempo)
  const [makkelijker, setMakkelijker] = useState(begin.makkelijker ?? '')
  const [zwaarder, setZwaarder] = useState(begin.zwaarder ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  function invoer() {
    return {
      kernpunten: kern.map((k) => ({ punt: k.a, uitleg: k.b })),
      opstelling,
      stappen,
      fouten: fouten.map((f) => ({ fout: f.a, beter: f.b })),
      ademhaling,
      tempo,
      makkelijker,
      zwaarder,
    }
  }

  async function bewaar() {
    const controle = leesCoaching(invoer())
    if (!controle.ok) return setFout(controle.fout)
    setBezig(true)
    const uit = await stuur(`/api/club/training/oefeningen/${oefeningId}/coaching`, 'PATCH', controle.waarde)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar()
  }

  async function standaard() {
    setBezig(true)
    const uit = await stuur(`/api/club/training/oefeningen/${oefeningId}/coaching`, 'DELETE')
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar()
  }

  const tc = useTekst(CLUB_TRAINING).coaching
  const t = tc.editor
  return (
    <div className="club-coach-editor">
      <PaarLijst
        titel={tc.kernpunten}
        hint={t.kernHint}
        paren={kern}
        max={GRENZEN.kernpunten[1]}
        labelA={t.kernpunt}
        labelB={t.uitleg}
        maxA={GRENZEN.punt}
        maxB={GRENZEN.uitleg}
        genummerd
        onWijzig={setKern}
      />
      <LijstVeld titel={tc.opstelling} waarden={opstelling} max={GRENZEN.opstelling[1]} maxTekens={GRENZEN.zin} onWijzig={setOpstelling} />
      <LijstVeld titel={t.stappen} waarden={stappen} max={GRENZEN.stappen[1]} maxTekens={GRENZEN.zin} genummerd onWijzig={setStappen} />
      <PaarLijst
        titel={tc.fouten}
        hint={t.foutenHint}
        paren={fouten}
        max={GRENZEN.fouten[1]}
        labelA={t.fout}
        labelB={t.correctie}
        maxA={GRENZEN.fout}
        maxB={GRENZEN.beter}
        onWijzig={setFouten}
      />
      <div className="club-coach-editor-raster">
        <label className="club-veld">
          <span>{tc.ademhaling}</span>
          <input className="club-invoer" value={ademhaling} maxLength={GRENZEN.ademhaling} onChange={(e) => setAdemhaling(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{tc.tempo}</span>
          <input className="club-invoer" value={tempo} maxLength={GRENZEN.tempo} onChange={(e) => setTempo(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{t.makkelijker}</span>
          <input className="club-invoer" value={makkelijker} maxLength={GRENZEN.variant} onChange={(e) => setMakkelijker(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{t.zwaarder}</span>
          <input className="club-invoer" value={zwaarder} maxLength={GRENZEN.variant} onChange={(e) => setZwaarder(e.target.value)} />
        </label>
      </div>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <div className="club-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar()}>
          {bezig ? t.opslaanBezig : t.opslaan}
        </button>
        <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={onAnnuleer}>
          {t.annuleren}
        </button>
        {eigen && (
          <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => void standaard()}>
            <RotateCcw aria-hidden size={15} /> {t.standaard}
          </button>
        )}
      </div>
    </div>
  )
}

interface PaarLijstProps {
  titel: string
  hint: string
  paren: Paar[]
  max: number
  labelA: string
  labelB: string
  maxA: number
  maxB: number
  genummerd?: boolean
  onWijzig: (paren: Paar[]) => void
}

function PaarLijst({ titel, hint, paren, max, labelA, labelB, maxA, maxB, genummerd, onWijzig }: PaarLijstProps) {
  const t = useTekst(CLUB_TRAINING).coaching.editor
  const zet = (i: number, veld: keyof Paar, waarde: string) => onWijzig(paren.map((p, j) => (j === i ? { ...p, [veld]: waarde } : p)))
  return (
    <fieldset className="club-coach-editor-groep">
      <legend className="club-coach-kop">{titel}</legend>
      <p className="club-hint">{hint}</p>
      {paren.length > 0 && (
        <div className={`club-coach-editor-koppen${genummerd ? ' is-genummerd' : ''}`} aria-hidden>
          <span>{labelA}</span>
          <span>{labelB}</span>
        </div>
      )}
      {paren.map((p, i) => (
        <div key={i} className="club-coach-editor-paar">
          {genummerd && <span className="club-coach-editor-nummer" aria-hidden>{i + 1}</span>}
          <input className="club-invoer" aria-label={`${labelA} ${i + 1}`} placeholder={labelA} value={p.a} maxLength={maxA} onChange={(e) => zet(i, 'a', e.target.value)} />
          <textarea className="club-invoer" rows={2} aria-label={`${labelB} ${i + 1}`} placeholder={labelB} value={p.b} maxLength={maxB} onChange={(e) => zet(i, 'b', e.target.value)} />
          <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={t.weghalen(labelA, i + 1)} onClick={() => onWijzig(paren.filter((_, j) => j !== i))}>
            <X aria-hidden size={15} />
          </button>
        </div>
      ))}
      {paren.length < max && (
        <button type="button" className="club-knop club-knop--klein" onClick={() => onWijzig([...paren, leegPaar])}>
          <Plus aria-hidden size={15} /> {t.toevoegen(labelA)}
        </button>
      )}
    </fieldset>
  )
}
