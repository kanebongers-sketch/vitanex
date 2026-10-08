'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { haalBestand } from '@/lib/lifeos/api/http'
import { exportBestandsnaam, type ExportSoort } from '@/lib/lifeos/pt-dashboard/export'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'

// Download van alle leads of alle PT-klanten als CSV (Excel NL). Een gewone
// <a href> kan het Bearer-token niet meesturen, dus: fetch → Blob → download.

const SOORTEN: readonly { soort: ExportSoort; label: string }[] = [
  { soort: 'leads', label: 'Leads (CSV)' },
  { soort: 'klanten', label: 'Klanten (CSV)' },
]

function bewaar(blob: Blob, naam: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = naam
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Even laten staan: sommige browsers lezen de URL pas na de klik-afhandeling.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ExportKnoppen() {
  const [bezig, setBezig] = useState<ExportSoort | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  async function download(soort: ExportSoort): Promise<void> {
    setBezig(soort)
    setFout(null)
    const uit = await haalBestand(`/api/lifeos/pt-team/export?soort=${soort}`)
    setBezig(null)
    if (!uit.ok) {
      setFout(`Download mislukt: ${uit.fout}`)
      return
    }
    bewaar(uit.waarde.blob, uit.waarde.bestandsnaam ?? exportBestandsnaam(soort, dagSleutelNl(new Date())))
  }

  return (
    <div className="ptd-acties" role="group" aria-label="Exporteren naar Excel">
      {SOORTEN.map(({ soort, label }) => (
        <button
          key={soort}
          type="button"
          className="ptd-knop ptd-knop--klein"
          onClick={() => void download(soort)}
          disabled={bezig !== null}
          aria-busy={bezig === soort}
        >
          <Download size={15} aria-hidden="true" />
          {bezig === soort ? 'Bezig…' : label}
        </button>
      ))}
      <span className="ptd-hint" role={fout ? 'alert' : undefined}>
        {fout ?? 'Opent in Excel. Bevat contactgegevens: niet verder delen.'}
      </span>
    </div>
  )
}
