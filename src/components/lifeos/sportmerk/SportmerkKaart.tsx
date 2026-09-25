'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import type { Strategie } from '@/lib/lifeos/sportmerk/types'
import { leesStrategie } from './lees'
import { SportmerkInhoud } from './SportmerkInhoud'
import { SPM_CSS } from './stijl'

// ─── LifeOS — Sportmerk ─────────────────────────────────────────────────────
// Container: haalt het plan op bij `/api/lifeos/sportmerk` (founder-gated) en
// kiest de staat. Tekent zelf niets inhoudelijks — dat doet `SportmerkInhoud`.
// Fout ≠ leeg: een storing toont `Foutmelding`, nooit een leeg plan.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; strategie: Strategie }

export function SportmerkKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  // Generatieteller: een late vlucht (of één na unmount) overschrijft niets.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/sportmerk', leesStrategie).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(uitkomst.ok ? { fase: 'ok', strategie: uitkomst.waarde } : { fase: 'fout', bericht: uitkomst.fout })
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — stabiele cleanup-ref. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return (
    <Kaart titel="Strategie" vervangt="losse strategiedocs" nadruk="dragend">
      <style href="spm" precedence="medium">
        {SPM_CSS}
      </style>
      {staat.fase === 'laden' ? <SportmerkSkelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? <SportmerkInhoud strategie={staat.strategie} /> : null}
    </Kaart>
  )
}

function SportmerkSkelet() {
  return (
    <div className="spm__skelet" aria-hidden="true">
      <div className="spm__skelet-blok spm__skelet-blok--kop" />
      <div className="spm__skelet-blok" />
      <div className="spm__skelet-blok spm__skelet-blok--tabel" />
    </div>
  )
}
