'use client'

import { X } from 'lucide-react'
import { schaalNaarPortie } from '@/lib/club/voeding/dagboek/berekeningen'
import type { AiItem } from '@/lib/club/voeding/dagboek/ai/lezen'
import type { Per100 } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'

// Het voorstel van de AI. Het lid ziet het altijd eerst, past per item de naam
// en de gram aan (macro's schalen mee) of haalt iets weg, en bevestigt pas dan.
// Er wordt nooit automatisch gelogd.

export interface AiRegel {
  naam: string
  gram: number
  per100: Per100
  betrouwbaarheid: AiItem['betrouwbaarheid']
}

/** Klaar om te bevestigen: minstens een item, elk met een naam en een portie. */
export function voorstelGeldig(regels: readonly AiRegel[]): boolean {
  return regels.length > 0 && regels.every((r) => r.gram > 0 && r.naam.trim().length > 0)
}

interface Props {
  regels: AiRegel[]
  t: VoedingDagboekTekst
  bezig: boolean
  onWijzig: (regels: AiRegel[]) => void
  onOpnieuw: () => void
  onBevestig: () => void
}

export function AiVoorstel({ regels, t, bezig, onWijzig, onOpnieuw, onBevestig }: Props) {
  const ta = t.ai
  const zet = (i: number, deel: Partial<AiRegel>) => onWijzig(regels.map((x, j) => (j === i ? { ...x, ...deel } : x)))
  return (
    <section className="club-vd-paneel" aria-labelledby="vd-ai-voorstel">
      <h4 id="vd-ai-voorstel" className="club-lidapp-label">{ta.voorstelTitel}</h4>
      <p className="club-vd-hint">{ta.voorstel}</p>
      <ul className="club-vd-lijst">
        {regels.map((r, i) => {
          const m = schaalNaarPortie(r.per100, r.gram)
          return (
            <li key={i} className="club-vd-ai-regel">
              <span className="club-vd-product-tekst">
                <input className="club-vd-ai-naam" value={r.naam} maxLength={120} aria-label={ta.naamVoor(i + 1)} onChange={(e) => zet(i, { naam: e.target.value })} />
                <span>{m.kcal} {t.macro.kcal} · {t.macro.kortEiwit} {m.eiwitG} · {t.macro.kortKh} {m.koolhydratenG} · {t.macro.kortVet} {m.vetG} · {ta.betrouwbaarheid[r.betrouwbaarheid]}</span>
              </span>
              <input inputMode="numeric" className="club-vd-gram" value={String(r.gram)} aria-label={ta.gramVoor(r.naam)} onChange={(e) => zet(i, { gram: Math.max(0, Math.min(5000, Math.round(Number(e.target.value) || 0))) })} />
              <button type="button" className="club-vd-x" onClick={() => onWijzig(regels.filter((_, j) => j !== i))} aria-label={ta.weghalen(r.naam)}>
                <X size={16} aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="club-vd-knoppen">
        <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={onOpnieuw}>{ta.opnieuw}</button>
        <button type="button" className="club-vd-hoofdknop" disabled={bezig || !voorstelGeldig(regels)} onClick={onBevestig}>
          {bezig ? t.portieStap.bezig : ta.bevestig(regels.length)}
        </button>
      </div>
    </section>
  )
}
