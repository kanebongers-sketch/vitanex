'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { LID_STATUSSEN, lidStatusLabel, type LidStatus } from '@/lib/club/kern/lid'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
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
  const taal = useTaal()
  const t = useTekst(LEDEN)
  const f = t.filters
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
    <section className="club-leden-filters" aria-label={f.label} data-bezig={bezig || undefined}>
      <label className="club-leden-zoek">
        <Search aria-hidden size={18} />
        <span className="club-sr">{f.zoekLid}</span>
        <input
          ref={veld}
          type="search"
          className="club-invoer club-invoer--zoek"
          placeholder={f.zoekPlaats}
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
          <span className="club-sr">{f.status}</span>
          <select className="club-invoer" value={params.status ?? ''} onChange={(e) => ga({ status: isStatus(e.target.value) ? e.target.value : null })}>
            <option value="">{f.alleStatussen}</option>
            {LID_STATUSSEN.map((s) => <option key={s} value={s}>{lidStatusLabel(s, taal)}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">{f.abonnement}</span>
          <select className="club-invoer" value={params.abonnement ?? ''} onChange={(e) => ga({ abonnement: e.target.value || null })}>
            <option value="">{f.alleAbonnementen}</option>
            {abonnementen.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">{f.tag}</span>
          <select className="club-invoer" value={params.tag ?? ''} onChange={(e) => ga({ tag: e.target.value || null })}>
            <option value="">{f.alleTags}</option>
            {tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">{f.coach}</span>
          <select className="club-invoer" value={params.coach ?? ''} onChange={(e) => ga({ coach: e.target.value || null })}>
            <option value="">{f.alleCoaches}</option>
            <option value="geen">{f.zonderCoach}</option>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
          </select>
        </label>
        <label className="club-leden-filter">
          <span className="club-sr">{f.ledenapp}</span>
          <select className="club-invoer" value={params.app ?? ''} onChange={(e) => ga({ app: APP_FILTERS.find((f) => f === e.target.value) ?? null })}>
            <option value="">{f.appIedereen}</option>
            <option value="ja">{f.appJa}</option>
            <option value="nee">{f.appNee}</option>
          </select>
        </label>
        <label className="club-leden-filter club-leden-sorteerkeuze">
          <span className="club-sr">{f.sorteren}</span>
          <select className="club-invoer" value={sorteerWaarde < 0 ? 0 : sorteerWaarde}
            onChange={(e) => { const k = SORTEER_KEUZES[Number(e.target.value)]; if (k) ga({ sort: k.sort, oplopend: k.oplopend }) }}>
            {SORTEER_KEUZES.map((k, i) => <option key={k.id} value={i}>{f.sorteer(t.sorteerKeuzes[k.id])}</option>)}
          </select>
        </label>
        <button type="button" className="club-knop club-leden-risico" aria-pressed={params.risico} onClick={() => ga({ risico: !params.risico })}>
          {f.alleenRisico}
        </button>
        {heeftFilter ? (
          <button
            type="button"
            className="club-knop club-knop--stil"
            onClick={() => { setQ(''); ga({ ...STANDAARD_PARAMS, sort: params.sort, oplopend: params.oplopend }) }}
          >
            <X aria-hidden size={15} /> {f.wis}
          </button>
        ) : null}
      </div>
    </section>
  )
}
