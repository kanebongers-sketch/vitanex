'use client'

import { useState } from 'react'
import { Check, Copy, ShieldCheck } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { TWEESTAPS } from '@/lib/aiyourgym/taal/woorden/club/tweestaps'

// De tien herstelcodes, precies een keer in beeld na het aanzetten van
// tweestapsverificatie. Daarna staan alleen de hashes in de database.

interface HerstelcodesProps {
  codes: readonly string[]
  onKlaar: () => void
}

export function Herstelcodes({ codes, onKlaar }: HerstelcodesProps) {
  const t = useTekst(TWEESTAPS).instellen
  const [gekopieerd, setGekopieerd] = useState(false)

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setGekopieerd(true)
    } catch {
      setGekopieerd(false)
    }
  }

  return (
    <section className="club-kaart club-2fa" aria-labelledby="herstel-kop" data-stand="aan">
      <h2 id="herstel-kop" className="club-2fa-kop">
        <ShieldCheck size={18} aria-hidden /> {t.herstelKop}
      </h2>
      <p>{t.herstelUitleg}</p>
      <ol className="club-2fa-herstel">
        {codes.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ol>
      <div className="club-acties">
        <button type="button" className="club-knop" onClick={() => void kopieer()}>
          {gekopieerd ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {gekopieerd ? t.gekopieerd : t.kopieer}
        </button>
        <button type="button" className="club-knop club-knop--primair" onClick={onKlaar}>
          {t.klaar}
        </button>
      </div>
    </section>
  )
}
