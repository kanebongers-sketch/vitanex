import { Fragment } from 'react'
import { parseerOpmaak } from '@/lib/club/bedrijf/opmaak'

// Een tekst voor leden (huisregels, voorwaarden, privacy) met de eenvoudige
// opmaak: tussenkoppen, alinea's en opsommingen. Alles wordt als tekst
// gerenderd, nooit als HTML, dus een eigenaar kan niets in de pagina breken.
// Werkt op de server en in de browser (geen hooks).

interface JuridischeTekstProps {
  tekst: string
  /** Het niveau van de tussenkoppen; volgt de kop erboven op de pagina. */
  kopNiveau?: 2 | 3 | 4
  className?: string
}

export function JuridischeTekst({ tekst, kopNiveau = 3, className }: JuridischeTekstProps) {
  const blokken = parseerOpmaak(tekst)
  const Kop = `h${kopNiveau}` as const
  return (
    <div className={['club-juridisch', className].filter(Boolean).join(' ')}>
      {blokken.map((blok, i) => {
        if (blok.soort === 'kop') return <Kop key={i}>{blok.tekst}</Kop>
        if (blok.soort === 'lijst') {
          return (
            <ul key={i}>
              {blok.punten.map((punt, j) => (
                <li key={j}>{punt}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i}>
            {blok.regels.map((regel, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {regel}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
