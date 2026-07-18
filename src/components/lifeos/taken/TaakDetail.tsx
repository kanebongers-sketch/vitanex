'use client'

import { useId, type CSSProperties } from 'react'
import type { Project } from '@/lib/lifeos/projecten/projecten'
import type { Taak, TaakWijziging } from '@/lib/lifeos/taken/taken'
import { HINT, INVOER, LABEL, VELD } from './detailStijl'
import { EnergieVeld, ImpactVeld, InspanningVeld } from './FeitVelden'
import { NieuwProjectVeld } from './NieuwProjectVeld'
import type { ProjectMaakUitkomst } from './useProjecten'

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
  /** Maakt een nieuw project aan — de keuzelijst was tot nu toe een doodlopende weg. */
  onNieuwProject: (naam: string) => Promise<ProjectMaakUitkomst>
}

export function TaakDetail({
  taak,
  projecten,
  projectenMislukt,
  onWijzig,
  onNieuwProject,
}: TaakDetailProps) {
  return (
    <div style={PANEEL}>
      <ImpactVeld impact={taak.impact} onKies={(impact) => onWijzig({ impact })} />
      <InspanningVeld
        minuten={taak.inspanningMinuten}
        onZet={(inspanningMinuten) => onWijzig({ inspanningMinuten })}
      />
      <EnergieVeld energie={taak.energie} onKies={(energie) => onWijzig({ energie })} />
      <div style={RIJ}>
        <DatumVeld datum={taak.datum} onZet={(datum) => onWijzig({ datum })} />
        <DeadlineVeld deadline={taak.deadline} onZet={(deadline) => onWijzig({ deadline })} />
        <ProjectVeld
          projectId={taak.projectId}
          projecten={projecten}
          mislukt={projectenMislukt}
          onKies={(projectId) => onWijzig({ projectId })}
          onNieuwProject={onNieuwProject}
        />
      </div>
    </div>
  )
}

interface DatumVeldProps {
  datum: string | null
  onZet: (v: string | null) => void
}

/**
 * De geplande dag (`datum`) — het VOORNEMEN: wanneer wil je 'm doen. Los van de
 * deadline (de verplichting) hiernaast, en tot nu toe alleen bij het aanmaken te
 * kiezen. Leeg = "ooit": de taak zakt naar de ooit-bak, geen dag geen alarm.
 */
function DatumVeld({ datum, onZet }: DatumVeldProps) {
  const id = useId()

  return (
    <div style={VELD}>
      <label htmlFor={id} style={LABEL}>
        Geplande dag
      </label>
      <input
        id={id}
        type="date"
        value={datum ?? ''}
        onChange={(e) => onZet(e.target.value === '' ? null : e.target.value)}
        style={INVOER}
      />
      <p style={HINT}>{"Welke dag je 'm wilt doen — leeg = ooit."}</p>
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
  onNieuwProject: (naam: string) => Promise<ProjectMaakUitkomst>
}

function ProjectVeld({ projectId, projecten, mislukt, onKies, onNieuwProject }: ProjectVeldProps) {
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
      {/* Kon je projecten niet lezen, dan is een nieuw aanmaken zinloos (en zou de
          keuzelijst 'm alsnog niet tonen): pas verbergen tot het laden lukt. */}
      {mislukt ? null : (
        <NieuwProjectVeld onMaak={onNieuwProject} onGemaakt={(p) => onKies(p.id)} />
      )}
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
