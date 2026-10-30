'use client'

import { useEffect } from 'react'
import { AUTO_ATTRIBUUT } from '@/lib/club/kern/huisstijl'

// Thema Automatisch: de kleuren schakelen al met CSS (huisstijlAutoCss, geen
// knipperen). Dit zet alleen data-thema mee, voor de paar regels die op licht of
// donker letten (schaduwen), en volgt het apparaat als dat omschakelt.

export function AutoThema() {
  useEffect(() => {
    const vraag = window.matchMedia('(prefers-color-scheme: light)')
    const zet = () => {
      for (const el of document.querySelectorAll<HTMLElement>(`[${AUTO_ATTRIBUUT}]`)) el.dataset.thema = vraag.matches ? 'licht' : 'donker'
    }
    zet()
    vraag.addEventListener('change', zet)
    return () => vraag.removeEventListener('change', zet)
  }, [])
  return null
}
