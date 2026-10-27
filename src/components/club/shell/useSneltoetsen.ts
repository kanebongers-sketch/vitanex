'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Module } from '@/lib/club/kern/organisatie'
import { onderdeelPad, onderdeelVoorToets } from './onderdelen'
import { inInvoer } from './ClubZoeken'

// Sneltoetsen op de pc: G en dan een letter opent een onderdeel (G dan L is
// Leden, G dan C is de check-in bovenaan Vandaag). Alleen buiten invoervelden, zonder Ctrl, Alt of
// Cmd, en alleen voor onderdelen die deze persoon in het menu heeft. De letters
// staan in onderdelen.ts en zijn te zien in het zoekvenster (Ctrl K).

/** Hoe lang na G de tweede letter nog telt. */
const WACHTTIJD_MS = 1200

interface SneltoetsenOpties {
  uit: readonly Module[]
  toegestaan: readonly string[] | null
  instellingen: boolean
  /** Maakt de link naar een onderdeel, met de gekozen vestiging erbij. */
  href: (pad: string) => string
}

function isKaleLetter(e: KeyboardEvent): boolean {
  return e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && !inInvoer(e.target)
}

export function useSneltoetsen({ uit, toegestaan, instellingen, href }: SneltoetsenOpties): void {
  const router = useRouter()
  useEffect(() => {
    let sinds = 0
    const opToets = (e: KeyboardEvent) => {
      if (!isKaleLetter(e) || document.querySelector('[aria-modal="true"]')) return
      const letter = e.key.toLowerCase()
      if (sinds && Date.now() - sinds < WACHTTIJD_MS) {
        sinds = 0
        const doel = onderdeelVoorToets(letter, uit, toegestaan, instellingen)
        if (doel) {
          e.preventDefault()
          router.push(href(onderdeelPad(doel)))
        }
        return
      }
      sinds = letter === 'g' ? Date.now() : 0
    }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [router, uit, toegestaan, instellingen, href])
}
