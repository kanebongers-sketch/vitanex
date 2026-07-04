'use client'

import { useEffect, useRef, useState } from 'react'
import { ADEM, type AdemTab } from './focus-data'

export interface AdemEngine {
  ademTab: AdemTab
  actief: boolean
  faseIdx: number
  teller: number
  ronden: number
  kiesTechniek: (tab: AdemTab) => void
  start: () => void
  stop: () => void
}

/**
 * Ademhalings-engine: telt per seconde af door de fases van de gekozen
 * techniek. Leeft in de pagina-container zodat een lopende oefening niet
 * stopt wanneer de gebruiker tussen tabs wisselt.
 */
export function useAdemEngine(): AdemEngine {
  const [ademTab, setAdemTab] = useState<AdemTab>('box')
  const [actief, setActief] = useState(false)
  const [faseIdx, setFaseIdx] = useState(0)
  const [teller, setTeller] = useState(0)
  const [ronden, setRonden] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!actief) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    const fases = ADEM[ademTab].fases

    let idx = 0
    let resterend = fases[0].duur

    intervalRef.current = setInterval(() => {
      resterend--
      setTeller(resterend)
      if (resterend <= 0) {
        idx = (idx + 1) % fases.length
        resterend = fases[idx].duur
        setFaseIdx(idx)
        setTeller(resterend)
        if (idx === 0) setRonden(r => r + 1)
      }
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [actief, ademTab])

  function kiesTechniek(tab: AdemTab) {
    if (!actief) setAdemTab(tab)
  }

  function start() {
    setFaseIdx(0)
    setTeller(ADEM[ademTab].fases[0].duur)
    setActief(true)
  }

  function stop() {
    setActief(false)
    setFaseIdx(0)
    setTeller(0)
    setRonden(0)
  }

  return { ademTab, actief, faseIdx, teller, ronden, kiesTechniek, start, stop }
}
