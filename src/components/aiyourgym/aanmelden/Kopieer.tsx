'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

// De inloglink kopieren, met een korte bevestiging die een schermlezer voorleest.

export function Kopieer({ tekst }: { tekst: string }) {
  const [gekopieerd, setGekopieerd] = useState<boolean | null>(null)
  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst)
      setGekopieerd(true)
    } catch {
      setGekopieerd(false)
    }
    window.setTimeout(() => setGekopieerd(null), 2400)
  }
  return (
    <>
      <button type="button" className="ayg-knop ayg-knop--accent ayg-knop--klein" onClick={kopieer}>
        {gekopieerd ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {gekopieerd ? 'Gekopieerd' : 'Kopieer link'}
      </button>
      <span className="ayg-sr" aria-live="polite">
        {gekopieerd === true ? 'Link gekopieerd.' : gekopieerd === false ? 'Kopieren lukte niet; selecteer de link en kopieer hem zelf.' : ''}
      </span>
    </>
  )
}
