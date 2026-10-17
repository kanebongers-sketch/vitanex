'use client'

import { useState, type ReactNode } from 'react'

// Een melding na een actie (aria-live), en daarna de pagina verversen.

export function useMelding(ververs: () => void): { melding: ReactNode; klaar: (tekst: string, ok?: boolean) => void } {
  const [staat, setStaat] = useState<{ ok: boolean; tekst: string } | null>(null)
  const klaar = (tekst: string, ok = true) => {
    setStaat({ ok, tekst })
    if (ok) ververs()
  }
  const melding = (
    <div role="status" aria-live="polite" className="club-lidm-status">
      {staat && <p className={`club-melding ${staat.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{staat.tekst}</p>}
    </div>
  )
  return { melding, klaar }
}
