'use client'

import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { SCHEMA_WEERGAVE } from '@/lib/aiyourgym/taal/woorden/club/schema-weergave'
import { leesTempoCurve, type TempoDeel } from '@/lib/club/training/tempo-curve'
import './tempo-curve.css'

// Het tempo als curve: de stand van het gewicht door een herhaling heen.
// Omlaag zakt de lijn, onder blijft hij liggen, omhoog klimt hij, boven ligt
// hij stil. De breedte van elk stuk is de tijd. Klein (in een rij) alleen de
// curve met de vier tekens, groot met de namen van de fasen eronder.
// Zonder tempo in het schema tekent hij niets.

interface TempoCurveProps {
  tempo: string | null | undefined
  formaat?: 'klein' | 'groot'
  className?: string
}

const B = 120
const H = 28

export function TempoCurve({ tempo, formaat = 'klein', className }: TempoCurveProps) {
  const taal = useTaal()
  const t = useTekst(SCHEMA_WEERGAVE).tempo
  const curve = leesTempoCurve(tempo)
  if (!curve) return null
  const sec = (d: TempoDeel) => (d.teken === 'X' ? t.explosief : t.sec(formatGetal(d.sec, taal)))
  const [omlaag, onder, omhoog, boven] = curve.delen
  const label = t.label(sec(omlaag), sec(onder), sec(omhoog), sec(boven))
  const pad = curve.punten.map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x * B).toFixed(1)} ${(3 + p.y * (H - 6)).toFixed(1)}`).join(' ')
  const vlak = `${pad} L${B} ${H} L0 ${H} Z`
  return (
    <figure className={`club-tempo club-tempo--${formaat} ${className ?? ''}`} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" aria-hidden>
        <path className="club-tempo-vlak" d={vlak} />
        <path className="club-tempo-lijn" d={pad} vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption aria-hidden className="club-tempo-tekens">
        {curve.delen.map((d) => (
          <span key={d.fase} data-fase={d.fase} data-nul={d.sec === 0 || undefined}>
            <b>{d.teken}</b>
            {formaat === 'groot' && <small>{t.fase[d.fase]}</small>}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
