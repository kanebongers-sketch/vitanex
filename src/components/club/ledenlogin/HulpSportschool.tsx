import { ChevronDown, LifeBuoy, Mail, Phone } from 'lucide-react'
import { belLink, type VestigingContact } from '@/lib/club/ledenlogin/lid-voor-app'

// In Profiel: "Hulp of vraag aan de sportschool". Klapt open met het
// telefoonnummer en e-mailadres van de eigen vestiging (uit club_vestigingen).
// Zonder JavaScript: een gewone details/summary.

interface HulpSportschoolProps {
  contact: VestigingContact
}

export function HulpSportschool({ contact }: HulpSportschoolProps) {
  const tel = belLink(contact.telefoon)
  const heeftContact = Boolean(tel || contact.email)
  return (
    <details className="club-mijn-hulp">
      <summary>
        <LifeBuoy size={18} aria-hidden />
        <span>Hulp of vraag aan de sportschool</span>
        <ChevronDown size={18} aria-hidden className="club-mijn-hulp-pijl" />
      </summary>
      <div className="club-mijn-hulp-inhoud">
        <p>
          {heeftContact
            ? `Neem gerust contact op met ${contact.naam}. We helpen je graag.`
            : `De contactgegevens van ${contact.naam} staan nog niet in de app. Loop even langs de balie.`}
        </p>
        {tel && contact.telefoon && (
          <a className="club-mijn-hulp-link" href={tel}>
            <Phone size={18} aria-hidden />
            <span>
              <small>Bellen</small>
              {contact.telefoon}
            </span>
          </a>
        )}
        {contact.email && (
          <a className="club-mijn-hulp-link" href={`mailto:${contact.email}`}>
            <Mail size={18} aria-hidden />
            <span>
              <small>Mailen</small>
              {contact.email}
            </span>
          </a>
        )}
      </div>
    </details>
  )
}
