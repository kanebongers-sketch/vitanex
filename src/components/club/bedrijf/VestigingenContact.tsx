import Link from 'next/link'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import type { VestigingContact } from '@/lib/club/bedrijf/opslag'

// Overzicht: adres, telefoon en e-mail per vestiging. Alleen lezen; aanpassen
// hoort bij Instellingen, Vestigingen (daar staan ze echt, niet dubbel).

interface VestigingenContactProps {
  vestigingen: VestigingContact[] | null
  href: string
}

export function VestigingenContact({ vestigingen, href }: VestigingenContactProps) {
  return (
    <section className="club-bedrijf-vestigingen" aria-labelledby="bedrijf-vestigingen-kop">
      <div className="club-bedrijf-sectiekop">
        <div>
          <h2 id="bedrijf-vestigingen-kop">Contact per vestiging</h2>
          <p className="club-hint">Deze gegevens horen bij de vestigingen zelf en staan hier ter controle. Je past ze aan onder Instellingen, Vestigingen, bij Contact.</p>
        </div>
        <Link href={href} className="club-knop club-knop--klein">
          Naar vestigingen <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      {vestigingen === null ? (
        <p className="club-melding club-melding--fout" role="alert">De vestigingen konden niet worden geladen.</p>
      ) : vestigingen.length === 0 ? (
        <p className="club-leeg">Nog geen vestigingen. Voeg de eerste toe bij Vestigingen.</p>
      ) : (
        <ul className="club-bedrijf-vlijst">
          {vestigingen.map((v) => (
            <li key={v.sleutel}>
              <strong>{v.naam}</strong>
              <span className={v.adres ? undefined : 'is-leeg'}>
                <MapPin size={14} aria-hidden /> {v.adres ?? 'Geen adres'}
              </span>
              <span className={v.telefoon ? undefined : 'is-leeg'}>
                <Phone size={14} aria-hidden /> {v.telefoon ?? 'Geen telefoon'}
              </span>
              <span className={v.email ? undefined : 'is-leeg'}>
                <Mail size={14} aria-hidden /> {v.email ?? 'Geen e-mail'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
