import { Mail, Phone } from 'lucide-react'
import { STATUS_WEERGAVE, isAanvraag, pakketNaam, type PlatformAanmelding } from '@/lib/club/platform/tellingen'
import { nlDatum } from './datum'

interface AanmeldingenProps {
  /** Nieuwste eerst; null = niet te lezen. */
  aanmeldingen: PlatformAanmelding[] | null
  max: number
}

function Contact({ a }: { a: PlatformAanmelding }) {
  return (
    <span className="club-platform-contact">
      <span className="club-platform-actie">{a.eigenaarNaam}</span>
      <a href={`mailto:${a.eigenaarEmail}`}>
        <Mail size={13} aria-hidden /> {a.eigenaarEmail}
      </a>
      <a href={`tel:${a.eigenaarTelefoon.replace(/[^\d+]/g, '')}`}>
        <Phone size={13} aria-hidden /> {a.eigenaarTelefoon}
      </a>
    </span>
  )
}

// Alle aanmeldingen van de website, nieuwste eerst. Een aanvraag (zonder
// Stripe) springt eruit: daar neemt Kane zelf contact op met de eigenaar.
export function Aanmeldingen({ aanmeldingen, max }: AanmeldingenProps) {
  const aanvragen = aanmeldingen?.filter(isAanvraag).length ?? 0
  return (
    <section aria-labelledby="platform-aanmeldingen-kop">
      <div className="club-sectiekop">
        <h2 id="platform-aanmeldingen-kop">Aanmeldingen</h2>
        <span>{aanmeldingen ? `${aanmeldingen.length} getoond, nieuwste eerst${aanmeldingen.length >= max ? ` (maximaal ${max})` : ''}` : ''}</span>
      </div>
      {aanvragen > 0 && (
        <p className="club-melding club-platform-aanvraag-melding">
          <strong>{aanvragen === 1 ? '1 aanvraag' : `${aanvragen} aanvragen`} zonder online betaling.</strong> Neem zelf contact op met de eigenaar; er gaat niets automatisch naar buiten.
        </p>
      )}
      {aanmeldingen === null ? (
        <p className="club-leeg">De aanmeldingen zijn nu niet te lezen.</p>
      ) : aanmeldingen.length === 0 ? (
        <p className="club-leeg">Nog geen aanmeldingen via de website.</p>
      ) : (
        <div className="club-tabel-wrap">
          <table className="club-tabel club-platform-tabel">
            <caption className="club-sr">Aanmeldingen voor AI Your Gym, nieuwste eerst</caption>
            <thead>
              <tr>
                <th scope="col">Sportschool</th>
                <th scope="col">Status</th>
                <th scope="col">Pakket</th>
                <th scope="col">Eigenaar</th>
                <th scope="col">Datum</th>
              </tr>
            </thead>
            <tbody>
              {aanmeldingen.map((a) => {
                const w = STATUS_WEERGAVE[a.status]
                const aanvraag = isAanvraag(a)
                return (
                  <tr key={a.id} data-aanvraag={aanvraag || undefined}>
                    <td>
                      <span className="club-platform-actie">{a.sportschoolNaam}</span>
                      <span className="club-platform-sub">{a.slug}.aiyourgym.com</span>
                    </td>
                    <td>
                      <span className={`club-chip club-chip--${w.toon}`}>{w.label}</span>
                      {aanvraag && <span className="club-platform-zelf">Zelf contact opnemen</span>}
                    </td>
                    <td>
                      {pakketNaam(a.pakket)}
                      <span className="club-platform-sub">{a.aantalVestigingen === 1 ? '1 vestiging' : `${a.aantalVestigingen} vestigingen`}</span>
                    </td>
                    <td>
                      <Contact a={a} />
                    </td>
                    <td className="club-platform-datum">
                      <time dateTime={a.aangemaaktOp}>{nlDatum(a.aangemaaktOp)}</time>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
