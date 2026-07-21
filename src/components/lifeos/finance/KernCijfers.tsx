import { TriangleAlert } from 'lucide-react'
import { formatEuro, maandVolledig, type FinanceOverzicht } from './finance'

// De vier stat-tegels van deze maand: Omzet, Kosten, Winst, Openstaand. Rang via
// schaal (groot cijfer, klein label), niet via kleur. Cyaan raakt alleen de winst
// — het cijfer dat aandacht vraagt — en wordt daar semantisch: bij verlies wint
// het danger-token, want cyaan-op-verlies zou "goed" liegen.

interface KernCijfersProps {
  overzicht: FinanceOverzicht
}

interface SubSignaal {
  tekst: string
  waarschuwing: boolean
}

export function KernCijfers({ overzicht }: KernCijfersProps) {
  const { maand, omzet, kosten, winst, openstaand, verlopenAantal, aantalTransacties } = overzicht
  const winstKlasse = `fin__tegel ${winst < 0 ? 'fin__tegel--verlies' : 'fin__tegel--accent'}`
  const openstaandSub: SubSignaal | null =
    verlopenAantal > 0 ? { tekst: `${verlopenAantal} verlopen`, waarschuwing: true } : null

  return (
    <div>
      <p className="fin__periode">
        {maandVolledig(maand)} · {aantalTransacties}{' '}
        {aantalTransacties === 1 ? 'transactie' : 'transacties'}
      </p>
      <div className="fin__cijfers">
        <Tegel label="Omzet" waarde={omzet} />
        <Tegel label="Kosten" waarde={kosten} />
        <Tegel label="Winst" waarde={winst} klasse={winstKlasse} />
        <Tegel label="Openstaand" waarde={openstaand} sub={openstaandSub} />
      </div>
    </div>
  )
}

interface TegelProps {
  label: string
  waarde: number
  klasse?: string
  sub?: SubSignaal | null
}

function Tegel({ label, waarde, klasse = 'fin__tegel', sub = null }: TegelProps) {
  return (
    <div className={klasse}>
      <p className="fin__tegel-label">{label}</p>
      <p className="fin__tegel-waarde">{formatEuro(waarde)}</p>
      {sub ? (
        <p className={`fin__tegel-sub${sub.waarschuwing ? ' fin__tegel-sub--waarschuwing' : ''}`}>
          {sub.waarschuwing ? <TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" /> : null}
          {sub.tekst}
        </p>
      ) : (
        // Lege sub-regel houdt de cijfers per rij op één lijn (geen aria-ruis).
        <p className="fin__tegel-sub" aria-hidden="true" />
      )}
    </div>
  )
}
