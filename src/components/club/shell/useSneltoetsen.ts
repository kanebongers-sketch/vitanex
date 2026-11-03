'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Verborgen } from '@/lib/club/kern/pakketten'
import { doelVoorToets } from './onderdelen'
import { inInvoer } from './ClubZoeken'

// Sneltoetsen op de pc: G en dan een letter. V, L, R, T en B openen de vijf
// plekken; de oude letters blijven werken en openen hun scherm (G K Taken, G E
// Leads, G A Agenda, G I Instellingen, G H Hulp, G C de check-in op Vandaag).
// Alleen buiten invoervelden, zonder Ctrl, Alt of Cmd, en alleen waar deze
// persoon mag komen. De letters staan in onderdelen.ts en in het zoekvenster (Ctrl K).

/** Hoe lang na G de tweede letter nog telt. */
const WACHTTIJD_MS = 1200

interface SneltoetsenOpties {
  uit: readonly Verborgen[]
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
        const doel = doelVoorToets(letter, uit, toegestaan, instellingen)
        if (doel !== null) {
          e.preventDefault()
          router.push(href(doel))
        }
        return
      }
      sinds = letter === 'g' ? Date.now() : 0
    }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [router, uit, toegestaan, instellingen, href])
}
