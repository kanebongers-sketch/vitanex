import { blokken } from '@/lib/club/berichten/opmaak'

// De tekst van een bericht met de eenvoudige opmaak (alinea's en "- " opsomming).
// Alles blijft tekst in React-knopen: geen HTML uit de database.

interface Props {
  tekst: string
  className?: string
}

export function BerichtInhoud({ tekst, className }: Props) {
  const lijst = blokken(tekst)
  if (lijst.length === 0) return null
  return (
    <div className={className ?? 'club-bericht-inhoud'}>
      {lijst.map((b, i) =>
        b.soort === 'lijst' ? (
          <ul key={i}>
            {b.punten.map((p, j) => (
              <li key={j}>{p}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {b.regels.map((r, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {r}
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  )
}
