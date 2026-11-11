import { CalendarPlus } from 'lucide-react'
import { afspraakLabel, datumLabel, type WeekBlok } from '@/lib/lifeos/pt-coaching/coach-overzicht'

// Twee blokjes per PT'er in het coach-overzicht (besluit Kane 11-11-2026): deze week
// en volgende week, elk "geweest", "ingepland" of "nog niet ingepland". Bij de
// beheerder is een leeg blokje een knop die het inplannen opent in die week.
// Puur en zonder hooks: de server (eigenaren) en de client (beheerder) gebruiken het.

interface Props {
  deze: WeekBlok
  volgende: WeekBlok
  /** Alleen bij de beheerder: inplannen met een voorgestelde datum (YYYY-MM-DD). */
  onKies?: (voorstel: string) => void
}

function Blok({ week, blok, onKies }: { week: string; blok: WeekBlok; onKies?: (voorstel: string) => void }) {
  if (blok.soort === 'leeg') {
    const inhoud = (
      <>
        <span className="ptd-weekblok-week">{week}</span>
        <span className="ptd-weekblok-stand">
          {onKies ? <CalendarPlus size={13} strokeWidth={2.2} aria-hidden /> : null} Nog niet ingepland
        </span>
      </>
    )
    return onKies ? (
      <button type="button" className="ptd-weekblok" data-soort="leeg" onClick={() => onKies(blok.voorstel)}>
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
