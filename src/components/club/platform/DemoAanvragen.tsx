import { Mail, Phone } from 'lucide-react'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'
import { DEMO_AANVRAAG } from '@/lib/aiyourgym/taal/woorden/website/demo-aanvraag'
import type { PlatformDemoAanvraag } from '@/lib/club/platform/demo-aanvragen'
import { AfgehandeldKnop } from './AfgehandeldKnop'
import { nlDatum, nlMoment } from './datum'

interface DemoAanvragenProps {
  /** Open eerst; null = niet te lezen. */
  aanvragen: PlatformDemoAanvraag[] | null
  max: number
}

function Aanvraag({ a, taal }: { a: PlatformDemoAanvraag; taal: Taal }) {
  const open = a.status === 'open'
  const p = PLATFORM[taal]
  const t = p.demo
  const d = DEMO_AANVRAAG[taal]
  const soort = (d.soorten as Record<string, string>)[a.soort] ?? a.soort
  const moment = (d.momenten as Record<string, string>)[a.moment] ?? a.moment
  return (
    <li className="club-platform-demo" data-open={open || undefined}>
      <div className="club-platform-info">
        <h3>{a.sportschool}</h3>
        <span className="club-platform-sub">
          {t.aangevraagd} <time dateTime={a.aangemaaktOp}>{nlMoment(a.aangemaaktOp, taal)}</time>
          {!open && a.afgehandeldOp && (
            <>
              {' '}
              · {t.afgehandeldOp} <time dateTime={a.afgehandeldOp}>{nlDatum(a.afgehandeldOp, taal)}</time>
            </>
          )}
        </span>
        <p className="club-platform-demo-feiten">
          <span className={open ? 'club-chip club-chip--merk' : 'club-chip club-chip--ok'}>{open ? t.open : t.afgehandeld}</span>
          <span className="club-chip">{soort}</span>
          <span className="club-chip">{p.vestigingen(a.vestigingen)}</span>
          <span className="club-chip">{t.liefst(moment.toLowerCase())}</span>
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
export async function DemoAanvragen({ aanvragen, max }: DemoAanvragenProps) {
  const taal = await getTaal()
  const t = PLATFORM[taal].demo
  const open = aanvragen?.filter((a) => a.status === 'open').length ?? 0
  return (
    <section aria-labelledby="platform-demo-kop">
      <div className="club-sectiekop">
        <h2 id="platform-demo-kop">{t.kop}</h2>
        <span>{aanvragen ? t.telling(open, aanvragen.length, max, aanvragen.length >= max) : ''}</span>
      </div>
      {open > 0 && (
        <p className="club-melding club-platform-aanvraag-melding">
          <strong>{t.wachten(open)}</strong> {t.belofte}
        </p>
      )}
      {aanvragen === null ? (
        <p className="club-leeg">{t.fout}</p>
      ) : aanvragen.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-platform-demo-lijst">
          {aanvragen.map((a) => (
            <Aanvraag key={a.id} a={a} taal={taal} />
          ))}
        </ul>
      )}
    </section>
  )
}
