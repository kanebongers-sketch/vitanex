'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Plus, Search, X } from 'lucide-react'
import type { LidOefening } from '@/lib/club/training/lid-schemas/typen'
import { filterBibliotheek, filterKeuzes, LEEG_FILTER, type BibFilter } from '@/lib/club/training/lid-schemas/bewerken'
import { OefeningVoorbeeld, RenderDuim } from '@/components/club/training/repspeler/OefeningVoorbeeld'
import { OefeningCoaching } from '@/components/club/training/coaching/OefeningCoaching'
import { SpierBlok } from '@/components/club/training/SpierChips'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'

// De oefenbibliotheek voor leden: zoeken, filteren op spiergroep en materiaal,
// en per oefening het HD-beeld met de rep-speler, de spieren en de coaching.
// Toevoegen kan in de lijst (plus) of onderaan het detail.

interface Props {
  oefeningen: LidOefening[] | null
  fout: string | null
  /** "Dag A": waar een toegevoegde oefening heen gaat. */
  dagLabel: string
  onToevoegen: (oefeningId: string) => void
  onSluit: () => void
  /** Meteen het detail van deze oefening (vanaf een kaart in de editor). */
  detailId?: string | null
}

export function Bibliotheek({ oefeningen, fout, dagLabel, onToevoegen, onSluit, detailId = null }: Props) {
  const es = useTekst(EIGEN_SCHEMA)
  const t = es.bibliotheek
  const sluiten = es.editor.sluiten
  const lb = useTekst(TRAINING_LABELS)
  const [filter, setFilter] = useState<BibFilter>(LEEG_FILTER)
  const [detail, setDetail] = useState<string | null>(detailId)
  const [net, setNet] = useState<string | null>(null)
  const blad = useRef<HTMLDivElement>(null)
  const lijst = useMemo(() => (oefeningen ? filterBibliotheek(oefeningen, filter) : []), [oefeningen, filter])
  const keuzes = useMemo(() => filterKeuzes(oefeningen ?? []), [oefeningen])
  const gekozen = oefeningen?.find((o) => o.id === detail) ?? null

  useEffect(() => {
    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    blad.current?.focus()
    const toets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', toets)
    return () => {
      window.removeEventListener('keydown', toets)
      vorige?.focus()
    }
  }, [onSluit])

  function voegToe(id: string) {
    onToevoegen(id)
    setNet(id)
  }

  return (
    <div className="club-lidapp-blad-scherm" onMouseDown={(e) => e.target === e.currentTarget && onSluit()}>
      <div ref={blad} className="club-lidapp-blad club-es-bib" role="dialog" aria-modal="true" aria-label={gekozen?.naam ?? t.kop} tabIndex={-1}>
        <div className="club-lidapp-blad-kop">
          {gekozen ? (
            <button type="button" className="club-lidapp-blad-sluit" onClick={() => setDetail(null)} aria-label={t.terug}>
              <ArrowLeft aria-hidden size={20} />
            </button>
          ) : (
            <h3>{t.kop}</h3>
          )}
          <button type="button" className="club-lidapp-blad-sluit" onClick={onSluit} aria-label={sluiten}>
            <X aria-hidden size={20} />
          </button>
        </div>
        {gekozen ? (
          <OefeningDetail oefening={gekozen} toegevoegd={net === gekozen.id} dagLabel={dagLabel} onToevoegen={() => voegToe(gekozen.id)} />
        ) : (
          <>
            <label className="club-es-zoek">
              <Search aria-hidden size={18} />
              <span className="club-sr">{t.zoek}</span>
              <input type="search" value={filter.zoek} placeholder={t.zoek} onChange={(e) => setFilter({ ...filter, zoek: e.target.value })} enterKeyHint="search" />
            </label>
            <FilterRij label={t.spiergroep} alles={t.alles} waarden={keuzes.spiergroepen} gekozen={filter.spiergroep} naam={(s) => lb.spiergroep[s]} onKies={(spiergroep) => setFilter({ ...filter, spiergroep })} />
            <FilterRij label={t.materiaal} alles={t.alles} waarden={keuzes.materialen} gekozen={filter.materiaal} naam={(m) => lb.materiaal[m]} onKies={(materiaal) => setFilter({ ...filter, materiaal })} />
            {fout && <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">{fout}</p>}
            {!oefeningen && !fout && <p className="club-es-laden" role="status">{t.laden}</p>}
            {oefeningen && (
              <>
                <p className="club-lidapp-label" aria-live="polite">{t.aantal(lijst.length)}</p>
                {lijst.length === 0 ? (
                  <p className="club-lidapp-leeg">{t.geen}</p>
                ) : (
                  <ul className="club-es-biblijst">
                    {lijst.map((o) => (
                      <li key={o.id}>
                        <button type="button" className="club-es-bibrij" onClick={() => setDetail(o.id)}>
                          <RenderDuim naam={o.naam} anders={<span className="club-es-duim-leeg" aria-hidden />} />
                          <span>
                            <strong>{o.naam}</strong>
                            <small>{lb.spiergroep[o.spiergroep]} · {lb.materiaal[o.materiaal]}</small>
                          </span>
                        </button>
                        <button type="button" className="club-es-plus" data-net={net === o.id || undefined} onClick={() => voegToe(o.id)} aria-label={`${t.toevoegen(dagLabel)}: ${o.naam}`}>
                          {net === o.id ? <Check aria-hidden size={20} /> : <Plus aria-hidden size={20} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface FilterRijProps<T extends string> {
  label: string
  alles: string
  waarden: readonly T[]
  gekozen: T | null
  naam: (v: T) => string
  onKies: (v: T | null) => void
}

function FilterRij<T extends string>({ label, alles, waarden, gekozen, naam, onKies }: FilterRijProps<T>) {
  if (waarden.length < 2) return null
  return (
    <div className="club-es-filters" role="group" aria-label={label}>
      <button type="button" aria-pressed={gekozen === null} onClick={() => onKies(null)}>{alles}</button>
      {waarden.map((w) => (
        <button key={w} type="button" aria-pressed={gekozen === w} onClick={() => onKies(gekozen === w ? null : w)}>{naam(w)}</button>
      ))}
    </div>
  )
}

interface DetailProps {
  oefening: LidOefening
  toegevoegd: boolean
  dagLabel: string
  onToevoegen: () => void
}

function OefeningDetail({ oefening: o, toegevoegd, dagLabel, onToevoegen }: DetailProps) {
  const t = useTekst(EIGEN_SCHEMA).bibliotheek
  const lb = useTekst(TRAINING_LABELS)
  return (
    <div className="club-es-detail">
      <div>
        <h3 className="club-es-detail-naam">{o.naam}</h3>
        <p className="club-lidapp-label">{lb.spiergroep[o.spiergroep]} · {lb.materiaal[o.materiaal]} · {lb.niveau[o.niveau]}</p>
      </div>
      <OefeningVoorbeeld key={o.id} naam={o.naam} beeld={null} herhalingen="10" />
      <OefeningCoaching naam={o.naam} uitleg={o.uitleg} aandachtspunten={o.aandachtspunten} kop="h4" leeg={t.geenUitleg} />
      {o.spierenPrimair.length > 0 && (
        <section>
          <h4>{t.spieren}</h4>
          <SpierBlok naam={o.naam} primair={o.spierenPrimair} secundair={o.spierenSecundair} />
        </section>
      )}
      <div className="club-es-detail-actie">
        <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={onToevoegen} data-net={toegevoegd || undefined}>
          {toegevoegd ? <Check aria-hidden size={18} /> : <Plus aria-hidden size={18} />} {toegevoegd ? t.toegevoegd : t.toevoegen(dagLabel)}
        </button>
      </div>
    </div>
  )
}
