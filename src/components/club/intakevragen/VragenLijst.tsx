'use client'

import { ArrowDown, ArrowUp, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { kernDef } from '@/lib/club/intakevragen/kern'
import type { Richting, Sectie } from '@/lib/club/intakevragen/lijst'
import { isEigen, type IntakeVraag } from '@/lib/club/intakevragen/soorten'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { INTAKE, sectieInTaal, vraagInTaal } from '@/lib/aiyourgym/taal/woorden/club/intake'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'

interface VragenLijstProps {
  secties: readonly Sectie[]
  bezig: boolean
  bewerkt: string | null
  onVerplaatsVraag: (v: IntakeVraag, r: Richting) => void
  onVerplaatsSectie: (naam: string, r: Richting) => void
  onAanUit: (v: IntakeVraag) => void
  onBewerk: (v: IntakeVraag) => void
  onVerwijder: (v: IntakeVraag) => void
}

function Pijlen({ label, eerste, laatste, bezig, onKlik }: { label: string; eerste: boolean; laatste: boolean; bezig: boolean; onKlik: (r: Richting) => void }) {
  const t = useTekst(INTAKE).vragenLijst
  return (
    <span className="club-intakevragen-pijlen">
      <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={t.omhoog(label)} disabled={bezig || eerste} onClick={() => onKlik('omhoog')}>
        <ArrowUp size={15} aria-hidden />
      </button>
      <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={t.omlaag(label)} disabled={bezig || laatste} onClick={() => onKlik('omlaag')}>
        <ArrowDown size={15} aria-hidden />
      </button>
    </span>
  )
}

function Regel({ v, i, aantal, p }: { v: IntakeVraag; i: number; aantal: number; p: VragenLijstProps }) {
  const kern = kernDef(v.sleutel)
  const taal = useTaal()
  const t = useTekst(INTAKE).vragenLijst
  const l = useTekst(TRAINING_LABELS)
  const tekst = vraagInTaal(v, taal).vraag
  return (
    <li className="club-intakevragen-regel" data-uit={!v.actief || undefined} data-bewerkt={p.bewerkt === v.id || undefined}>
      <Pijlen label={tekst} eerste={i === 0} laatste={i === aantal - 1} bezig={p.bezig} onKlik={(r) => p.onVerplaatsVraag(v, r)} />
      <div className="club-intakevragen-tekst">
        <span className="club-intakevragen-vraagtekst">{tekst}</span>
        <span className="club-intakevragen-labels">
          <span>{l.vraagSoort[v.soort]}</span>
          {v.verplicht && <span>{t.verplicht}</span>}
          {v.gezondheid && <span className="club-intakevragen-label--gezond"><ShieldCheck size={12} aria-hidden /> {t.toestemming}</span>}
          <span>{kern ? (kern.vast ? t.vastVoorstel : t.vast) : t.eigen}</span>
        </span>
      </div>
      <span className="club-intakevragen-knoppen">
        <button
          type="button"
          className="club-intakevragen-schakel"
          aria-pressed={v.actief}
          aria-label={t.aanUit(tekst, v.actief)}
          disabled={p.bezig || kern?.vast}
          onClick={() => p.onAanUit(v)}
        >
          <span aria-hidden>{v.actief ? t.aan : t.uit}</span>
        </button>
        <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={t.aanpassen(tekst)} disabled={p.bezig} onClick={() => p.onBewerk(v)}>
          <Pencil size={15} aria-hidden />
        </button>
        {isEigen(v) && (
          <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={t.verwijderen(tekst)} disabled={p.bezig} onClick={() => p.onVerwijder(v)}>
            <Trash2 size={15} aria-hidden />
          </button>
        )}
      </span>
    </li>
  )
}

/** Alle vragen per sectie, met volgorde, aan en uit, aanpassen en verwijderen. */
export function VragenLijst(p: VragenLijstProps) {
  const taal = useTaal()
  const t = useTekst(INTAKE).vragenLijst
  return (
    <div className="club-intakevragen-secties">
      {p.secties.map((s, si) => (
        <section key={s.naam} className="club-intakevragen-sectie" aria-labelledby={`sectie-${si}`}>
          <header>
            <span className="club-intakevragen-sectienr" aria-hidden>{String(si + 1).padStart(2, '0')}</span>
            <h2 id={`sectie-${si}`}>{sectieInTaal(s.naam, taal)}</h2>
            <span className="club-zacht">{t.aantalAan(s.vragen.filter((v) => v.actief).length, s.vragen.length)}</span>
            <Pijlen label={t.sectie(sectieInTaal(s.naam, taal))} eerste={si === 0} laatste={si === p.secties.length - 1} bezig={p.bezig} onKlik={(r) => p.onVerplaatsSectie(s.naam, r)} />
          </header>
          <ol>
            {s.vragen.map((v, i) => <Regel key={v.id} v={v} i={i} aantal={s.vragen.length} p={p} />)}
          </ol>
        </section>
      ))}
    </div>
  )
}
