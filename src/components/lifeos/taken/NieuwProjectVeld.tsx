'use client'

import { useId, useState, type CSSProperties, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { MAX_PROJECT_NAAM, type Project } from '@/lib/lifeos/projecten/projecten'
import { INVOER } from './detailStijl'
import type { ProjectMaakUitkomst } from './useProjecten'

// Een nieuw project aanmaken zónder de takenlijst te verlaten. Tot nu toe kon je
// alleen kiezen uit wat er al was — een leeg projectveld was een doodlopende weg.
//
// Presentationeel: het weet niet hoe een project wordt opgeslagen, alleen dat
// `onMaak` het probeert en met een uitkomst terugkomt. Rustig ingeklapt tot je
// het nodig hebt: een tekstknop, en pas na een klik een veldje — geen tweede
// formulier dat permanent onder de keuzelijst staat te schreeuwen.

interface NieuwProjectVeldProps {
  onMaak: (naam: string) => Promise<ProjectMaakUitkomst>
  /** Het verse project — de aanroeper kiest het meteen voor de taak. */
  onGemaakt: (project: Project) => void
}

export function NieuwProjectVeld({ onMaak, onGemaakt }: NieuwProjectVeldProps) {
  const [open, setOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const id = useId()

  if (!open) {
    return (
      <Knop onClick={() => setOpen(true)}>
        <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
        Nieuw project
      </Knop>
    )
  }

  const sluit = () => {
    setOpen(false)
    setNaam('')
    setFout(null)
  }

  const versturen = async (e: FormEvent) => {
    e.preventDefault()
    const schoon = naam.trim()
    if (schoon.length === 0 || bezig) return

    setBezig(true)
    setFout(null)
    const uitkomst = await onMaak(schoon)
    setBezig(false)

    if (!uitkomst.ok) {
      // De reden mag niet verdwijnen: een dubbele naam is iets anders dan een
      // storing, en de gebruiker fixt alleen wat hij ziet.
      setFout(uitkomst.fout)
      return
    }

    onGemaakt(uitkomst.project)
    setNaam('')
    setOpen(false)
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <form onSubmit={(e) => void versturen(e)} style={{ display: 'flex', gap: 8 }}>
        <label htmlFor={id} style={VERBORGEN}>
          Naam van het nieuwe project
        </label>
        <input
          id={id}
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Naam van het project"
          maxLength={MAX_PROJECT_NAAM}
          disabled={bezig}
          style={{ ...INVOER, flex: 1, minWidth: 0 }}
        />
        <Knop type="submit" variant="primair" disabled={bezig || naam.trim().length === 0}>
          Maak
        </Knop>
        <Knop type="button" aria-label="Annuleren" onClick={sluit}>
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </Knop>
      </form>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}

/** Zichtbaar voor screenreaders, niet voor het oog. */
const VERBORGEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
