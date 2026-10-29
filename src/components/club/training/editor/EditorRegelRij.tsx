'use client'

import { useState, type DragEvent, type KeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Link2, Trash2, Unlink2 } from 'lucide-react'
import type { EditorRegel, Inspanning, Maat, TekstVeld } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { toonHerhalingen, toonRust } from '@/lib/club/training/weergave'
import { OefeningBeeld } from '../OefeningBeeld'
import { RenderDuim } from '../repspeler/OefeningVoorbeeld'
import { SpierChips } from '../SpierChips'
import { TempoCurve } from '../TempoCurve'
import { SCHEMA_WEERGAVE } from '@/lib/aiyourgym/taal/woorden/club/schema-weergave'
import { VervangOefening } from './VervangOefening'

export interface RegelActies {
  onWijzig: (sleutel: string, veld: TekstVeld, waarde: string) => void
  onMaat: (sleutel: string, maat: Maat) => void
  onInspanning: (sleutel: string, inspanning: Inspanning) => void
  onVerplaats: (sleutel: string, richting: -1 | 1) => void
  onKoppel: (sleutel: string) => void
  onOntkoppel: (sleutel: string) => void
  onVerwijder: (sleutel: string) => void
  onSleepStart: (sleutel: string) => void
  onSleepEinde: () => void
  onSleepOver: (sleutel: string) => void
  onLaatVallen: (voorSleutel: string) => void
  onVervang: (sleutel: string, oefeningId: string) => void
  /** Toon deze oefening in het zijpaneel (beeld, kernpunten, verloop). */
  onKies?: (sleutel: string) => void
}

interface EditorRegelRijProps {
  regel: EditorRegel
  label: string
  oefening: Oefening | undefined
  isEerste: boolean
  isLaatste: boolean
  inBlok: boolean
  isSleepDoel: boolean
  acties: RegelActies
  /** Deze oefening staat in het zijpaneel. */
  isGekozen?: boolean
}

const INSPANNING: { waarde: Inspanning; label: string | null }[] = [
  { waarde: 'geen', label: null },
  { waarde: 'rpe', label: 'RPE' },
  { waarde: 'rir', label: 'RIR' },
]

