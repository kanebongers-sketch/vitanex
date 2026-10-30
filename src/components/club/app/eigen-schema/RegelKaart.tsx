'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, GripVertical } from 'lucide-react'
import type { EditorRegel, Maat, TekstVeld } from '@/lib/club/training/editor'
import type { LidOefening } from '@/lib/club/training/lid-schemas/typen'
import { RenderDuim } from '@/components/club/training/repspeler/OefeningVoorbeeld'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import { RegelVelden } from './RegelVelden'

// Een oefening in het eigen schema: dicht een rustige regel (beeld, naam,
// "3 x 10 · 60 s rust"), open alle velden. Omhoog en omlaag met de pijltjes,
// of slepen aan het handvat. Grote tikvlakken (minstens 44 px) voor de duim.

export interface KaartActies {
  onWijzig: (sleutel: string, veld: TekstVeld, waarde: string) => void
  onMaat: (sleutel: string, maat: Maat) => void
  onVerplaats: (sleutel: string, richting: -1 | 1) => void
  onKoppel: (sleutel: string) => void
  onOntkoppel: (sleutel: string) => void
  onVerwijder: (sleutel: string) => void
  onInfo: (oefeningId: string) => void
  onSleep: (sleutel: string, e: ReactPointerEvent<HTMLElement>) => void
}

interface Props {
  regel: EditorRegel
  oefening: LidOefening | undefined
  /** "1", "2a", "2b" zoals op de vloer. */
  label: string
  isEerste: boolean
  isLaatste: boolean
  /** Deel van een superset of circuit. */
  inBlok: boolean
  open: boolean
  onOpen: (sleutel: string | null) => void
  sleept: boolean
  doel: 'voor' | 'na' | null
  acties: KaartActies
}

function samenvatting(r: EditorRegel, rust: (s: number) => string, t: { sets: (n: number) => string; rust: (s: string) => string }): string {
  const sets = Number.parseInt(r.sets, 10)
  const hoeveel = r.maat === 'tijd' ? (r.tijdSec ? `${r.tijdSec} s` : '') : r.herhalingen
  const kern = Number.isFinite(sets) && hoeveel ? `${sets} x ${hoeveel}` : Number.isFinite(sets) ? t.sets(sets) : hoeveel
  const kg = r.gewichtKg.trim() ? `${r.gewichtKg.trim()} kg` : ''
  const rustSec = Number.parseInt(r.rustSec, 10)
  return [kern, kg, Number.isFinite(rustSec) && rustSec > 0 ? t.rust(rust(rustSec)) : ''].filter(Boolean).join(' · ')
}

export function RegelKaart({ regel: r, oefening: o, label, isEerste, isLaatste, inBlok, open, onOpen, sleept, doel, acties: a }: Props) {
  const t = useTekst(EIGEN_SCHEMA).editor
  const naam = o?.naam ?? ''
  const regelTekst = samenvatting(r, t.rustSec, t.samenvatting)
  return (
    <li className="club-es-kaart" data-regel={r.sleutel} data-open={open || undefined} data-blok={inBlok || undefined} data-sleept={sleept || undefined} data-doel={doel ?? undefined}>
      <div className="club-es-kaart-kop">
        <span className="club-es-handvat" onPointerDown={(e) => a.onSleep(r.sleutel, e)} role="img" aria-label={t.slepen} title={t.slepen}>
          <GripVertical aria-hidden size={18} />
        </span>
        <button type="button" className="club-es-kaart-open" onClick={() => onOpen(open ? null : r.sleutel)} aria-expanded={open} aria-label={t.openen(naam)}>
          <span className="club-es-nummer" aria-hidden>{label}</span>
          <RenderDuim naam={naam} anders={<span className="club-es-duim-leeg" aria-hidden />} />
          <span className="club-es-kaart-tekst">
            <strong>{naam}</strong>
            <small>{regelTekst || t.geenSets}</small>
          </span>
          <ChevronDown aria-hidden size={18} className="club-es-kaart-pijl" />
        </button>
        <span className="club-es-pijlen">
          <button type="button" onClick={() => a.onVerplaats(r.sleutel, -1)} disabled={isEerste} aria-label={`${t.omhoog}: ${naam}`}>
            <ArrowUp aria-hidden size={16} />
          </button>
          <button type="button" onClick={() => a.onVerplaats(r.sleutel, 1)} disabled={isLaatste} aria-label={`${t.omlaag}: ${naam}`}>
            <ArrowDown aria-hidden size={16} />
          </button>
        </span>
      </div>
      {open && <RegelVelden regel={r} oefeningId={r.oefeningId} isEerste={isEerste} acties={a} />}
    </li>
  )
}
