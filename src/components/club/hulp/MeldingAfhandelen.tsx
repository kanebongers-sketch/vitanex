'use client'

import { useId, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { GRENZEN, STATUSSEN, STATUS_LABEL, type MeldingStatus } from '@/lib/club/hulp/melding'

// Alleen Kane: de status van een melding wijzigen en een antwoord geven dat de
// melder in het helpcentrum ziet.

interface Props {
  id: string
  status: MeldingStatus
  antwoord: string | null
}

export function MeldingAfhandelen({ id, status: begin, antwoord: beginAntwoord }: Props) {
  const router = useRouter()
  const veldId = useId()
  const [status, setStatus] = useState<MeldingStatus>(begin)
  const [antwoord, setAntwoord] = useState(beginAntwoord ?? '')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setMelding(null)
    try {
      const res = await fetch(`/api/club/hulp/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, antwoord }) })
      const json = (await res.json().catch(() => null)) as { fout?: unknown } | null
      if (res.ok) {
        setMelding({ ok: true, tekst: 'Opgeslagen.' })
        router.refresh()
      } else {
        setMelding({ ok: false, tekst: typeof json?.fout === 'string' ? json.fout : 'Opslaan lukte niet.' })
      }
    } catch {
      setMelding({ ok: false, tekst: 'Geen verbinding. Probeer het opnieuw.' })
    }
    setBezig(false)
  }

  return (
    <form className="club-hulp-afhandelen" onSubmit={bewaar}>
      <div className="club-segment" aria-label="Status">
        {STATUSSEN.map((s) => (
          <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <label className="club-veld" htmlFor={veldId}>
        <span>Antwoord aan de melder</span>
        <textarea id={veldId} className="club-invoer" rows={3} value={antwoord} onChange={(e) => setAntwoord(e.target.value)} maxLength={GRENZEN.antwoord} placeholder="De melder ziet dit in het helpcentrum. Er gaat geen mail." />
      </label>
      <div className="club-hulp-verstuur">
        <button type="submit" className="club-knop club-knop--primair club-knop--klein" disabled={bezig} aria-busy={bezig}>
          {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
        {melding && (
          <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`} role={melding.ok ? 'status' : 'alert'}>
            {melding.tekst}
          </p>
        )}
      </div>
    </form>
  )
}
