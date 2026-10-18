import { Mail, Phone } from 'lucide-react'
import { momentLabel, soortLabel } from '@/lib/aiyourgym/demo-aanvraag'
import type { PlatformDemoAanvraag } from '@/lib/club/platform/demo-aanvragen'
import { AfgehandeldKnop } from './AfgehandeldKnop'
import { nlDatum, nlMoment } from './datum'

interface DemoAanvragenProps {
  /** Open eerst; null = niet te lezen. */
  aanvragen: PlatformDemoAanvraag[] | null
  max: number
}

function Aanvraag({ a }: { a: PlatformDemoAanvraag }) {
  const open = a.status === 'open'
  return (
    <li className="club-platform-demo" data-open={open || undefined}>
      <div className="club-platform-info">
        <h3>{a.sportschool}</h3>
        <span className="club-platform-sub">
          Aangevraagd <time dateTime={a.aangemaaktOp}>{nlMoment(a.aangemaaktOp)}</time>
          {!open && a.afgehandeldOp && (
            <>
              {' '}
              · afgehandeld <time dateTime={a.afgehandeldOp}>{nlDatum(a.afgehandeldOp)}</time>
            </>
          )}
        </span>
        <p className="club-platform-demo-feiten">
          <span className={open ? 'club-chip club-chip--merk' : 'club-chip club-chip--ok'}>{open ? 'Open' : 'Afgehandeld'}</span>
          <span className="club-chip">{soortLabel(a.soort)}</span>
          <span className="club-chip">{a.vestigingen === 1 ? '1 vestiging' : `${a.vestigingen} vestigingen`}</span>
          <span className="club-chip">Liefst: {momentLabel(a.moment).toLowerCase()}</span>
        </p>
      </div>
      <span className="club-platform-contact">
        <span className="club-platform-actie">{a.naam}</span>
        <a href={`tel:${a.telefoon.replace(/[^\d+]/g, '')}`}>
          <Phone size={13} aria-hidden /> {a.telefoon}
        </a>
        <a href={`mailto:${a.email}`}>
          <Mail size={13} aria-hidden /> {a.email}
        </a>
      </span>
      <AfgehandeldKnop id={a.id} naam={a.sportschool} status={a.status} />
      {a.opmerking && <p className="club-platform-demo-opmerking">{a.opmerking}</p>}
    </li>
  )
}

// De demo-aanvragen van de website: open eerst (oudste bovenaan), met contact
// om zelf te bellen. Er gaat niets automatisch naar buiten.
export function DemoAanvragen({ aanvragen, max }: DemoAanvragenProps) {
  const open = aanvragen?.filter((a) => a.status === 'open').length ?? 0
  return (
    <section aria-labelledby="platform-demo-kop">
      <div className="club-sectiekop">
        <h2 id="platform-demo-kop">Demo-aanvragen</h2>
        <span>{aanvragen ? `${open} open, ${aanvragen.length} getoond${aanvragen.length >= max ? ` (maximaal ${max})` : ''}` : ''}</span>
      </div>
      {open > 0 && (
        <p className="club-melding club-platform-aanvraag-melding">
          <strong>{open === 1 ? '1 sportschool wacht' : `${open} sportscholen wachten`} op een belletje.</strong> De website belooft een reactie binnen een werkdag.
        </p>
      )}
      {aanvragen === null ? (
        <p className="club-leeg">De demo-aanvragen zijn nu niet te lezen.</p>
      ) : aanvragen.length === 0 ? (
        <p className="club-leeg">Nog geen demo-aanvragen via de website.</p>
      ) : (
        <ul className="club-platform-demo-lijst">
          {aanvragen.map((a) => (
            <Aanvraag key={a.id} a={a} />
          ))}
        </ul>
      )}
    </section>
  )
}
