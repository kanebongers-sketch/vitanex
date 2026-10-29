'use client'

import { Copy, Plus, Trash2 } from 'lucide-react'
import { blokken, regelLabels } from '@/lib/club/training/blokken'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import type { EditorRegel } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { dagLetter } from '@/lib/club/training/typen'
import { toonRust } from '@/lib/club/training/weergave'
import { EditorRegelRij, type RegelActies } from './editor/EditorRegelRij'

interface EditorDagProps {
  dag: number
  titel: string
  regels: EditorRegel[]
  oefeningen: Map<string, Oefening>
  magKopieren: boolean
  magVerwijderen: boolean
  /** Waar een gesleepte oefening landt: een sleutel, of eind:<dag> voor achteraan een dag. */
  sleepDoel: string | null
  acties: RegelActies
  onSleepEind: () => void
  onLaatVallenEind: () => void
  onTitel: (titel: string) => void
  onToevoegen: () => void
  onKopieer: () => void
  onVerwijderDag: () => void
}

function blokUitleg(items: readonly EditorRegel[], labels: Map<string, string>, t: (typeof SCHEMA_EDITOR)['nl']['dagKop'], taal: 'nl' | 'en'): string {
  const rust = Math.max(0, ...items.map((r) => Number(r.rustSec.replace(',', '.')) || 0))
  const laatste = labels.get(items[items.length - 1].sleutel)
  return rust > 0 ? t.omEnOmRust(toonRust(rust, taal), laatste ?? '') : t.omEnOmZonder
}

/** Een trainingsdag: titel, blokken (los, superset, circuit) en acties. Slepen, Alt + pijltjes of de knoppen. */
export function EditorDag(p: EditorDagProps) {
  const letter = dagLetter(p.dag)
  const taal = useTaal()
  const t = useTekst(SCHEMA_EDITOR).dagKop
  const l = useTekst(TRAINING_LABELS)
  const labels = regelLabels(p.regels)
  const bl = blokken(p.regels)
  const rij = (r: EditorRegel, inBlok: boolean) => (
    <EditorRegelRij
      key={r.sleutel}
      regel={r}
      label={labels.get(r.sleutel) ?? ''}
      oefening={p.oefeningen.get(r.oefeningId)}
      isEerste={r === p.regels[0]}
      isLaatste={r === p.regels[p.regels.length - 1]}
      inBlok={inBlok}
      isSleepDoel={p.sleepDoel === r.sleutel}
      acties={p.acties}
    />
  )

  return (
    <section className="club-training-dag" aria-labelledby={`dag-${p.dag}`}>
      <header className="club-training-dagkop">
        <span className="club-training-dagletter" aria-hidden>{letter}</span>
        <label className="club-training-dagtitel">
          <span id={`dag-${p.dag}`} className="club-sr">{t.naamVan(letter)}</span>
          <input className="club-invoer" value={p.titel} maxLength={40} onChange={(e) => p.onTitel(e.target.value)} aria-labelledby={`dag-${p.dag}`} />
        </label>
        <div className="club-training-dagacties">
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onKopieer} disabled={!p.magKopieren} title={t.dupliceerTitel} aria-label={t.dupliceerLabel(letter)}>
            <Copy aria-hidden size={15} /> <span className="club-training-dagactie-tekst">{t.dupliceren}</span>
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onVerwijderDag} disabled={!p.magVerwijderen} aria-label={t.verwijderLabel(letter)}>
            <Trash2 aria-hidden size={15} />
          </button>
        </div>
      </header>

      {p.regels.length === 0 ? (
        <p
          className="club-leeg club-training-sleepvlak"
          data-sleepdoel={p.sleepDoel === `eind:${p.dag}` || undefined}
          onDragOver={(e) => {
            e.preventDefault()
            p.onSleepEind()
          }}
          onDrop={(e) => {
            e.preventDefault()
            p.onLaatVallenEind()
          }}
        >
          {t.leeg(letter)}
        </p>
      ) : (
        <ol className="club-training-blokken">
          {bl.map((b) =>
            b.items.length === 1 ? (
              rij(b.items[0], false)
            ) : (
              <li key={`blok-${b.items[0].sleutel}`} className="club-training-blok" data-soort={b.soort}>
                <p className="club-training-blokkop">
                  <strong>{l.blok[b.soort]}</strong>
                  <span>{t.blokAantal(b.items.length)}, {blokUitleg(b.items, labels, t, taal)}</span>
                </p>
                <ol className="club-training-blokken">{b.items.map((r) => rij(r, true))}</ol>
              </li>
            ),
          )}
          <li
            className="club-training-sleepeind"
            aria-hidden
            data-sleepdoel={p.sleepDoel === `eind:${p.dag}` || undefined}
            onDragOver={(e) => {
              e.preventDefault()
              p.onSleepEind()
            }}
            onDrop={(e) => {
              e.preventDefault()
              p.onLaatVallenEind()
            }}
          />
        </ol>
      )}

      <button type="button" className="club-knop club-training-toevoegen" onClick={p.onToevoegen} title="Alt + N">
        <Plus aria-hidden size={16} /> {t.toevoegen(letter)}
      </button>
    </section>
  )
}
