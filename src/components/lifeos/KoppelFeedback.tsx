'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, TriangleAlert, Info, X } from 'lucide-react'

// Feedback na terugkeer uit de Google OAuth-flow (agenda / Gmail). Leeft in het
// founder-dashboard (/kanebongers) — daar landen de koppel-callbacks. Geëxtraheerd
// uit de oude /home toen die de consumenten-home werd.

type MeldingToon = 'ok' | 'fout' | 'info'

interface KoppelMelding {
  toon: MeldingToon
  tekst: string
}

/** Vertaalt één (dienst, status, reden) naar een eerlijke NL-melding. */
function meldingVoor(dienst: string, status: string, reden: string | null): KoppelMelding | null {
  if (status === 'gekoppeld') return { toon: 'ok', tekst: `${dienst} gekoppeld.` }
  if (status === 'geweigerd') {
    return { toon: 'info', tekst: `${dienst} koppelen geannuleerd — je gaf Google geen toestemming.` }
  }
  if (status === 'fout') {
    if (reden === 'niet_ingericht') {
      return { toon: 'fout', tekst: `${dienst} koppelen kan nog niet: deze koppeling is op de server niet ingericht.` }
    }
    if (reden === 'verlopen') {
      return { toon: 'fout', tekst: `${dienst} koppelen is verlopen. Start de koppeling opnieuw.` }
    }
    return { toon: 'fout', tekst: `${dienst} koppelen is niet gelukt. Probeer het zo opnieuw.` }
  }
  return null
}

/** Leest de koppel-status uit de query-params. Agenda gaat vóór inbox als beide er staan. */
function leesKoppelMelding(params: URLSearchParams): KoppelMelding | null {
  const reden = params.get('reden')
  const agenda = params.get('agenda')
  if (agenda) return meldingVoor('Google Agenda', agenda, reden)
  const inbox = params.get('inbox')
  if (inbox) return meldingVoor('Gmail', inbox, reden)
  return null
}

export function KoppelFeedback() {
  const [melding, setMelding] = useState<KoppelMelding | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nieuw = leesKoppelMelding(params)
    if (!nieuw) return

    // Param opruimen zodat een refresh de melding niet opnieuw toont. Pad + hash blijven.
    ;['agenda', 'inbox', 'reden'].forEach((k) => params.delete(k))
    const zoek = params.toString()
    const schone = `${window.location.pathname}${zoek ? `?${zoek}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', schone)

    let timer: ReturnType<typeof setTimeout> | undefined
    let afgebroken = false
    void Promise.resolve().then(() => {
      if (afgebroken) return
      setMelding(nieuw)
      // Bevestiging/annulering verdwijnen vanzelf; een fout blijft staan tot je 'm sluit.
      if (nieuw.toon !== 'fout') timer = setTimeout(() => setMelding(null), 6000)
    })

    return () => {
      afgebroken = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!melding) return null

  const Icon = melding.toon === 'ok' ? CheckCircle2 : melding.toon === 'fout' ? TriangleAlert : Info
  const accent = melding.toon === 'ok' ? 'var(--status-success)' : melding.toon === 'fout' ? 'var(--status-danger)' : 'var(--status-info)'
  const vlak = melding.toon === 'ok' ? 'var(--status-success-soft)' : melding.toon === 'fout' ? 'var(--status-danger-soft)' : 'var(--status-info-soft)'

  return (
    <div
      className="koppel-melding"
      role={melding.toon === 'fout' ? 'alert' : 'status'}
      style={{ background: vlak, borderColor: `color-mix(in srgb, ${accent} 34%, transparent)` }}
    >
      <span className="koppel-melding-ico" style={{ color: accent }}>
        <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <p className="koppel-melding-tekst">{melding.tekst}</p>
      <button type="button" className="koppel-melding-sluit" onClick={() => setMelding(null)} aria-label="Melding sluiten">
        <X size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  )
}
