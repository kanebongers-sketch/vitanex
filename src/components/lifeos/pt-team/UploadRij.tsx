'use client'

import { X } from 'lucide-react'
import { leesbareGrootte, soortVanBestand } from '@/lib/lifeos/pt-dashboard/documenten'
import { DocumentVelden, type DocConcept } from './DocumentVelden'

// Eén bestand in de uploadrij: het voorstel (aanpasbaar), de voortgang en een
// eerlijke fout. Puur presentational; de container doet het uploaden.

export type UploadFase = 'wacht' | 'bezig' | 'fout' | 'ongeldig'

export interface UploadItem {
  sleutel: string
  bestand: File
  concept: DocConcept
  fase: UploadFase
  /** 0…1 tijdens het uploaden. */
  voortgang: number
  fout: string | null
  /** "… (1).docx": waarschijnlijk een dubbele download. */
  kopie: boolean
}

interface Props {
  item: UploadItem
  /** Er staat al een document (of een ander bestand in de rij) met deze titel. */
  dubbeleTitel: boolean
  vergrendeld: boolean
  onWijzig: (c: DocConcept) => void
  onWeg: () => void
}

export function UploadRij({ item, dubbeleTitel, vergrendeld, onWijzig, onWeg }: Props) {
  const { bestand, fase } = item
  const soort = soortVanBestand(bestand.name)
  const procent = Math.round(item.voortgang * 100)
  const foutId = `${item.sleutel}-fout`

  return (
    <li className="ptd-rij ffdoc-upload" aria-busy={fase === 'bezig'} aria-describedby={item.fout ? foutId : undefined}>
      <div className="ptd-rij-kop">
        <span className="ffdoc-bestandsnaam">{bestand.name}</span>
        <button type="button" className="ptd-knop ptd-knop--klein" onClick={onWeg} disabled={vergrendeld} aria-label={`${bestand.name} uit de rij halen`}>
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="ptd-meta">
        <span className="ptd-badge">{soort?.label ?? 'Onbekend'}</span>
        <span>{leesbareGrootte(bestand.size)}</span>
        {item.kopie ? <span className="ptd-badge ptd-badge--let-op">Lijkt een kopie</span> : null}
      </div>

      {fase === 'ongeldig' ? null : (
        <DocumentVelden id={item.sleutel} waarde={item.concept} onWijzig={onWijzig} uit={vergrendeld} />
      )}
      {dubbeleTitel && fase !== 'ongeldig' ? (
        <p className="ptd-hint">Er is al een document met deze titel. Bewust? Dan kan het gewoon; anders haal dit bestand weg.</p>
      ) : null}

      {fase === 'bezig' ? (
        <div className="ffdoc-voortgang">
          <progress className="ffdoc-balk" max={100} value={procent} aria-label={`${bestand.name} uploaden`} />
          <span className="ptd-hint">{procent < 100 ? `${procent}%` : 'Vastleggen…'}</span>
        </div>
      ) : null}
      {item.fout ? (
        <p id={foutId} className="ffdoc-fout" role="alert">
          {item.fout}
        </p>
      ) : null}
    </li>
  )
}
