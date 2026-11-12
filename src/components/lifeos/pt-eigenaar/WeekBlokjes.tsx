import { CalendarPlus } from 'lucide-react'
import { afspraakLabel, datumLabel, type WeekBlok } from '@/lib/lifeos/pt-coaching/coach-overzicht'

// Twee blokjes per PT'er in het coach-overzicht (besluit Kane 11-11-2026): deze week
// en volgende week, elk "geweest", "ingepland" of "nog niet ingepland". Bij de
// beheerder is een leeg blokje een knop die het inplannen opent in die week, met het
// voorstel uit het vaste patroon van de PT'er (12-11-2026).
// Puur en zonder hooks: de server (eigenaren) en de client (beheerder) gebruiken het.

interface Props {
  deze: WeekBlok
  volgende: WeekBlok
  /** Alleen bij de beheerder: inplannen met een voorgestelde datum (YYYY-MM-DD) en tijd (HH:MM). */
  onKies?: (datum: string, tijd: string) => void
}

/** "di 18 nov 10:00" uit datum en tijd. */
function voorstelLabel(datum: string, tijd: string): string {
  const [j, m, d] = datum.split('-').map(Number)
  const dag = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(j, m - 1, d)))
    .replace(/\./g, '')
  return `${dag} ${tijd}`
}

function Blok({ week, blok, onKies }: { week: string; blok: WeekBlok; onKies?: (datum: string, tijd: string) => void }) {
  if (blok.soort === 'leeg') {
    const inhoud = (
      <>
        <span className="ptd-weekblok-week">{week}</span>
        <span className="ptd-weekblok-stand">
          {onKies ? <CalendarPlus size={13} strokeWidth={2.2} aria-hidden /> : null} Nog niet ingepland
        </span>
        {blok.volgensPatroon ? <span className="ptd-weekblok-voorstel">Vast moment {voorstelLabel(blok.voorstel, blok.tijd)}</span> : null}
      </>
    )
    return onKies ? (
      <button type="button" className="ptd-weekblok" data-soort="leeg" onClick={() => onKies(blok.voorstel, blok.tijd)}>
        {inhoud}
      </button>
    ) : (
      <span className="ptd-weekblok" data-soort="leeg">{inhoud}</span>
    )
  }
  const op = blok.op as string
  return (
    <span className="ptd-weekblok" data-soort={blok.soort}>
      <span className="ptd-weekblok-week">{week}</span>
      <span className="ptd-weekblok-stand">{blok.soort === 'gepland' ? afspraakLabel(op) : `Geweest ${datumLabel(op)}`}</span>
    </span>
  )
}

export function WeekBlokjes({ deze, volgende, onKies }: Props) {
  return (
    <div className="ptd-weekblokken">
      <Blok week="Deze week" blok={deze} onKies={onKies} />
      <Blok week="Volgende week" blok={volgende} onKies={onKies} />
    </div>
  )
}
