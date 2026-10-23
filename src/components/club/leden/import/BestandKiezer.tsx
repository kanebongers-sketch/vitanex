'use client'

import { useRef, useState, type DragEvent } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import type { CsvTabel } from '@/lib/club/leden/import/csv'
import { BESTAND_ACCEPT, controleerBestand, leesLedenBestand } from '@/lib/club/leden/import/bestand'

// Stap 1: een CSV- of Excel-bestand (.xlsx) kiezen of erin slepen. Het bestand
// wordt in de browser gelezen en nergens bewaard; er gaat niets naar de server
// tot de eigenaar op "Controleren" drukt, en dan alleen de rijen.

interface BestandKiezerProps {
  bestandsnaam: string | null
  onGelezen: (naam: string, tabel: CsvTabel) => void
}

export function BestandKiezer({ bestandsnaam, onGelezen }: BestandKiezerProps) {
  const invoer = useRef<HTMLInputElement>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [slepen, setSlepen] = useState(false)

  async function lees(bestand: File | undefined) {
    if (!bestand) return
    setFout(null)
    const vooraf = controleerBestand(bestand.name, bestand.size)
    if (vooraf) {
      setFout(vooraf)
      return
    }
    try {
      const uit = await leesLedenBestand(bestand.name, await bestand.arrayBuffer())
      if (uit.ok) onGelezen(bestand.name, uit.tabel)
      else setFout(uit.fout)
    } catch {
      setFout('Het bestand kon niet worden gelezen. Probeer het opnieuw.')
    }
  }

  function laatVallen(e: DragEvent) {
    e.preventDefault()
    setSlepen(false)
    void lees(e.dataTransfer.files[0])
  }

  return (
    <div className="club-import-kiezer">
      <button
        type="button"
        className="club-import-zone"
        data-slepen={slepen || undefined}
        onClick={() => invoer.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setSlepen(true)
        }}
        onDragLeave={() => setSlepen(false)}
        onDrop={laatVallen}
      >
        {bestandsnaam ? <FileSpreadsheet size={28} aria-hidden /> : <Upload size={28} aria-hidden />}
        <span className="club-import-zone-titel">{bestandsnaam ?? 'Sleep het ledenbestand hierheen'}</span>
        <span className="club-import-zone-sub">{bestandsnaam ? 'Klik om een ander bestand te kiezen' : 'of klik om een CSV- of Excel-bestand te kiezen'}</span>
      </button>
      <input
        ref={invoer}
        type="file"
        accept={BESTAND_ACCEPT}
        hidden
        onChange={(e) => {
          void lees(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </div>
  )
}
