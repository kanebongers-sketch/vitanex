'use client'

import { useId, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { verdeelRitme } from '@/components/lifeos/crm/ritme'
import { RitmeKaart } from './RitmeKaart'

// De contact-ritme-weergave: twee emmers i.p.v. status-kolommen. Bovenaan de
// belronde ("Deze week spreken", langst geleden/nooit eerst), daaronder rustiger
// wie deze week al gehad is ("Deze week gesproken"). De verdeling en sortering
// komen puur uit `verdeelRitme`; dit component doet enkel de presentatie.

interface RitmeVakProps {
  personen: Persoon[]
  vandaag: Date | null
  onOpen: (persoon: Persoon) => void
  onGesproken: (persoon: Persoon) => void
}

interface EmmerProps {
  titelId: string
  titel: string
  personen: Persoon[]
  gedempt: boolean
  vandaag: Date | null
  onOpen: (persoon: Persoon) => void
  onGesproken: (persoon: Persoon) => void
  /** Wat te tonen als deze emmer leeg is (alleen zinvol voor "te spreken"). */
  leegMelding?: ReactNode
}

// Eén emmer: een semantische sectie met kop, telling-badge en de kaarten. Leeg?
// Dan de meegegeven melding (of niets). Zo blijft `RitmeVak` zelf compact.
function Emmer({ titelId, titel, personen, gedempt, vandaag, onOpen, onGesproken, leegMelding }: EmmerProps) {
  return (
    <section
      className={`crm-ritme__emmer${gedempt ? ' crm-ritme__emmer--gedempt' : ''}`}
      aria-labelledby={titelId}
    >
      <header className="crm-ritme__kop">
        <h3 id={titelId} className="crm-ritme__titel">
          {titel}
        </h3>
        <span className="crm-ritme__telling" aria-hidden="true">
          {personen.length}
        </span>
      </header>

      {personen.length > 0 ? (
        <ul className="crm-ritme__lijst">
          {personen.map((persoon) => (
            <RitmeKaart
              key={persoon.id}
              persoon={persoon}
              vandaag={vandaag}
              onOpen={() => onOpen(persoon)}
              onGesproken={() => onGesproken(persoon)}
            />
          ))}
        </ul>
      ) : (
        leegMelding ?? null
      )}
    </section>
  )
}

const CSS = `
.crm-ritme {
  display: grid;
  gap: 28px;
}
.crm-ritme__emmer {
  display: grid;
  gap: 14px;
}
.crm-ritme__kop {
  display: flex;
  align-items: center;
  gap: 10px;
}
.crm-ritme__titel {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-1);
}
.crm-ritme__telling {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent);
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
.crm-ritme__lijst {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.crm-ritme__emmer--gedempt .crm-ritme__titel {
  font-size: 15px;
  color: var(--text-3);
}
.crm-ritme__emmer--gedempt .crm-ritme__telling {
  background: transparent;
  border-color: var(--line);
  color: var(--text-3);
}
.crm-ritme__emmer--gedempt .crm-ritme__kaart {
  background: var(--bg-card);
}
.crm-ritme__melding {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 18px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  font-size: 13.5px;
  color: var(--text-2);
}
.crm-ritme__melding svg {
  flex-shrink: 0;
  color: var(--brand);
}
.crm-ritme__hint {
  margin: 0;
  padding: 20px;
  background: var(--bg-card);
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-card);
  font-size: 13.5px;
  color: var(--text-3);
  text-align: center;
}
`

export function RitmeVak({ personen, vandaag, onOpen, onGesproken }: RitmeVakProps) {
  const spreekId = useId()
  const gesprokenId = useId()
  const { teSpreken, gesproken } = verdeelRitme(personen, vandaag)

  // Helemaal niemand in de groep: een rustige, eerlijke hint i.p.v. lege secties.
  if (personen.length === 0) {
    return (
      <div className="crm-ritme">
        <style href="crm-ritme-vak" precedence="medium">
          {CSS}
        </style>
        <p className="crm-ritme__hint" role="status">
          Nog niemand in deze groep.
        </p>
      </div>
    )
  }

  // Wél mensen, maar niemand meer te spreken deze week: een positieve melding.
  const bijMelding = (
    <p className="crm-ritme__melding" role="status">
      <CheckCircle2 size={17} strokeWidth={2.2} aria-hidden="true" />
      Je bent bij — iedereen is deze week gesproken.
    </p>
  )

  return (
    <div className="crm-ritme">
      <style href="crm-ritme-vak" precedence="medium">
        {CSS}
      </style>

      <Emmer
        titelId={spreekId}
        titel="Deze week spreken"
        personen={teSpreken}
        gedempt={false}
        vandaag={vandaag}
        onOpen={onOpen}
        onGesproken={onGesproken}
        leegMelding={bijMelding}
      />

      {gesproken.length > 0 ? (
        <Emmer
          titelId={gesprokenId}
          titel="Deze week gesproken"
          personen={gesproken}
          gedempt
          vandaag={vandaag}
          onOpen={onOpen}
          onGesproken={onGesproken}
        />
      ) : null}
    </div>
  )
}
