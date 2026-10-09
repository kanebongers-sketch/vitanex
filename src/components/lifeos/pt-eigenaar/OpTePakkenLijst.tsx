import Link from 'next/link'
import { STATUS_LABEL } from '@/lib/lifeos/leads/leads'
import { eerstOpTePakken, opTePakkenLabel, opTePakkenTotaal, type OpTePakken } from '@/lib/lifeos/pt-coaching/coach-overzicht'

// Het stukje lead tracker in het coach-overzicht: welke leads van deze PT'er
// eerst opgepakt moeten worden (te laat, vandaag, zonder plan). Puur.

const MAX = 5

export function OpTePakkenLijst({ code, ptId, opTePakken }: { code: string; ptId: string; opTePakken: OpTePakken }) {
  const totaal = opTePakkenTotaal(opTePakken)
  if (totaal === 0) return <p className="ptd-hint">Lead tracker: niets te laat, elke open lead heeft een plan.</p>
  const items = eerstOpTePakken(opTePakken, MAX)
  return (
    <div>
      <p className="ptd-label">Lead tracker · eerst op te pakken · {totaal}</p>
      <ul className="ptd-punten">
        {items.map((i) => (
          <li key={i.lead.id} className="ptd-tekst">
            <span className="ptd-tekst--sterk">{i.lead.naam}</span> — {STATUS_LABEL[i.lead.status]}, {opTePakkenLabel(i)}
          </li>
        ))}
      </ul>
      {totaal > items.length ? (
        <Link className="ptd-link ptd-kleine-link" href={`/${code}/lead?pt=${ptId}&toon=te_laat`}>Alle {totaal} bekijken</Link>
      ) : null}
    </div>
  )
}
