'use client'

import { useState } from 'react'
import { KeyRound, Send } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'

// De knoppen bij een koppeling op de Systeem-pagina: een proefmail naar het
// eigen adres, of een nieuw VAPID-sleutelpaar voor push (eenmalig zichtbaar).

type Melding = { ok: boolean; tekst: string } | null

export function ProefmailKnop({ soort }: { soort: 'club' | 'ayg' }) {
  const t = useTekst(PLATFORM).systeem.koppelingen.testmail
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding>(null)

  async function stuur() {
    setBezig(true)
    setMelding(null)
    try {
      const res = await fetch('/api/club/platform/testmail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ soort }) })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; aan?: string; fout?: string; naam?: string } | null
      if (data?.ok && data.aan) setMelding({ ok: true, tekst: t.ok(data.aan) })
      else if (data?.fout === 'te_vaak') setMelding({ ok: false, tekst: t.te_vaak })
      else if (data?.fout === 'niet_ingesteld') setMelding({ ok: false, tekst: t.niet_ingesteld })
      else if (data?.fout === 'resend') setMelding({ ok: false, tekst: t.resend(data.naam ?? '?') })
      else setMelding({ ok: false, tekst: t.fout })
    } catch {
      setMelding({ ok: false, tekst: t.fout })
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="club-systeem-actie">
      <button type="button" className="club-knop club-knop--klein" onClick={() => void stuur()} disabled={bezig}>
        <Send size={14} aria-hidden /> {bezig ? t.bezig : t.knop}
      </button>
      <p className="club-systeem-melding" data-ok={melding?.ok || undefined} role="status" aria-live="polite">{melding?.tekst}</p>
    </div>
  )
}

export function VapidKnop() {
  const t = useTekst(PLATFORM).systeem.koppelingen.vapid
  const [bezig, setBezig] = useState(false)
  const [regels, setRegels] = useState<string[] | null>(null)
  const [fout, setFout] = useState(false)

  async function maak() {
    setBezig(true)
    setFout(false)
    try {
      const res = await fetch('/api/club/platform/vapid', { method: 'POST' })
      const data = (await res.json().catch(() => null)) as { regels?: string[] } | null
      if (!res.ok || !data?.regels) throw new Error('vapid')
      setRegels(data.regels)
    } catch {
      setFout(true)
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="club-systeem-actie">
      {!regels && (
        <button type="button" className="club-knop club-knop--klein" onClick={() => void maak()} disabled={bezig}>
          <KeyRound size={14} aria-hidden /> {bezig ? t.bezig : t.knop}
        </button>
      )}
      {regels && (
        <>
          <p className="club-hint">{t.uitleg}</p>
          <pre className="club-systeem-sleutels">{regels.join('\n')}</pre>
        </>
      )}
      {fout && <p className="club-systeem-melding" role="alert">{t.fout}</p>}
    </div>
  )
}
