'use client'

import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import {
  DOELEN, NIVEAUS, SCHEMA_STATUSSEN,
  isDoel, isNiveau, isSchemaStatus, type Doel, type Niveau, type SchemaStatus,
} from '@/lib/club/training/typen'

export interface KopStaat {
  naam: string
  doel: Doel | null
  niveau: Niveau
  weken: string
  status: SchemaStatus
  medewerkerId: string
  notitie: string
}

interface EditorKopProps {
  kop: KopStaat
  zet: (deel: Partial<KopStaat>) => void
  trainers: { id: string; naam: string }[]
  isSjabloon: boolean
}

/** De gegevens van het schema: naam, doel, niveau, duur, status en trainer. */
export function EditorKop({ kop, zet, trainers, isSjabloon }: EditorKopProps) {
  const t = useTekst(SCHEMA_EDITOR).kop
  const l = useTekst(TRAINING_LABELS)
  return (
    <section className="club-kaart club-training-kopvelden" aria-labelledby="kopvelden-kop">
      <h2 id="kopvelden-kop">{isSjabloon ? t.sjabloon : t.schema}</h2>
      <label className="club-veld">
        <span>{t.naam}</span>
        <input className="club-invoer" value={kop.naam} maxLength={80} onChange={(e) => zet({ naam: e.target.value })} required />
      </label>
      {!isSjabloon && (
        <fieldset className="club-training-fieldset">
          <legend className="club-label">{t.status}</legend>
          <div className="club-segment" role="group" aria-label={t.status}>
            {SCHEMA_STATUSSEN.map((s) => (
              <button key={s} type="button" aria-pressed={kop.status === s} onClick={() => isSchemaStatus(s) && zet({ status: s })}>
                {l.schemaStatus[s]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="club-formrij">
        <label className="club-veld">
          <span>{t.doel}</span>
          <select className="club-invoer" value={kop.doel ?? ''} onChange={(e) => zet({ doel: isDoel(e.target.value) ? e.target.value : null })}>
            <option value="">{t.geen}</option>
            {DOELEN.map((d) => <option key={d} value={d}>{l.doel[d]}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.niveau}</span>
          <select
            className="club-invoer"
            value={kop.niveau}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (isNiveau(n)) zet({ niveau: n })
            }}
          >
            {NIVEAUS.map((n) => <option key={n} value={n}>{l.niveau[n]}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.weken}</span>
          <input className="club-invoer" inputMode="numeric" value={kop.weken} onChange={(e) => zet({ weken: e.target.value })} placeholder="8" />
        </label>
        {!isSjabloon && (
          <label className="club-veld">
            <span>{t.trainer}</span>
            <select className="club-invoer" value={kop.medewerkerId} onChange={(e) => zet({ medewerkerId: e.target.value })}>
              <option value="">{t.geen}</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
            </select>
          </label>
        )}
      </div>
      <label className="club-veld">
        <span>{t.notitie}</span>
        <textarea className="club-invoer" value={kop.notitie} maxLength={1000} rows={3} onChange={(e) => zet({ notitie: e.target.value })} />
      </label>
    </section>
  )
}