/** Een oefening in de editor: de vaste velden altijd, RPE/RIR, tempo en notitie onder "Meer". */
export function EditorRegelRij({ regel: r, label, oefening: o, isEerste, isLaatste, inBlok, isSleepDoel, acties: a, isGekozen = false }: EditorRegelRijProps) {
  const taal = useTaal()
  const t = useTekst(SCHEMA_EDITOR).regel
  const l = useTekst(TRAINING_LABELS)
  const w = useTekst(SCHEMA_WEERGAVE).regel
  const naam = o?.naam ?? t.onbekend
  const heeftExtra = r.inspanning !== 'geen' || r.tempo !== '' || r.notitie !== ''
  const [meer, setMeer] = useState(heeftExtra)
  const wijzig = (veld: TekstVeld) => (e: { target: { value: string } }) => a.onWijzig(r.sleutel, veld, e.target.value)

  /** Poster aangetikt: in het zijpaneel zetten; op telefoon en tablet staat dat paneel onder het schema, dan erheen. */
  function toonGroot(sleutel: string) {
    a.onKies?.(sleutel)
    if (!window.matchMedia('(max-width: 999px)').matches) return
    const glad = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.requestAnimationFrame(() => document.getElementById('gekozen-kop')?.scrollIntoView({ behavior: glad ? 'smooth' : 'auto', block: 'start' }))
  }

  function toets(e: KeyboardEvent<HTMLLIElement>) {
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    a.onVerplaats(r.sleutel, e.key === 'ArrowUp' ? -1 : 1)
  }

  function sleepStart(e: DragEvent<HTMLButtonElement>) {
    const rij = e.currentTarget.closest('li')
    if (rij) e.dataTransfer.setDragImage(rij, 24, 24)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', r.sleutel)
    a.onSleepStart(r.sleutel)
  }

  return (
    <li
      className="club-training-r"
      data-sleepdoel={isSleepDoel || undefined}
      data-gekozen={isGekozen || undefined}
      onKeyDown={toets}
      onFocus={() => {
        if (!isGekozen) a.onKies?.(r.sleutel)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        a.onSleepOver(r.sleutel)
      }}
      onDrop={(e) => {
        e.preventDefault()
        a.onLaatVallen(r.sleutel)
      }}
    >
      <div className="club-training-r-kop">
        <button type="button" className="club-training-r-greep" draggable onDragStart={sleepStart} onDragEnd={a.onSleepEinde} aria-label={t.slepen(naam)} title={t.slepenTitel}>
          <GripVertical aria-hidden size={16} />
        </button>
        <span className="club-training-r-nr" aria-hidden>{label}</span>
        <div className="club-training-r-naam">
          <button type="button" className="club-training-r-poster" onClick={() => toonGroot(r.sleutel)} aria-label={w.kies(naam)} aria-pressed={a.onKies ? isGekozen : undefined}>
            <RenderDuim naam={naam} anders={<OefeningBeeld naam={naam} beeld={o?.beeld ?? null} formaat="klein" decoratief />} />
          </button>
          <div className="club-training-regeltekst">
            <strong>{naam}</strong>
            {o && (
              <span className="club-training-regelspieren">
                <SpierChips primair={o.spierenPrimair} spiergroep={o.spiergroep} max={2} />
                <span className="club-zacht">{l.materiaal[o.materiaal]}</span>
              </span>
            )}
            {(r.tempo !== '' || (r.inspanning !== 'geen' && r.inspanningWaarde !== '')) && (
              <span className="club-training-r-meta">
                {r.inspanning !== 'geen' && r.inspanningWaarde !== '' && (
                  <span className="club-training-r-inspanning">
                    {r.inspanning.toUpperCase()} <b>{r.inspanningWaarde}</b>
                  </span>
                )}
                <TempoCurve tempo={r.tempo} />
              </span>
            )}
          </div>
        </div>
        <div className="club-training-r-acties">
          <VervangOefening regel={r} oefening={o} onVervang={(id) => a.onVervang(r.sleutel, id)} />
          {inBlok ? (
            <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onOntkoppel(r.sleutel)} aria-label={t.uitSuperset(naam)} title={t.uitSupersetTitel}>
              <Unlink2 aria-hidden size={15} />
            </button>
          ) : (
            <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onKoppel(r.sleutel)} disabled={isEerste} aria-label={t.koppel(naam)} title={t.koppelTitel}>
              <Link2 aria-hidden size={15} />
            </button>
          )}
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onVerplaats(r.sleutel, -1)} disabled={isEerste} aria-label={t.omhoog(naam)}>
            <ArrowUp aria-hidden size={15} />
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onVerplaats(r.sleutel, 1)} disabled={isLaatste} aria-label={t.omlaag(naam)}>
            <ArrowDown aria-hidden size={15} />
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein club-training-weg" onClick={() => a.onVerwijder(r.sleutel)} aria-label={t.verwijder(naam)}>
            <Trash2 aria-hidden size={15} />
          </button>
        </div>
      </div>

      <div className="club-training-r-velden">
        <label className="club-training-r-veld club-training-r-veld--kort">
          <span>{t.sets}</span>
          <input className="club-invoer" inputMode="numeric" value={r.sets} onChange={wijzig('sets')} aria-label={t.setsVan(naam)} />
        </label>
        <div className="club-training-r-veld club-training-r-veld--maat">
          <span className="club-training-r-wissel" role="group" aria-label={t.herhOfTijd(naam)}>
            {(['herhalingen', 'tijd'] as const).map((m) => (
              <button key={m} type="button" aria-pressed={r.maat === m} onClick={() => a.onMaat(r.sleutel, m)}>{t.maat[m]}</button>
            ))}
          </span>
          {r.maat === 'herhalingen' ? (
            <input
              className="club-invoer" value={toonHerhalingen(r.herhalingen, taal)} onChange={wijzig('herhalingen')} placeholder={t.herhPlaats} aria-label={t.herhVan(naam)}
              onBlur={(e) => a.onWijzig(r.sleutel, 'herhalingen', toonHerhalingen(e.target.value))}
            />
          ) : (
            <span className="club-training-r-eenheid">
              <input className="club-invoer" inputMode="numeric" value={r.tijdSec} onChange={wijzig('tijdSec')} placeholder="30" aria-label={t.secondenVan(naam)} />
              <small>{t.sec}</small>
            </span>
          )}
        </div>
        <label className="club-training-r-veld">
          <span>{t.kg}</span>
          <input className="club-invoer" inputMode="decimal" value={r.gewichtKg} onChange={wijzig('gewichtKg')} aria-label={t.gewichtVan(naam)} />
        </label>
        <label className="club-training-r-veld">
          <span>{t.rust}</span>
          <span className="club-training-r-eenheid">
            <input className="club-invoer" inputMode="numeric" value={r.rustSec} onChange={wijzig('rustSec')} aria-label={t.rustVan(naam)} title={toonRust(Number(r.rustSec) || null, taal)} />
            <small>{t.sec}</small>
          </span>
        </label>
        <button type="button" className="club-training-r-meer" aria-expanded={meer} onClick={() => setMeer((m) => !m)} data-gevuld={heeftExtra || undefined}>
          {t.meer} <ChevronDown aria-hidden size={14} />
        </button>
      </div>

      {meer && (
        <div className="club-training-r-extra">
          <div className="club-training-r-veld club-training-r-veld--inspanning">
            <span className="club-training-r-wissel" role="group" aria-label={t.inspanningVan(naam)}>
              {INSPANNING.map((i) => (
                <button key={i.waarde} type="button" aria-pressed={r.inspanning === i.waarde} onClick={() => a.onInspanning(r.sleutel, i.waarde)}>{i.label ?? t.geen}</button>
              ))}
            </span>
            <input
              className="club-invoer" inputMode="decimal" value={r.inspanningWaarde} onChange={wijzig('inspanningWaarde')} disabled={r.inspanning === 'geen'}
              placeholder={r.inspanning === 'rir' ? '2' : r.inspanning === 'rpe' ? '8' : ''} aria-label={t.waardeVan(r.inspanning.toUpperCase(), naam)}
              title={t.inspanningUitleg}
            />
          </div>
          <label className="club-training-r-veld club-training-r-veld--kort">
            <span>{t.tempo}</span>
            <input className="club-invoer" value={r.tempo} maxLength={7} onChange={wijzig('tempo')} placeholder="3110" aria-label={t.tempoVan(naam)} title={t.tempoUitleg} />
          </label>
          <label className="club-training-r-veld club-training-r-veld--notitie">
            <span>{t.notitie}</span>
            <input className="club-invoer" value={r.notitie} maxLength={300} onChange={wijzig('notitie')} aria-label={t.notitieVan(naam)} />
          </label>
        </div>
      )}
    </li>
  )
}
