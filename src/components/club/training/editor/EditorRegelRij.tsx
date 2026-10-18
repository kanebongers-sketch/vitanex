'use client'

import { useState, type DragEvent, type KeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Link2, Trash2, Unlink2 } from 'lucide-react'
import type { EditorRegel, Inspanning, Maat, TekstVeld } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { MATERIAAL_LABEL } from '@/lib/club/training/typen'
import { toonHerhalingen, toonRust } from '@/lib/club/training/weergave'
import { OefeningBeeld } from '../OefeningBeeld'
import { SpierChips } from '../SpierChips'

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
}

const MAAT_LABEL: Record<Maat, string> = { herhalingen: 'Herh.', tijd: 'Tijd' }
const INSPANNING: { waarde: Inspanning; label: string }[] = [
  { waarde: 'geen', label: 'Geen' },
  { waarde: 'rpe', label: 'RPE' },
  { waarde: 'rir', label: 'RIR' },
]

/** Een oefening in de editor: de vaste velden altijd, RPE/RIR, tempo en notitie onder "Meer". */
export function EditorRegelRij({ regel: r, label, oefening: o, isEerste, isLaatste, inBlok, isSleepDoel, acties: a }: EditorRegelRijProps) {
  const naam = o?.naam ?? 'Onbekende oefening'
  const heeftExtra = r.inspanning !== 'geen' || r.tempo !== '' || r.notitie !== ''
  const [meer, setMeer] = useState(heeftExtra)
  const wijzig = (veld: TekstVeld) => (e: { target: { value: string } }) => a.onWijzig(r.sleutel, veld, e.target.value)

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
      onKeyDown={toets}
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
        <button type="button" className="club-training-r-greep" draggable onDragStart={sleepStart} onDragEnd={a.onSleepEinde} aria-label={`${naam} slepen. Met het toetsenbord: Alt en pijltje omhoog of omlaag`} title="Slepen, of Alt + pijltje">
          <GripVertical aria-hidden size={16} />
        </button>
        <span className="club-training-r-nr" aria-hidden>{label}</span>
        <div className="club-training-r-naam">
          <OefeningBeeld naam={naam} beeld={o?.beeld ?? null} formaat="klein" decoratief />
          <div className="club-training-regeltekst">
            <strong>{naam}</strong>
            {o && (
              <span className="club-training-regelspieren">
                <SpierChips primair={o.spierenPrimair} spiergroep={o.spiergroep} max={2} />
                <span className="club-zacht">{MATERIAAL_LABEL[o.materiaal]}</span>
              </span>
            )}
          </div>
        </div>
        <div className="club-training-r-acties">
          {inBlok ? (
            <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onOntkoppel(r.sleutel)} aria-label={`${naam} uit de superset halen`} title="Uit superset halen">
              <Unlink2 aria-hidden size={15} />
            </button>
          ) : (
            <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onKoppel(r.sleutel)} disabled={isEerste} aria-label={`${naam} koppelen aan de oefening erboven (superset)`} title="Superset met de oefening erboven">
              <Link2 aria-hidden size={15} />
            </button>
          )}
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onVerplaats(r.sleutel, -1)} disabled={isEerste} aria-label={`${naam} omhoog`}>
            <ArrowUp aria-hidden size={15} />
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => a.onVerplaats(r.sleutel, 1)} disabled={isLaatste} aria-label={`${naam} omlaag`}>
            <ArrowDown aria-hidden size={15} />
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein club-training-weg" onClick={() => a.onVerwijder(r.sleutel)} aria-label={`${naam} verwijderen`}>
            <Trash2 aria-hidden size={15} />
          </button>
        </div>
      </div>

      <div className="club-training-r-velden">
        <label className="club-training-r-veld club-training-r-veld--kort">
          <span>Sets</span>
          <input className="club-invoer" inputMode="numeric" value={r.sets} onChange={wijzig('sets')} aria-label={`Sets ${naam}`} />
        </label>
        <div className="club-training-r-veld club-training-r-veld--maat">
          <span className="club-training-r-wissel" role="group" aria-label={`Herhalingen of tijd voor ${naam}`}>
            {(['herhalingen', 'tijd'] as const).map((m) => (
              <button key={m} type="button" aria-pressed={r.maat === m} onClick={() => a.onMaat(r.sleutel, m)}>{MAAT_LABEL[m]}</button>
            ))}
          </span>
          {r.maat === 'herhalingen' ? (
            <input
              className="club-invoer" value={r.herhalingen} onChange={wijzig('herhalingen')} placeholder="8 tot 10" aria-label={`Herhalingen ${naam}`}
              onBlur={(e) => a.onWijzig(r.sleutel, 'herhalingen', toonHerhalingen(e.target.value))}
            />
          ) : (
            <span className="club-training-r-eenheid">
              <input className="club-invoer" inputMode="numeric" value={r.tijdSec} onChange={wijzig('tijdSec')} placeholder="30" aria-label={`Seconden per set ${naam}`} />
              <small>sec</small>
            </span>
          )}
        </div>
        <label className="club-training-r-veld">
          <span>Kg</span>
          <input className="club-invoer" inputMode="decimal" value={r.gewichtKg} onChange={wijzig('gewichtKg')} aria-label={`Gewicht in kg ${naam}`} />
        </label>
        <label className="club-training-r-veld">
          <span>Rust</span>
          <span className="club-training-r-eenheid">
            <input className="club-invoer" inputMode="numeric" value={r.rustSec} onChange={wijzig('rustSec')} aria-label={`Rust in seconden ${naam}`} title={toonRust(Number(r.rustSec) || null)} />
            <small>sec</small>
          </span>
        </label>
        <button type="button" className="club-training-r-meer" aria-expanded={meer} onClick={() => setMeer((m) => !m)} data-gevuld={heeftExtra || undefined}>
          Meer <ChevronDown aria-hidden size={14} />
        </button>
      </div>

      {meer && (
        <div className="club-training-r-extra">
          <div className="club-training-r-veld club-training-r-veld--inspanning">
            <span className="club-training-r-wissel" role="group" aria-label={`Inspanning voor ${naam}`}>
              {INSPANNING.map((i) => (
                <button key={i.waarde} type="button" aria-pressed={r.inspanning === i.waarde} onClick={() => a.onInspanning(r.sleutel, i.waarde)}>{i.label}</button>
              ))}
            </span>
            <input
              className="club-invoer" inputMode="decimal" value={r.inspanningWaarde} onChange={wijzig('inspanningWaarde')} disabled={r.inspanning === 'geen'}
              placeholder={r.inspanning === 'rir' ? '2' : r.inspanning === 'rpe' ? '8' : ''} aria-label={`Waarde voor ${r.inspanning.toUpperCase()} ${naam}`}
              title="RPE: hoe zwaar (1 tot 10). RIR: hoeveel herhalingen je nog had gekund."
            />
          </div>
          <label className="club-training-r-veld club-training-r-veld--kort">
            <span>Tempo</span>
            <input className="club-invoer" value={r.tempo} maxLength={7} onChange={wijzig('tempo')} placeholder="3110" aria-label={`Tempo ${naam}, vier cijfers: omlaag, onder, omhoog, boven`} title="Vier cijfers: tellen omlaag, pauze onder, omhoog, pauze boven" />
          </label>
          <label className="club-training-r-veld club-training-r-veld--notitie">
            <span>Notitie</span>
            <input className="club-invoer" value={r.notitie} maxLength={300} onChange={wijzig('notitie')} aria-label={`Notitie ${naam}`} />
          </label>
        </div>
      )}
    </li>
  )
}
