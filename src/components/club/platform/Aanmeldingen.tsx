import { Mail, Phone } from 'lucide-react'
import { STATUS_WEERGAVE, isAanvraag, type PlatformAanmelding } from '@/lib/club/platform/tellingen'
import { vindPakket } from '@/lib/aiyourgym/pakketten'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'
import { nlDatum } from './datum'
import { adresVan } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'

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
export async function Aanmeldingen({ aanmeldingen, max }: AanmeldingenProps) {
  const taal = await getTaal()
  const p = PLATFORM[taal]
  const t = p.aanmeldingen
  const aanvragen = aanmeldingen?.filter(isAanvraag).length ?? 0
  return (
    <section aria-labelledby="platform-aanmeldingen-kop">
      <div className="club-sectiekop">
        <h2 id="platform-aanmeldingen-kop">{t.kop}</h2>
        <span>{aanmeldingen ? p.getoond(aanmeldingen.length, max, aanmeldingen.length >= max) : ''}</span>
      </div>
      {aanvragen > 0 && (
        <p className="club-melding club-platform-aanvraag-melding">
          <strong>{t.aanvragen(aanvragen)}</strong> {t.zelfContactUitleg}
        </p>
      )}
      {aanmeldingen === null ? (
        <p className="club-leeg">{t.fout}</p>
      ) : aanmeldingen.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <div className="club-tabel-wrap">
          <table className="club-tabel club-platform-tabel">
            <caption className="club-sr">{t.bijschrift}</caption>
            <thead>
              <tr>
                <th scope="col">{t.sportschool}</th>
                <th scope="col">{t.status}</th>
                <th scope="col">{t.pakket}</th>
                <th scope="col">{t.eigenaar}</th>
                <th scope="col">{t.datum}</th>
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
                      <span className="club-platform-sub">{adresVan(a.slug, subdomeinenActief())}</span>
                    </td>
                    <td>
                      <span className={`club-chip club-chip--${w.toon}`}>{p.status[a.status]}</span>
                      {aanvraag && <span className="club-platform-zelf">{t.zelfContact}</span>}
                    </td>
                    <td>
                      {vindPakket(a.pakket)?.naam ?? (a.pakket || p.onbekend)}
                      <span className="club-platform-sub">{p.vestigingen(a.aantalVestigingen)}</span>
                    </td>
                    <td>
                      <Contact a={a} />
                    </td>
                    <td className="club-platform-datum">
                      <time dateTime={a.aangemaaktOp}>{nlDatum(a.aangemaaktOp, taal)}</time>
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
