'use client'

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine } from 'lucide-react'
import type { Vestiging } from '@/lib/club/gedeeld/vestiging'
import type { CheckinBron } from '@/lib/club/checkin/regels'
import { isCheckinAntwoord, isZoekAntwoord, type BalieLid, type CheckinAntwoord, type ZoekAntwoord } from '@/lib/club/checkin/types'
import { BalieLidKaart, Resultaten, Uitkomst } from './CheckinKaart'

// Het baliescherm. Een QR-scanner of bandjeslezer typt als een toetsenbord en
// sluit af met Enter: een exacte code checkt meteen in. Op naam zoeken toont
// de treffers; pijltjes kiezen, Enter checkt in. Het zoekveld houdt de focus.

interface Resultaat extends ZoekAntwoord {
  query: string
}

interface Afgerond {
  lid: BalieLid
  antwoord: CheckinAntwoord
}

function isTypveld(doel: EventTarget | null): boolean {
  return doel instanceof HTMLElement && (doel.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(doel.tagName))
}

export function CheckinBalie({ vestiging }: { vestiging: Vestiging }) {
  const router = useRouter()
  const veld = useRef<HTMLInputElement>(null)
  const verzoekNr = useRef(0)
  const klok = useRef<number | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const [gekozen, setGekozen] = useState(0)
  const [afgerond, setAfgerond] = useState<Afgerond | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [, startTransition] = useTransition()

  async function zoek(q: string): Promise<Resultaat | null> {
    const nr = ++verzoekNr.current
    try {
      const res = await fetch(`/api/club/checkin/zoek?v=${encodeURIComponent(vestiging)}&q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data: unknown = await res.json().catch(() => null)
      if (nr !== verzoekNr.current) return null
      if (!res.ok || !isZoekAntwoord(data)) {
        setFout('Zoeken lukte niet. Probeer het opnieuw.')
        return null
      }
      const r: Resultaat = { ...data, query: q }
      setResultaat(r)
      setGekozen(0)
      setFout(null)
      return r
    } catch {
      if (nr === verzoekNr.current) setFout('Geen verbinding. Controleer het internet.')
      return null
    }
  }

  async function inchecken(lid: BalieLid, bron: CheckinBron) {
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/club/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lidId: lid.id, vestiging, bron }),
      })
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok || !isCheckinAntwoord(data)) {
        const melding = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
        setFout(melding ?? 'Inchecken lukte niet. Probeer het opnieuw.')
        return
      }
      setAfgerond({ lid, antwoord: data })
      setResultaat(null)
      setQuery('')
      verzoekNr.current += 1
      startTransition(() => router.refresh())
    } catch {
      setFout('Geen verbinding. Inchecken is niet gelukt.')
    } finally {
      setBezig(false)
      veld.current?.focus()
    }
  }

  // Live zoeken op naam terwijl je typt (een scanner is sneller dan dit).
  function typ(waarde: string) {
    setQuery(waarde)
    setAfgerond(null)
    window.clearTimeout(klok.current)
    const q = waarde.trim()
    if (q.length >= 2) klok.current = window.setTimeout(() => void zoek(q), 220)
  }

  useEffect(() => () => window.clearTimeout(klok.current), [])

  // Een scan terwijl de focus ergens anders staat: terug naar het zoekveld.
  useEffect(() => {
    function toets(e: globalThis.KeyboardEvent) {
      if (isTypveld(e.target) || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return
      veld.current?.focus()
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [])

  async function enter() {
    const q = query.trim()
    if (!q || bezig) return
    window.clearTimeout(klok.current)
    const huidig = resultaat?.query === q ? resultaat : await zoek(q)
    if (!huidig) return
    const lid = huidig.leden[huidig === resultaat ? gekozen : 0]
    const scan = huidig.exact && huidig.leden.length === 1
    if (lid && (scan || huidig === resultaat)) await inchecken(lid, huidig.exact ? huidig.bron : 'balie')
  }

  function toets(e: KeyboardEvent<HTMLInputElement>) {
    const aantal = resultaat?.leden.length ?? 0
    if (e.key === 'Enter') {
      e.preventDefault()
      void enter()
    } else if (e.key === 'ArrowDown' && aantal) {
      e.preventDefault()
      setGekozen((g) => (g + 1) % aantal)
    } else if (e.key === 'ArrowUp' && aantal) {
      e.preventDefault()
      setGekozen((g) => (g - 1 + aantal) % aantal)
    } else if (e.key === 'Escape') {
      typ('')
      setResultaat(null)
    }
  }

  const leden = resultaat && resultaat.query === query.trim() ? resultaat.leden : []
  const lid = leden[gekozen] ?? null

  return (
    <section className="club-checkin-balie" aria-label="Inchecken">
      <label className="club-checkin-zoek">
        <ScanLine aria-hidden size={26} />
        <span className="club-sr">Scan een QR-code of bandje, of zoek op naam of lidnummer</span>
        <input
          ref={veld}
          autoFocus
          value={query}
          onChange={(e) => typ(e.target.value)}
          onKeyDown={toets}
          placeholder="Scan of typ een naam of lidnummer"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-describedby="checkin-hulp"
        />
      </label>
      <p id="checkin-hulp" className="club-hint">QR-code en bandje checken direct in. Op naam: kies met de pijltjes, Enter checkt in.</p>
      {fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}
      {afgerond ? <Uitkomst lid={afgerond.lid} antwoord={afgerond.antwoord} /> : null}
      {leden.length > 1 ? <Resultaten leden={leden} gekozen={gekozen} onKies={(i) => { setGekozen(i); veld.current?.focus() }} /> : null}
      {lid ? <BalieLidKaart lid={lid} bezig={bezig} onInchecken={() => void inchecken(lid, resultaat?.exact ? resultaat.bron : 'balie')} /> : null}
      {resultaat && resultaat.query === query.trim() && !leden.length ? (
        <p className="club-leeg">Niemand gevonden voor &ldquo;{resultaat.query}&rdquo;. Controleer de spelling of zoek op lidnummer.</p>
      ) : null}
    </section>
  )
}
