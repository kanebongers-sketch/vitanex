import type { Los } from '@/lib/club/lidmaatschappen/tellen'

// Namen uit de ledenlijst die nog geen vorm of label zijn, met het aantal leden.

const ZICHTBAAR = 8

export function LosseLijst({ items }: { items: readonly Los[] }) {
  const rest = items.length - ZICHTBAAR
  return (
    <ul className="club-lidm-los">
      {items.slice(0, ZICHTBAAR).map((l) => (
        <li key={l.naam}>
          <span>{l.naam}</span>
          <span className="club-lidm-los-n">{l.leden}</span>
        </li>
      ))}
      {rest > 0 && <li className="club-lidm-los-meer">en nog {rest}</li>}
    </ul>
  )
}
