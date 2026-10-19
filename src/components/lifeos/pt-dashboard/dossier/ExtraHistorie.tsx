import { metEenheid } from '@/lib/lifeos/pt-dashboard/meting-extra'
import { verschilTekst, type ExtraRegel } from '@/lib/lifeos/pt-dashboard/metingen'

// De extra meetopties van een meting in de historie: de waarde, het verschil
// met de vorige keer en met de start. Alleen verschil, geen oordeel. De
// eenheid staat een keer bij de waarde; de verschillen zijn kale getallen,
// zodat een regel ook op de telefoon op een lijn past.

function Verschil({ waarde, naam }: { waarde: number | null; naam: string }) {
  if (waarde === null) return null
  return (
    <span className="ffdos-extra-delta">
      <small>{naam}</small> {verschilTekst({ verschil: waarde, eenheid: '' })}
    </span>
  )
}

export function ExtraHistorie({ regels }: { regels: readonly ExtraRegel[] }) {
  if (regels.length === 0) return null
  return (
    <dl className="ffdos-extra-hist">
      {regels.map((r) => (
        <div key={r.sleutel} className="ffdos-extra-regel">
          <dt>{r.label}</dt>
          <dd>
            <strong>{metEenheid(r.waarde, r.eenheid)}</strong>
            <Verschil waarde={r.sindsVorige} naam="vorige" />
            <Verschil waarde={r.sindsStart} naam="start" />
          </dd>
        </div>
      ))}
    </dl>
  )
}
