'use client'

import { useState } from 'react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING_EIGEN } from '@/lib/aiyourgym/taal/woorden/club/voeding-eigen'

// Mogen leden het plan van de trainer zelf overschrijven? Standaard nee: dan
// sturen ze een voorstel. Alleen voor Kane, de eigenaar en de clubmanager.

export function RegelsSchakelaar({ ledenOverschrijven }: { ledenOverschrijven: boolean }) {
  const t = useTekst(VOEDING_EIGEN).regels
  const [aan, setAan] = useState(ledenOverschrijven)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function wissel(nieuw: boolean) {
    setBezig(true)
    setFout(null)
    setAan(nieuw)
    try {
      const res = await fetch('/api/club/voeding/regels', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ledenOverschrijven: nieuw }) })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setAan(!nieuw)
      setFout(t.mislukt)
    } finally {
      setBezig(false)
    }
  }

  return (
    <section className="club-voeding-regels" aria-labelledby="voeding-regels-kop">
      <h2 id="voeding-regels-kop">{t.titel}</h2>
      <p className="club-hint">{t.uitleg}</p>
      <label>
        <input type="checkbox" checked={aan} disabled={bezig} onChange={(e) => void wissel(e.target.checked)} />
        <span>{t.schakel}</span>
      </label>
      <p className="club-hint" role="status">{aan ? t.aan : t.uit}</p>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
