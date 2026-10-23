import { PROVIDERS } from '@/lib/club/health/providers'
import { waardeTekst } from '@/lib/club/health/metingen'
import { SOORT_INFO, type Meting } from '@/lib/club/health/typen'
import { datumKort } from './paden'

// De laatste meting per soort als tegels. Puur: dezelfde weergave in de
// ledenapp (voor het lid) en op de ledenkaart (alleen wat het lid toestaat).

interface LaatsteMetingenProps {
  metingen: readonly Meting[]
  leeg: string
}

export function LaatsteMetingen({ metingen, leeg }: LaatsteMetingenProps) {
  if (metingen.length === 0) return <p className="club-hl-via">{leeg}</p>
  return (
    <ul className="club-hl-tegels" aria-label="Laatste metingen">
      {metingen.map((m) => (
        <li key={`${m.soort}-${m.bron}-${m.externId}`} className="club-hl-tegel">
          <span>{SOORT_INFO[m.soort].label}</span>
          <strong>{waardeTekst(m)}</strong>
          <small>
            {datumKort(m.gemetenOp)} · {PROVIDERS[m.bron].naam}
          </small>
        </li>
      ))}
    </ul>
  )
}
