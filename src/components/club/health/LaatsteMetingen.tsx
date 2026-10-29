import { waardeTekst } from '@/lib/club/health/metingen'
import type { Meting } from '@/lib/club/health/typen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { HEALTH } from '@/lib/aiyourgym/taal/woorden/ledenapp/health'
import { datumKort } from './paden'

// De laatste meting per soort als tegels. Puur: dezelfde weergave in de
// ledenapp (voor het lid) en op de ledenkaart (alleen wat het lid toestaat).

interface LaatsteMetingenProps {
  metingen: readonly Meting[]
  leeg: string
  taal: Taal
}

export function LaatsteMetingen({ metingen, leeg, taal }: LaatsteMetingenProps) {
  const h = HEALTH[taal]
  if (metingen.length === 0) return <p className="club-hl-via">{leeg}</p>
  return (
    <ul className="club-hl-tegels" aria-label={h.scherm.laatste}>
      {metingen.map((m) => (
        <li key={`${m.soort}-${m.bron}-${m.externId}`} className="club-hl-tegel">
          <span>{h.soorten[m.soort].label}</span>
          <strong>{waardeTekst(m, taal)}</strong>
          <small>
            {datumKort(m.gemetenOp, taal)} · {h.bronnen[m.bron].naam}
          </small>
        </li>
      ))}
    </ul>
  )
}
