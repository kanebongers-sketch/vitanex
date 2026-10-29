'use client'

import { useEffect, useEffectEvent, useRef, useState, useTransition, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { CheckinBron } from '@/lib/club/checkin/regels'
import type { CheckinMethode } from '@/lib/club/kern/org-instellingen'
import { lijktOpCheckinCode } from '@/lib/club/checkin/qr-formaat'
import { isCheckinAntwoord, isQrCheckinAntwoord, isZoekAntwoord, type CheckinAntwoord, type ZoekAntwoord } from '@/lib/club/checkin/types'
import { BalieLidKaart, Resultaten, Uitkomst, type UitkomstLid } from './CheckinKaart'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { BalieCamera } from './BalieCamera'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'

// Het baliescherm. Een QR-scanner of bandjeslezer typt als een toetsenbord en
// sluit af met Enter: een exacte code checkt meteen in. Op naam zoeken toont
// de treffers; pijltjes kiezen, Enter checkt in. Het zoekveld houdt de focus.
// Escape wist alles. De uitkomst (WELKOM) blijft even staan en verdwijnt dan,
// zodat het volgende lid een leeg scherm ziet. Past het niet bij het
// lidmaatschap (vestiging of daluren), dan blijft een waarschuwing staan met
// "Toch inchecken": de balie beslist, de API logt het. Enter alleen checkt
// nooit in tegen het lidmaatschap in; daarvoor is de knop.
// De wisselende QR-code uit de ledenapp (FFC1...) gaat als { qr } naar de API,
// via de camera ("Scan met camera") of een scanner die als toetsenbord typt.

const UITKOMST_MS = 8000

interface Resultaat extends ZoekAntwoord {
  query: string
}

interface Afgerond {
  lid: UitkomstLid
  antwoord: CheckinAntwoord
  bron: CheckinBron
}

function isTypveld(doel: EventTarget | null): boolean {
  return doel instanceof HTMLElement && (doel.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(doel.tagName))
}

interface Props {
  vestiging: Vestiging
  /** Check-in methode van de sportschool: bepaalt of de camera er is en direct aan staat. */
  methode: CheckinMethode
  /** Mag deze persoon Leden zien? Dan linkt de naam in de uitkomst naar de ledenkaart. */
  magLeden: boolean
  /**
   * Compact op Vandaag (besluit Kane 27-10-2026): geen autofocus (geen toetsenbord
   * bij het openen op de telefoon), geen camera die vanzelf aangaat, geen
   * wachtscherm en toetsen elders op de pagina blijven van de pagina (G en een
   * letter). Het volledige scherm (/club/checkin) blijft de vaste balie.
   */
  compact?: boolean
}

type Doel = { lid: UitkomstLid } | { qr: string }

/** Leeg baliescherm: rustig, groot en duidelijk wat je kunt doen. */
function Wachtstand() {
  const t = useTekst(CHECKIN).balie
  return (
    <div className="club-checkin-wacht">
      <span className="club-checkin-wacht-icoon" aria-hidden>
        <ScanLine size={30} />
      </span>
      <p className="club-checkin-wacht-titel">{t.wachtTitel}</p>
      <p className="club-checkin-wacht-tekst">{t.wachtTekst}</p>
    </div>
  )
}

function foutUit(data: unknown): string | null {
  return typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
}

export function CheckinBalie({ vestiging, methode, magLeden, compact = false }: Props) {
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
  const t = useTekst(CHECKIN).balie

  async function zoek(q: string): Promise<Resultaat | null> {
    const nr = ++verzoekNr.current
    try {
      const res = await fetch(`/api/club/checkin/zoek?v=${encodeURIComponent(vestiging)}&q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data: unknown = await res.json().catch(() => null)
      if (nr !== verzoekNr.current) return null
      if (!res.ok || !isZoekAntwoord(data)) {
        setFout(t.zoekFout)
        return null
      }
      const r: Resultaat = { ...data, query: q }
      setResultaat(r)
      setGekozen(0)
      setFout(null)
      return r
    } catch {
      if (nr === verzoekNr.current) setFout(t.geenVerbinding)
      return null
    }
  }

  /** Een gevonden lid (lidId) of een gescande app-code (qr) inchecken. */
  async function inchecken(doel: Doel, bron: CheckinBron, toch = false) {
    setBezig(true)
    setFout(null)
    const body = 'qr' in doel ? { qr: doel.qr, vestiging, toch } : { lidId: doel.lid.id, vestiging, bron, toch }
    try {
      const res = await fetch('/api/club/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data: unknown = await res.json().catch(() => null)
      const lid = 'qr' in doel ? (isQrCheckinAntwoord(data) ? data.lid : null) : doel.lid
      if (!res.ok || !isCheckinAntwoord(data) || !lid) {
        setFout(foutUit(data) ?? t.incheckFout)
        return
      }
      setAfgerond({ lid, antwoord: data, bron })
      setResultaat(null)
      setQuery('')
      verzoekNr.current += 1
      startTransition(() => router.refresh())
    } catch {
      setFout(t.incheckVerbinding)
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

  function wis() {
    window.clearTimeout(klok.current)
    verzoekNr.current += 1
    setQuery('')
    setResultaat(null)
    setAfgerond(null)
    setFout(null)
    veld.current?.focus()
  }

  const wisVanScherm = useEffectEvent(() => wis())

  useEffect(() => () => window.clearTimeout(klok.current), [])

  useEffect(() => {
    if (!afgerond || afgerond.antwoord.soort === 'vorm_waarschuwing') return
    const weg = window.setTimeout(() => setAfgerond(null), UITKOMST_MS)
    return () => window.clearTimeout(weg)
  }, [afgerond])

  // Een scan terwijl de focus ergens anders staat: terug naar het zoekveld.
  // Escape werkt overal op het scherm.
  useEffect(() => {
    if (compact) return
    function toets(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && !isTypveld(e.target)) return wisVanScherm()
      if (isTypveld(e.target) || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return
      veld.current?.focus()
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [compact])

  async function enter(waarde = query) {
    const q = waarde.trim()
    if (!q || bezig) return
    window.clearTimeout(klok.current)
    if (lijktOpCheckinCode(q)) {
      setQuery('')
      return inchecken({ qr: q }, 'qr')
    }
    const huidig = resultaat?.query === q ? resultaat : await zoek(q)
    if (!huidig) return
    const lid = huidig.leden[huidig === resultaat ? gekozen : 0]
    const scan = huidig.exact && huidig.leden.length === 1
    if (lid && (scan || huidig === resultaat)) await inchecken({ lid }, huidig.exact ? huidig.bron : 'balie')
  }

  /** Een scan van de camera: een app-code gaat als qr, een andere code (pasje, bandje) via zoeken. */
  function cameraScan(code: string) {
    if (bezig) return
    setAfgerond(null)
    if (!lijktOpCheckinCode(code)) setQuery(code)
    void enter(code)
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
      e.preventDefault()
      wis()
    }
  }

  const leden = resultaat && resultaat.query === query.trim() ? resultaat.leden : []
  const lid = leden[gekozen] ?? null
  const lijstOpen = leden.length > 1

  return (
    <section className="club-checkin-balie" data-compact={compact || undefined} aria-label={t.label}>
      <label className="club-checkin-zoek">
        <ScanLine aria-hidden size={26} />
        <span className="club-sr">{t.zoekLabel}</span>
        <input
          ref={veld}
          autoFocus={!compact}
          value={query}
          onChange={(e) => typ(e.target.value)}
          onKeyDown={toets}
          placeholder={t.plaats}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-describedby="checkin-hulp"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={lijstOpen}
          aria-controls={lijstOpen ? 'checkin-resultaten' : undefined}
          aria-activedescendant={lijstOpen ? `checkin-optie-${gekozen}` : undefined}
        />
      </label>
      <p id="checkin-hulp" className="club-hint club-checkin-hulp">
        {t.hulpVoor} <kbd>↑</kbd> <kbd>↓</kbd>, <kbd>Enter</kbd> {t.hulpEnter} <kbd>Esc</kbd> {t.hulpEsc}
        {methode === 'qr' ? t.telefoonVergeten : ''}
      </p>
      {methode !== 'balie' && <BalieCamera startOpen={methode === 'qr' && !compact} pauze={bezig} onCode={cameraScan} />}
      {fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}
      {afgerond ? (
        <Uitkomst key={`${afgerond.lid.id}-${afgerond.antwoord.soort}`} lid={afgerond.lid} antwoord={afgerond.antwoord} bezig={bezig} duurMs={UITKOMST_MS} lidHref={magLeden ? lidKaartPad(afgerond.lid.id, vestiging, 'planning') : null} onToch={() => void inchecken({ lid: afgerond.lid }, afgerond.bron, true)} onNiet={wis} />
      ) : null}
      {lijstOpen ? <Resultaten id="checkin-resultaten" leden={leden} gekozen={gekozen} onKies={(i) => { setGekozen(i); veld.current?.focus() }} /> : null}
      {lid ? <BalieLidKaart lid={lid} bezig={bezig} onInchecken={() => void inchecken({ lid }, resultaat?.exact ? resultaat.bron : 'balie', lid.vormWaarschuwing !== null)} /> : null}
      {!query && !afgerond && !fout && methode !== 'qr' && !compact ? <Wachtstand /> : null}
      {resultaat && resultaat.query === query.trim() && !leden.length ? (
        <p className="club-leeg">{t.niemand(resultaat.query)}</p>
      ) : null}
    </section>
  )
}
