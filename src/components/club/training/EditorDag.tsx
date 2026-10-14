'use client'

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import type { EditorRegel } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { dagLetter, MATERIAAL_LABEL } from '@/lib/club/training/typen'
import { toonHerhalingen, toonRust } from '@/lib/club/training/weergave'
import { OefeningBeeld } from './OefeningBeeld'
import { SpierChips } from './SpierChips'

type Veld = 'sets' | 'herhalingen' | 'gewichtKg' | 'rustSec' | 'notitie'

interface EditorDagProps {
  dag: number
  titel: string
  regels: EditorRegel[]
  oefeningen: Map<string, Oefening>
  magKopieren: boolean
  magVerwijderen: boolean
  onTitel: (titel: string) => void
  onWijzig: (sleutel: string, veld: Veld, waarde: string) => void
  onVerplaats: (sleutel: string, richting: -1 | 1) => void
  onVerwijder: (sleutel: string) => void
  onToevoegen: () => void
  onKopieer: () => void
  onVerwijderDag: () => void
}

/** Een trainingsdag: titel, oefeningen als compacte rijen, acties met toetsenbord. */
export function EditorDag(p: EditorDagProps) {
  const letter = dagLetter(p.dag)
  return (
    <section className="club-training-dag" aria-labelledby={`dag-${p.dag}`}>
      <header className="club-training-dagkop">
        <span className="club-training-dagletter" aria-hidden>{letter}</span>
        <label className="club-training-dagtitel">
          <span id={`dag-${p.dag}`} className="club-sr">Naam van dag {letter}</span>
          <input className="club-invoer" value={p.titel} maxLength={40} onChange={(e) => p.onTitel(e.target.value)} aria-labelledby={`dag-${p.dag}`} />
        </label>
        <div className="club-training-dagacties">
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onKopieer} disabled={!p.magKopieren}>
            <Copy aria-hidden size={15} /> Dag kopiëren
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onVerwijderDag} disabled={!p.magVerwijderen} aria-label={`Dag ${letter} verwijderen`}>
            <Trash2 aria-hidden size={15} />
          </button>
        </div>
      </header>

      {p.regels.length === 0 ? (
        <p className="club-leeg">Nog geen oefeningen op dag {letter}.</p>
      ) : (
        <ol className="club-training-regels">
          {p.regels.map((r, i) => {
            const o = p.oefeningen.get(r.oefeningId)
            const naam = o?.naam ?? 'Onbekende oefening'
            return (
              <li key={r.sleutel} className="club-training-regel">
                <span className="club-training-regelnr" aria-hidden>{i + 1}</span>
                <div className="club-training-regelnaam">
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
                <label className="club-training-mini">
                  <span>Sets</span>
                  <input className="club-invoer" inputMode="numeric" value={r.sets} onChange={(e) => p.onWijzig(r.sleutel, 'sets', e.target.value)} aria-label={`Sets ${naam}`} />
                </label>
                <label className="club-training-mini">
                  <span>Herhalingen</span>
                  <input
                    className="club-invoer"
                    value={r.herhalingen}
                    onChange={(e) => p.onWijzig(r.sleutel, 'herhalingen', e.target.value)}
                    onBlur={(e) => p.onWijzig(r.sleutel, 'herhalingen', toonHerhalingen(e.target.value))}
                    aria-label={`Herhalingen ${naam}`}
                    placeholder="8 tot 10"
                  />
                </label>
                <label className="club-training-mini">
                  <span>Kg</span>
                  <input className="club-invoer" inputMode="decimal" value={r.gewichtKg} onChange={(e) => p.onWijzig(r.sleutel, 'gewichtKg', e.target.value)} aria-label={`Gewicht in kg ${naam}`} />
                </label>
                <label className="club-training-mini">
                  <span>Rust sec</span>
                  <input className="club-invoer" inputMode="numeric" value={r.rustSec} onChange={(e) => p.onWijzig(r.sleutel, 'rustSec', e.target.value)} aria-label={`Rust in seconden ${naam}`} title={toonRust(Number(r.rustSec) || null)} />
                </label>
                <label className="club-training-mini">
                  <span>Notitie</span>
                  <input className="club-invoer" value={r.notitie} maxLength={300} onChange={(e) => p.onWijzig(r.sleutel, 'notitie', e.target.value)} aria-label={`Notitie ${naam}`} />
                </label>
                <div className="club-training-regelacties">
                  <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => p.onVerplaats(r.sleutel, -1)} disabled={i === 0} aria-label={`${naam} omhoog`}>
                    <ArrowUp aria-hidden size={15} />
                  </button>
                  <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => p.onVerplaats(r.sleutel, 1)} disabled={i === p.regels.length - 1} aria-label={`${naam} omlaag`}>
                    <ArrowDown aria-hidden size={15} />
                  </button>
                  <button type="button" className="club-knop club-knop--stil club-knop--klein club-training-weg" onClick={() => p.onVerwijder(r.sleutel)} aria-label={`${naam} verwijderen`}>
                    <Trash2 aria-hidden size={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <button type="button" className="club-knop club-training-toevoegen" onClick={p.onToevoegen}>
        <Plus aria-hidden size={16} /> Oefening toevoegen aan dag {letter}
      </button>
    </section>
  )
}
