'use client'

import { useEffect, useRef, useState } from 'react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { vitaEvent } from '@/lib/vita/events'
import { useToast } from '@/components/ui/Toast'
import { TIMERS, type TimerTab } from './focus-data'

export interface FocusTimerEngine {
  timerTab: TimerTab
  actief: boolean
  rest: number
  klaar: boolean
  voltooideMinuten: number
  wisselTab: (tab: TimerTab) => void
  toggle: () => void
  reset: () => void
}

/**
 * Timer-engine: seconde-teller + logging van voltooide sessies.
 * Leeft in de pagina-container zodat een lopende timer niet stopt wanneer
 * de gebruiker tussen tabs wisselt. Opslaggedrag is identiek aan voorheen:
 * bij afronden wordt de sessie niet-blokkerend gelogd via /api/focus/log.
 */
export function useFocusTimer(onVoltooid: (duurMinuten: number) => void): FocusTimerEngine {
  const { toast } = useToast()
  const [timerTab, setTimerTab] = useState<TimerTab>('focus')
  const [actief, setActief] = useState(false)
  const [rest, setRest] = useState(TIMERS.focus.duur)
  const [klaar, setKlaar] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Afrond-handler via ref, zodat het interval-effect alleen van `actief`
  // afhangt en de seconde-cadans nooit herstart door een re-render.
  const rondAfRef = useRef<() => void>(() => {})
  useEffect(() => {
    rondAfRef.current = () => {
      vitaEvent('habit_completed', { kind: 'focus' })
      const duur = Math.round(TIMERS[timerTab].duur / 60) || 25
      const apiType = timerTab === 'focus' ? 'deep_work' : timerTab === 'pauze' ? 'pauze' : 'pomodoro'
      authFetch('/api/focus/log', {
        method: 'POST',
        body: JSON.stringify({ duur_minuten: duur, type: apiType }),
      }).catch(() => {
        toast({ title: 'Sessie niet opgeslagen', description: 'Je focusblok telt nog steeds — we konden hem alleen niet vastleggen.', variant: 'warning' })
      })
      onVoltooid(duur)
    }
  }, [timerTab, toast, onVoltooid])

  useEffect(() => {
    if (!actief) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRest(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setActief(false)
          setKlaar(true)
          rondAfRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [actief])

  function wisselTab(tab: TimerTab) {
    setTimerTab(tab)
    setActief(false)
    setKlaar(false)
    setRest(TIMERS[tab].duur)
  }

  function toggle() {
    setActief(a => !a)
  }

  function reset() {
    setActief(false)
    setKlaar(false)
    setRest(TIMERS[timerTab].duur)
  }

  const voltooideMinuten = Math.round(TIMERS[timerTab].duur / 60) || 25

  return { timerTab, actief, rest, klaar, voltooideMinuten, wisselTab, toggle, reset }
}
