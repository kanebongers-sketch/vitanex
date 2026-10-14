'use client'

import {
  DOEL_LABEL, DOELEN, NIVEAU_LABEL, NIVEAUS, SCHEMA_STATUS_LABEL, SCHEMA_STATUSSEN,
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
  return (
    <section className="club-kaart club-training-kopvelden" aria-label="Gegevens van het schema">
      <label className="club-veld">
        <span>Naam</span>
        <input className="club-invoer" value={kop.naam} maxLength={80} onChange={(e) => zet({ naam: e.target.value })} required />
      </label>
      {!isSjabloon && (
        <fieldset className="club-training-fieldset">
          <legend className="club-label">Status</legend>
          <div className="club-segment" role="group" aria-label="Status">
            {SCHEMA_STATUSSEN.map((s) => (
              <button key={s} type="button" aria-pressed={kop.status === s} onClick={() => isSchemaStatus(s) && zet({ status: s })}>
                {SCHEMA_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="club-formrij">
        <label className="club-veld">
          <span>Doel</span>
          <select className="club-invoer" value={kop.doel ?? ''} onChange={(e) => zet({ doel: isDoel(e.target.value) ? e.target.value : null })}>
            <option value="">Geen</option>
            {DOELEN.map((d) => <option key={d} value={d}>{DOEL_LABEL[d]}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>Niveau</span>
          <select
            className="club-invoer"
            value={kop.niveau}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (isNiveau(n)) zet({ niveau: n })
            }}
          >
            {NIVEAUS.map((n) => <option key={n} value={n}>{NIVEAU_LABEL[n]}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>Weken</span>
          <input className="club-invoer" inputMode="numeric" value={kop.weken} onChange={(e) => zet({ weken: e.target.value })} placeholder="8" />
        </label>
        {!isSjabloon && (
          <label className="club-veld">
            <span>Trainer</span>
            <select className="club-invoer" value={kop.medewerkerId} onChange={(e) => zet({ medewerkerId: e.target.value })}>
              <option value="">Geen</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
            </select>
          </label>
        )}
      </div>
      <label className="club-veld">
        <span>Notitie voor het lid</span>
        <textarea className="club-invoer" value={kop.notitie} maxLength={1000} rows={3} onChange={(e) => zet({ notitie: e.target.value })} />
      </label>
    </section>
  )
}
