'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'
import { ALLES_TONEN_PAD } from '@/lib/club/kern/alles-tonen'

// "Alles tonen, ook wat nog leeg is" onder Pakketten en onderdelen (ontwerp
// 03-11-2026). Standaard uit: wat nog nooit gebruikt is staat niet in het menu.
// Meteen zichtbaar na een tik; lukt opslaan niet, dan terug en een melding.

export function AllesTonen({ aan: begin }: { aan: boolean }) {
  const t = useTekst(BEHEER).centrum.allesTonen
  const id = useId()
  const router = useRouter()
  const [aan, setAan] = useState(begin)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(false)

  async function wissel() {
    const nieuw = !aan
    setAan(nieuw)
    setBezig(true)
    setFout(false)
    try {
      const res = await fetch(ALLES_TONEN_PAD, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aan: nieuw }) })
      if (!res.ok) throw new Error(String(res.status))
      router.refresh()
    } catch {
      setAan(!nieuw)
      setFout(true)
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="club-ic-alles">
      <span className="club-ic-alles-tekst">
        <span id={`${id}-label`} className="club-ic-alles-label">{t.label}</span>
        <span id={`${id}-uitleg`} className="club-ic-alles-uitleg">{t.uitleg}</span>
        {fout && <span className="club-fout" role="alert">{t.fout}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={aan}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-uitleg`}
        className="club-ic-schakelaar"
        onClick={wissel}
        disabled={bezig}
      >
        <span aria-hidden className="club-ic-schakelaar-bol" />
      </button>
    </div>
  )
}
