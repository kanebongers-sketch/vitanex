import { ChevronDown, LifeBuoy, Mail, Phone } from 'lucide-react'
import { belLink, type VestigingContact } from '@/lib/club/ledenlogin/lid-voor-app'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'

// In Profiel: "Hulp of vraag aan de sportschool". Klapt open met het
// telefoonnummer en e-mailadres van de eigen vestiging (uit club_vestigingen).
// Zonder JavaScript: een gewone details/summary.

interface HulpSportschoolProps {
  contact: VestigingContact
}

export async function HulpSportschool({ contact }: HulpSportschoolProps) {
  const t = LID_INLOGGEN[await getTaal()].hulp
  const tel = belLink(contact.telefoon)
  const heeftContact = Boolean(tel || contact.email)
  return (
    <details className="club-mijn-hulp">
      <summary>
        <LifeBuoy size={18} aria-hidden />
        <span>{t.kop}</span>
        <ChevronDown size={18} aria-hidden className="club-mijn-hulp-pijl" />
      </summary>
      <div className="club-mijn-hulp-inhoud">
        <p>
          {heeftContact ? t.contact(contact.naam) : t.geenContact(contact.naam)}
        </p>
        {tel && contact.telefoon && (
          <a className="club-mijn-hulp-link" href={tel}>
            <Phone size={18} aria-hidden />
            <span>
              <small>{t.bellen}</small>
              {contact.telefoon}
            </span>
          </a>
        )}
        {contact.email && (
          <a className="club-mijn-hulp-link" href={`mailto:${contact.email}`}>
            <Mail size={18} aria-hidden />
            <span>
              <small>{t.mailen}</small>
              {contact.email}
            </span>
          </a>
        )}
      </div>
    </details>
  )
}
