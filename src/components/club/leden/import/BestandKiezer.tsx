'use client'

import { useRef, useState, type DragEvent } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { decodeerBestand } from '@/lib/club/leden/import/csv'

// Stap 1: een CSV-bestand kiezen of erin slepen. Het bestand wordt in de browser
// gelezen; er gaat niets naar de server tot Kane op "Controleren" drukt.

const MAX_BYTES = 10 * 1024 * 1024

interface BestandKiezerProps {
  bestandsnaam: string | null
  onGelezen: (naam: string, tekst: string) => void
}

export function BestandKiezer({ bestandsnaam, onGelezen }: BestandKiezerProps) {
  const invoer = useRef<HTMLInputElement>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [slepen, setSlepen] = useState(false)

  async function lees(bestand: File | undefined) {
    if (!bestand) return
    setFout(null)
    if (!/\.(csv|txt)$/i.test(bestand.name)) {
      setFout('Kies een CSV-bestand. Uit Excel: Opslaan als, dan "CSV (gescheiden door lijstscheidingsteken)".')
      return
    }
    if (bestand.size > MAX_BYTES) {
      setFout('Dit bestand is groter dan 10 MB. Splits het in kleinere bestanden.')
      return
    }
    try {
      onGelezen(bestand.name, decodeerBestand(await bestand.arrayBuffer()))
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
        <span className="club-import-zone-sub">{bestandsnaam ? 'Klik om een ander bestand te kiezen' : 'of klik om een CSV-bestand te kiezen'}</span>
      </button>
      <input
        ref={invoer}
        type="file"
        accept=".csv,.txt,text/csv"
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
