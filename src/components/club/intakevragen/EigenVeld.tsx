'use client'

import type { EigenWaarde } from '@/lib/club/intakevragen/eigen'
import { MAX_KORT_ANTWOORD, MAX_LANG_ANTWOORD, type IntakeVraag } from '@/lib/club/intakevragen/soorten'
import { KeuzeChips, wissel } from '@/components/club/training/KeuzeChips'
import { JaNee } from './JaNee'

interface EigenVeldProps {
  vraag: IntakeVraag
  waarde: EigenWaarde | undefined
  onWaarde: (w: EigenWaarde) => void
}

const SCHAAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
const SCHAAL_LABEL = Object.fromEntries(SCHAAL.map((n) => [n, String(n)])) as Record<(typeof SCHAAL)[number], string>

/** Een eigen vraag van de sportschool, met het veld dat bij de soort hoort. */
export function EigenVeld({ vraag, waarde, onWaarde }: EigenVeldProps) {
  const tekst = typeof waarde === 'string' ? waarde : ''
  const labels = Object.fromEntries(vraag.opties.map((o) => [o, o])) as Record<string, string>
  switch (vraag.soort) {
    case 'kort':
      return (
        <label className="club-veld">
          <span>{vraag.vraag}</span>
          <input className="club-invoer" value={tekst} maxLength={MAX_KORT_ANTWOORD} onChange={(e) => onWaarde(e.target.value)} />
        </label>
      )
    case 'lang':
      return (
        <label className="club-veld">
          <span>{vraag.vraag}</span>
          <textarea className="club-invoer" value={tekst} maxLength={MAX_LANG_ANTWOORD} rows={3} onChange={(e) => onWaarde(e.target.value)} />
        </label>
      )
    case 'getal':
      return (
        <label className="club-veld club-intakevragen-getal">
          <span>{vraag.vraag}</span>
          <input
            className="club-invoer"
            inputMode="decimal"
            value={typeof waarde === 'number' ? String(waarde).replace('.', ',') : tekst}
            onChange={(e) => onWaarde(e.target.value)}
          />
        </label>
      )
    case 'keuze':
      return <KeuzeChips legend={vraag.vraag} opties={vraag.opties} labels={labels} gekozen={tekst ? [tekst] : []} onWissel={(o) => onWaarde(o === tekst ? '' : o)} enkel />
    case 'meerkeuze': {
      const gekozen = Array.isArray(waarde) ? waarde : []
      return <KeuzeChips legend={vraag.vraag} opties={vraag.opties} labels={labels} gekozen={gekozen} onWissel={(o) => onWaarde(wissel(gekozen, o))} />
    }
    case 'ja_nee':
      return <JaNee label={vraag.vraag} waarde={typeof waarde === 'boolean' ? waarde : null} onKies={onWaarde} jaLetOp={vraag.gezondheid} />
    case 'schaal_1_10': {
      const n = typeof waarde === 'number' ? waarde : null
      return (
        <div className="club-intakevragen-schaal">
          <KeuzeChips legend={vraag.vraag} opties={SCHAAL} labels={SCHAAL_LABEL} gekozen={n === null ? [] : SCHAAL.filter((x) => x === n)} onWissel={(x) => onWaarde(x)} enkel />
        </div>
      )
    }
  }
}
