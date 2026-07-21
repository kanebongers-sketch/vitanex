'use client'

import { useId, useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, Check, Pencil, Trash2, X } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { MAX_PROJECT_NAAM, type Project } from '@/lib/lifeos/projecten/projecten'
import type { ActieUitkomst } from './useProjectenBord'

// De beheer-hoek van een projectkaart: hernoemen, (de)archiveren, verwijderen.
// Ingeklapt tot drie icoonknoppen; hernoemen en verwijderen vouwen pas open als
// je ze kiest. Archiveren is het vriendelijke alternatief voor verwijderen — de
// taken blijven, alleen valt het project stil uit de keuzelijsten.

interface ProjectBeheerProps {
  project: Project
  onHernoem: (naam: string) => Promise<ActieUitkomst>
  onZetActief: (actief: boolean) => Promise<ActieUitkomst>
  onVerwijder: () => Promise<ActieUitkomst>
}

type Modus = 'rust' | 'hernoemen' | 'verwijderen'

export function ProjectBeheer({ project, onHernoem, onZetActief, onVerwijder }: ProjectBeheerProps) {
  const [modus, setModus] = useState<Modus>('rust')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const naarRust = () => {
    setModus('rust')
    setFout(null)
  }

  const doe = async (actie: () => Promise<ActieUitkomst>) => {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uitkomst = await actie()
    setBezig(false)
    // De reden mag niet verdwijnen: een dubbele naam is iets anders dan een
    // storing, en de gebruiker fixt alleen wat hij ziet.
    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    setModus('rust')
  }

  if (modus === 'hernoemen') {
    return (
      <HernoemForm
        naam={project.naam}
        bezig={bezig}
        fout={fout}
        onOpslaan={(naam) => void doe(() => onHernoem(naam))}
        onAnnuleer={naarRust}
      />
    )
  }

  if (modus === 'verwijderen') {
    return (
      <div className="proj-beheer" role="group" aria-label={`${project.naam} verwijderen`}>
        <p className="proj-bevestig">
          Verwijderen? De taken blijven bestaan en vallen terug op &ldquo;Zonder project&rdquo;.
        </p>
        <div className="proj-beheer-rij">
          <Knop variant="primair" disabled={bezig} onClick={() => void doe(onVerwijder)}>
            <Trash2 size={14} strokeWidth={2} aria-hidden="true" /> Verwijder
          </Knop>
          <Knop disabled={bezig} onClick={naarRust}>
            Annuleren
          </Knop>
        </div>
        {fout ? <Foutmelding bericht={fout} /> : null}
      </div>
    )
  }

  return (
    <div className="proj-beheer">
      <div className="proj-beheer-rij">
        <button
          type="button"
          className="proj-ico-knop"
          aria-label={`${project.naam} hernoemen`}
          disabled={bezig}
          onClick={() => {
            setFout(null)
            setModus('hernoemen')
          }}
        >
          <Pencil size={15} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="proj-ico-knop"
          aria-label={project.actief ? `${project.naam} archiveren` : `${project.naam} heractiveren`}
          disabled={bezig}
          onClick={() => void doe(() => onZetActief(!project.actief))}
        >
          {project.actief ? (
            <Archive size={15} strokeWidth={2} aria-hidden="true" />
          ) : (
            <ArchiveRestore size={15} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="proj-ico-knop proj-ico-knop--gevaar"
          aria-label={`${project.naam} verwijderen`}
          disabled={bezig}
          onClick={() => {
            setFout(null)
            setModus('verwijderen')
          }}
        >
          <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}

interface HernoemFormProps {
  naam: string
  bezig: boolean
  fout: string | null
  onOpslaan: (naam: string) => void
  onAnnuleer: () => void
}

function HernoemForm({ naam, bezig, fout, onOpslaan, onAnnuleer }: HernoemFormProps) {
  const [waarde, setWaarde] = useState(naam)
  const id = useId()

  const versturen = (e: FormEvent) => {
    e.preventDefault()
    const schoon = waarde.trim()
    if (schoon.length === 0 || bezig) return
    onOpslaan(schoon)
  }

  return (
    <div className="proj-beheer">
      <form className="proj-hernoem" onSubmit={versturen}>
        <label htmlFor={id} className="proj-sr">
          Nieuwe naam voor {naam}
        </label>
        <input
          id={id}
          className="proj-invoer"
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          maxLength={MAX_PROJECT_NAAM}
          disabled={bezig}
          autoFocus
        />
        <Knop
          type="submit"
          variant="primair"
          disabled={bezig || waarde.trim().length === 0}
          aria-label="Naam opslaan"
        >
          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
        </Knop>
        <Knop type="button" aria-label="Hernoemen annuleren" onClick={onAnnuleer} disabled={bezig}>
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </Knop>
      </form>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}
