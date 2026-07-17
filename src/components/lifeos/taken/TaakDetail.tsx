'use client'

import { useId, type CSSProperties } from 'react'
import type { Project } from '@/lib/lifeos/projecten/projecten'
import type { Taak, TaakWijziging } from '@/lib/lifeos/taken/taken'
import { HINT, INVOER, LABEL, VELD } from './detailStijl'
import { EnergieVeld, ImpactVeld, InspanningVeld } from './FeitVelden'

// Het detail van één taak: hier vul je de vier feiten in waar `prioriteit.ts`
// mee rekent. Presentationeel — het weet niets van fetchen, alleen dat een
// wijziging ergens heen gaat.
//
// ─── ELK VELD KAN TERUG NAAR "WEET IK NIET" ─────────────────────────────────
//
//   Elke keuze heeft een lege stand, en die is geen sierlijkheid. `null` is hier
//   een echte waarde ("hier is geen oordeel over geveld") en moet dus terug te
//   zetten zijn. Kon je alleen maar een impact KIEZEN en nooit wissen, dan werd
//   een verkeerde klik een feit dat je nooit meer kwijtraakt — en dan gaat de
//   planner rekenen met een oordeel dat je niet meent.

interface TaakDetailProps {
  taak: Taak
  projecten: Project[]
  /** Projecten laden mislukt: de keuzelijst zegt dat, i.p.v. leeg te doen. */
  projectenMislukt: boolean
  onWijzig: (wijziging: TaakWijziging) => void
}

export function TaakDetail({ taak, projecten, projectenMislukt, onWijzig }: TaakDetailProps) {
  return (
    <div style={PANEEL}>
      <ImpactVeld impact={taak.impact} onKies={(impact) => onWijzig({ impact })} />
      <InspanningVeld
        minuten={taak.inspanningMinuten}
        onZet={(inspanningMinuten) => onWijzig({ inspanningMinuten })}
      />
      <EnergieVeld energie={taak.energie} onKies={(energie) => onWijzig({ energie })} />
      <div style={RIJ}>
        <DeadlineVeld deadline={taak.deadline} onZet={(deadline) => onWijzig({ deadline })} />
        <ProjectVeld
          projectId={taak.projectId}
          projecten={projecten}
          mislukt={projectenMislukt}
          onKies={(projectId) => onWijzig({ projectId })}
        />
      </div>
    </div>
  )
}

interface DeadlineVeldProps {
  deadline: string | null
  onZet: (v: string | null) => void
}

function DeadlineVeld({ deadline, onZet }: DeadlineVeldProps) {
  const id = useId()

  return (
    <div style={VELD}>
      <label htmlFor={id} style={LABEL}>
        Deadline
      </label>
      <input
        id={id}
        type="date"
        value={deadline ?? ''}
        onChange={(e) => onZet(e.target.value === '' ? null : e.target.value)}
        style={INVOER}
      />
      <p style={HINT}>Wanneer het áf moet — los van de dag waarop je het plant.</p>
    </div>
  )
}

interface ProjectVeldProps {
  projectId: string | null
  projecten: Project[]
  mislukt: boolean
  onKies: (v: string | null) => void
}

function ProjectVeld({ projectId, projecten, mislukt, onKies }: ProjectVeldProps) {
  const id = useId()

  return (
    <div style={VELD}>
      <label htmlFor={id} style={LABEL}>
        Project
      </label>
      <select
        id={id}
        value={projectId ?? ''}
        disabled={mislukt}
        onChange={(e) => onKies(e.target.value === '' ? null : e.target.value)}
        style={INVOER}
      >
        <option value="">Geen project</option>
        {projecten.map((p) => (
          <option key={p.id} value={p.id}>
            {p.naam}
          </option>
        ))}
      </select>
      {/* Leeg ≠ fout: als het ophalen mislukte, zeggen we dat — een lege lijst
          zou beweren dat je geen projecten hébt. */}
      <p style={HINT}>
        {mislukt ? 'Je projecten konden niet geladen worden.' : 'Waar hoort dit bij?'}
      </p>
    </div>
  )
}

const PANEEL: CSSProperties = {
  display: 'grid',
  gap: 16,
  // Inspringen tot onder de titel: het detail hoort zichtbaar bij zijn rij.
  padding: '14px 0 16px 32px',
}

const RIJ: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
}
