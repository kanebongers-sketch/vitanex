import Link from 'next/link'
import { ArrowRight, Mail, Phone } from 'lucide-react'
import { AYG_CONTACT, telLink, type AygContact } from '@/lib/aiyourgym/contact'
import { DEMO_AANVRAGEN } from './paden'

// Een dunne balk boven de kop met direct contact. Telefoon en e-mail komen uit
// src/lib/aiyourgym/contact.ts; zolang die leeg zijn staat er alleen de knop
// "Plan een gratis demo" (we verzinnen geen nummer of adres).

interface ContactBalkProps {
  contact?: AygContact
}

export function ContactBalk({ contact = AYG_CONTACT }: ContactBalkProps) {
  const telefoon = contact.telefoon?.trim() || null
  const email = contact.email?.trim() || null
  return (
    <div className="ayg-contactbalk">
      <div className="ayg-wrap ayg-contactbalk-rij">
        {(telefoon || email) && (
          <ul className="ayg-contactbalk-lijst" aria-label="Contact">
            {telefoon && (
              <li>
                <a href={telLink(telefoon)}>
                  <Phone size={14} aria-hidden /> {telefoon}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`}>
                  <Mail size={14} aria-hidden /> {email}
                </a>
              </li>
            )}
          </ul>
        )}
        <Link href={DEMO_AANVRAGEN} className="ayg-contactbalk-demo">
          Plan een gratis demo <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  )
}
