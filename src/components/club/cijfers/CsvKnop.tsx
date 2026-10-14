'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { naarCsv, type CsvWaarde } from '@/lib/club/cijfers/csv'

// Download de tabel achter een blok als CSV (Excel-vriendelijk). De rijen zijn
// al op de server geteld; hier wordt alleen het bestand gemaakt.

export interface CsvTabel {
  bestand: string
  kop: string[]
  rijen: CsvWaarde[][]
}

export function CsvKnop({ tabel, label }: { tabel: CsvTabel; label: string }) {
  const [fout, setFout] = useState<string | null>(null)

  function download() {
    try {
      const blob = new Blob([naarCsv(tabel.kop, tabel.rijen)], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = tabel.bestand
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setFout(null)
    } catch {
      setFout('Downloaden lukte niet. Probeer het opnieuw.')
    }
  }

  return (
    <span className="club-cijfers-csv">
      <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={download} aria-label={`${label} downloaden als CSV`}>
        <Download aria-hidden size={14} />
        CSV
      </button>
      {fout && (
        <span className="club-fout" role="alert">
          {fout}
        </span>
      )}
    </span>
  )
}
