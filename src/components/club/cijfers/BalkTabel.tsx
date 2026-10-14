// Een echte tabel met een balk in de waardecel: leesbaar voor schermlezers,
// sorteerbaar in je hoofd, en de balk geeft in een oogopslag de verhouding.
// De balk is een SVG die alleen horizontaal schaalt.

export interface BalkRij {
  label: string
  /** 0..1, de lengte van de balk. */
  deel: number
  /** Wat er naast de balk staat (bv. "73%"). */
  waarde: string
  /** Extra kolommen rechts (bv. aantal lessen). */
  extra?: string[]
  nadruk?: boolean
}

interface Props {
  bijschrift: string
  kolomLabel: string
  waardeLabel: string
  extraLabels?: string[]
  rijen: BalkRij[]
  leeg: string
}

export function BalkTabel({ bijschrift, kolomLabel, waardeLabel, extraLabels = [], rijen, leeg }: Props) {
  if (rijen.length === 0) return <p className="club-leeg">{leeg}</p>
  return (
    <table className="club-cijfers-balktabel">
      <caption className="club-sr">{bijschrift}</caption>
      <thead>
        <tr>
          <th scope="col">{kolomLabel}</th>
          <th scope="col">{waardeLabel}</th>
          {extraLabels.map((l) => (
            <th key={l} scope="col" className="club-cijfers-rechts">
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rijen.map((r) => (
          <tr key={r.label} data-nadruk={r.nadruk || undefined}>
            <th scope="row">{r.label}</th>
            <td>
              <span className="club-cijfers-balkcel">
                <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden className="club-cijfers-balk">
                  <rect x={0} y={0} width={100} height={8} rx={4} className="club-cijfers-balk-spoor" />
                  <rect x={0} y={0} width={Math.max(0, Math.min(1, r.deel)) * 100} height={8} rx={4} className="club-cijfers-balk-vul" />
                </svg>
                <span className="club-getal">{r.waarde}</span>
              </span>
            </td>
            {(r.extra ?? []).map((e, i) => (
              <td key={`${extraLabels[i] ?? i}`} className="club-cijfers-rechts club-getal">
                {e}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
