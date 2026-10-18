'use client'

import { useCallback, useMemo, useState } from 'react'
import type { EditorStaat } from '@/lib/club/training/editor'
import { begin, kanOngedaan, kanOpnieuw, ongedaan, opnieuw, zet, type Geschiedenis } from '@/lib/club/training/geschiedenis'

export interface EditorStaatApi {
  staat: EditorStaat
  /** Een bewerking; `samenvoeg` voegt typen in hetzelfde veld samen tot een stap. */
  wijzig: (bewerking: (s: EditorStaat) => EditorStaat, samenvoeg?: string) => void
  ongedaan: () => void
  opnieuw: () => void
  kanOngedaan: boolean
  kanOpnieuw: boolean
}

/** De regels van het schema met ongedaan maken en opnieuw. */
export function useEditorStaat(beginStaat: EditorStaat): EditorStaatApi {
  const [g, setG] = useState<Geschiedenis<EditorStaat>>(() => begin(beginStaat))
  const wijzig = useCallback((bewerking: (s: EditorStaat) => EditorStaat, samenvoeg?: string) => {
    setG((h) => zet(h, bewerking(h.heden), samenvoeg ?? null))
  }, [])
  const terug = useCallback(() => setG(ongedaan), [])
  const vooruit = useCallback(() => setG(opnieuw), [])
  return useMemo(
    () => ({ staat: g.heden, wijzig, ongedaan: terug, opnieuw: vooruit, kanOngedaan: kanOngedaan(g), kanOpnieuw: kanOpnieuw(g) }),
    [g, wijzig, terug, vooruit],
  )
}
