'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { LID_STATUSSEN, LID_STATUS_LABEL, type LidStatus } from '@/lib/club/kern/lid'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { APP_FILTERS, heeftFilter as metFilter, lijstZoek, SORTEER_KEUZES, STANDAARD_PARAMS, type LijstParams } from '@/lib/club/leden/lijst'

// Zoeken en filteren boven de ledenlijst. Alles gaat via de URL, zodat terug,
// vooruit en delen werken. "/" zet de cursor in het zoekveld.

interface Keuze {
  id: string
  naam: string
}

interface LedenFiltersProps {
  params: LijstParams
  vestiging: Vestiging
  abonnementen: string[]
  tags: string[]
  coaches: Keuze[]
}

function isTypveld(doel: EventTarget | null): boolean {
  return doel instanceof HTMLElement && (doel.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(doel.tagName))
}

function isStatus(v: string): v is LidStatus {
  return (LID_STATUSSEN as readonly string[]).includes(v)
}

export function LedenFilters({ params, vestiging, abonnementen, tags, coaches }: LedenFiltersProps) {
  const router = useRouter()
  const [q, setQ] = useState(params.q)
  const [bezig, startTransition] = useTransition()
  const veld = useRef<HTMLInputElement>(null)

  function ga(wijziging: Partial<LijstParams>) {
    startTransition(() => router.replace(clubPad('/leden', vestiging, lijstZoek(params, wijziging)), { scroll: false }))
  }

  useEffect(() => {
    function toets(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTypveld(e.target)) return
      e.preventDefault()
      veld.current?.focus()
      veld.current?.select()
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [])

  useEffect(() => {
    if (q.trim() === params.q) return
    const klok = window.setTimeout(() => {
      startTransition(() => router.replace(clubPad('/leden', vestiging, lijstZoek(params, { q: q.trim() })), { scroll: false }))
    }, 250)
    return () => window.clearTimeout(klok)
  }, [q, params, router, vestiging])

  const heeftFilter = metFilter(params)
  const sorteerWaarde = SORTEER_KEUZES.findIndex((k) => k.sort === params.sort && k.oplopend === params.oplopend)

  return (
    <section className="club-leden-filters" aria-label="Zoeken en filteren" data-bezig={bezig || undefined}>
      <label className="club-leden-zoek">
        <Search aria-hidden size={18} />
        <span className="club-sr">Zoek een lid</span>
        <input
          ref={veld}
          type="search"
          className="club-invoer club-invoer--zoek"
          placeholder="Zoek op naam, lidnummer of e-mail"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape' && q) { e.preventDefault(); setQ('') } }}
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="club-leden-kbd" aria-hidden>/</kbd>
      </label>

      <div className="club-leden-filterrij">
        <label className="club-leden-filter">
          <span className="club-sr">Status</span>
          <select className="club-invoer" value={params.status ?? ''} onChange={(e) => ga({ status: isStatus(e.target.value) ? e.target.value : null })}>
            <option value="">Alle statussen</option>
            {LID_STATUSSEN.map((s) => <option key={s} value={s}>{LID_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">Abonnement</span>
          <select className="club-invoer" value={params.abonnement ?? ''} onChange={(e) => ga({ abonnement: e.target.value || null })}>
            <option value="">Alle abonnementen</option>
            {abonnementen.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">Tag</span>
          <select className="club-invoer" value={params.tag ?? ''} onChange={(e) => ga({ tag: e.target.value || null })}>
            <option value="">Alle tags</option>
            {tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">Coach</span>
          <select className="club-invoer" value={params.coach ?? ''} onChange={(e) => ga({ coach: e.target.value || null })}>
            <option value="">Alle coaches</option>
            <option value="geen">Zonder coach</option>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">Ledenapp</span>
          <select className="club-invoer" value={params.app ?? ''} onChange={(e) => ga({ app: APP_FILTERS.find((f) => f === e.target.value) ?? null })}>
            <option value="">App: iedereen</option>
            <option value="ja">Heeft de app</option>
            <option value="nee">Nog geen app</option>
          </select>
        </label>
        <label className="club-leden-filter club-leden-sorteerkeuze">
          <span className="club-sr">Sorteren</span>
          <select className="club-invoer" value={sorteerWaarde < 0 ? 0 : sorteerWaarde}
            onChange={(e) => { const k = SORTEER_KEUZES[Number(e.target.value)]; if (k) ga({ sort: k.sort, oplopend: k.oplopend }) }}>
            {SORTEER_KEUZES.map((k, i) => <option key={k.label} value={i}>Sorteer: {k.label}</option>)}
          </select>
        </label>
        <button type="button" className="club-knop club-leden-risico" aria-pressed={params.risico} onClick={() => ga({ risico: !params.risico })}>
          Alleen risico
        </button>
        {heeftFilter ? (
          <button
            type="button"
            className="club-knop club-knop--stil"
            onClick={() => { setQ(''); ga({ ...STANDAARD_PARAMS, sort: params.sort, oplopend: params.oplopend }) }}
          >
            <X aria-hidden size={15} /> Wis filters
          </button>
        ) : null}
      </div>
    </section>
  )
}
