'use client'

import { useEffect } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { isToegestaanEvent } from '@/lib/analytics'
import type { VitaEventPayload } from '@/lib/vita/events'

// Onzichtbaar eiland in de (app)-layout: stuurt de bestaande vitaEvents-bus
// plus sessiestart en client-fouten door naar /api/events. Fire-and-forget —
// analytics mag de app nooit vertragen of breken.

const SESSIE_KEY = 'mf-analytics-sessie'
const SESSIE_VENSTER_MS = 60 * 60 * 1000
const MAX_FOUTEN_PER_PAGINA = 3

let foutTeller = 0

function stuur(event: string, meta?: Record<string, string>): void {
  authFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify({ event, meta }),
    keepalive: true,
  }).catch(() => {
    // Stil: analytics-uitval is nooit een gebruikersprobleem.
  })
}

export default function AnalyticsListener() {
  useEffect(() => {
    // Sessiestart: hooguit één per uur per tabblad (drijft DAU/WAU/retentie).
    try {
      const laatste = Number(sessionStorage.getItem(SESSIE_KEY) ?? 0)
      if (Date.now() - laatste > SESSIE_VENSTER_MS) {
        sessionStorage.setItem(SESSIE_KEY, String(Date.now()))
        stuur('session_start')
      }
    } catch {
      // sessionStorage kan geblokkeerd zijn (private mode) — dan geen sessie-event.
    }

    const opVitaEvent = (e: Event) => {
      const detail = (e as CustomEvent<VitaEventPayload>).detail
      if (!detail || !isToegestaanEvent(detail.type)) return
      const kind = typeof detail.data?.kind === 'string' ? detail.data.kind : undefined
      stuur(detail.type, kind ? { kind } : undefined)
    }

    const opFout = (e: ErrorEvent) => {
      if (foutTeller >= MAX_FOUTEN_PER_PAGINA) return
      foutTeller += 1
      stuur('client_error', {
        melding: String(e.message ?? 'onbekende fout'),
        pad: window.location.pathname,
      })
    }

    const opRejection = (e: PromiseRejectionEvent) => {
      if (foutTeller >= MAX_FOUTEN_PER_PAGINA) return
      foutTeller += 1
      stuur('client_error', {
        melding: e.reason instanceof Error ? e.reason.message : String(e.reason ?? 'onbekende afwijzing'),
        pad: window.location.pathname,
      })
    }

    window.addEventListener('vita:event', opVitaEvent)
    window.addEventListener('error', opFout)
    window.addEventListener('unhandledrejection', opRejection)
    return () => {
      window.removeEventListener('vita:event', opVitaEvent)
      window.removeEventListener('error', opFout)
      window.removeEventListener('unhandledrejection', opRejection)
    }
  }, [])

  return null
}
